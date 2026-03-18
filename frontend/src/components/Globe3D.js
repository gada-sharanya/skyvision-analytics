import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

const R = 2; // Globe radius in scene units
const UP = new THREE.Vector3(0, 1, 0); // reused across all animated plane orientations

// Convert geographic coordinates to a 3D vector on the sphere
function latLonToVec3(lat, lon, r = R) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Build a quadratic bezier arc between two lat/lon points
function buildArcPoints(lat1, lon1, lat2, lon2) {
  const a = latLonToVec3(lat1, lon1);
  const b = latLonToVec3(lat2, lon2);
  const ctrl = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  ctrl.normalize().multiplyScalar(R + a.distanceTo(b) * 0.42);
  return new THREE.QuadraticBezierCurve3(a, ctrl, b).getPoints(60);
}

function FlightArc({ origin, destination, status }) {
  const points = useMemo(
    () => buildArcPoints(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [origin.code, destination.code]
  );

  const color =
    status === 'in-flight' ? '#4ade80' :
    status === 'delayed'   ? '#f87171' :
    status === 'boarding'  ? '#facc15' : '#60a5fa';

  return (
    <Line
      points={points}
      color={color}
      lineWidth={0.9}
      transparent
      opacity={0.55}
    />
  );
}

// Animated plane icon that moves along its route arc in real time (or loops for demo data)
function AnimatedPlane({ flight }) {
  const meshRef = useRef();

  // Use coordinates directly from the enriched active-flight objects
  const origin      = flight.origin      || {};
  const destination = flight.destination || {};

  const curve = useMemo(() => {
    if (!origin.latitude || !destination.latitude) return null;
    return new THREE.QuadraticBezierCurve3(
      latLonToVec3(origin.latitude, origin.longitude),
      (() => {
        const a   = latLonToVec3(origin.latitude, origin.longitude);
        const b   = latLonToVec3(destination.latitude, destination.longitude);
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(R + a.distanceTo(b) * 0.42);
        return mid;
      })(),
      latLonToVec3(destination.latitude, destination.longitude)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude]);

  const depMs = useMemo(() => new Date(flight.departure_time).getTime(), [flight.departure_time]);
  const arrMs = useMemo(() => new Date(flight.arrival_time).getTime(),   [flight.arrival_time]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !curve) return;

    const now      = Date.now();
    const duration = arrMs - depMs;
    // Real-time interpolation when timestamps are current; otherwise loop for demo
    let progress = (duration > 0 && now >= depMs && now <= arrMs)
      ? (now - depMs) / duration
      : (clock.getElapsedTime() % 80) / 80;

    progress = Math.max(0.02, Math.min(0.98, progress));

    const pos     = curve.getPoint(progress);
    const tangent = curve.getTangent(progress).normalize();

    meshRef.current.position.copy(pos);
    // Orient the cone body along the direction of travel
    if (Math.abs(tangent.dot(UP)) < 0.999) {
      meshRef.current.quaternion.setFromUnitVectors(UP, tangent);
    }
  });

  if (!curve) return null;

  const color =
    flight.status === 'in-flight' ? '#4ade80' :
    flight.status === 'delayed'   ? '#f87171' : '#facc15';

  return (
    <group ref={meshRef}>
      {/* Directional cone body */}
      <mesh>
        <coneGeometry args={[0.025, 0.09, 5]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Soft glow halo */}
      <mesh>
        <sphereGeometry args={[0.038, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

function AirportMarker({ airport, isHovered, onHover }) {
  const pos = useMemo(
    () => latLonToVec3(airport.latitude, airport.longitude, R + 0.028),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [airport.code]
  );

  const isDFW = airport.code === 'DFW';
  const size   = isHovered || isDFW ? 0.07 : 0.043;
  const color  = isDFW ? '#fbbf24' : isHovered ? '#fb923c' : '#f97316';

  return (
    <mesh
      position={pos}
      onPointerOver={(e) => { e.stopPropagation(); onHover(airport); }}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} />

      {isHovered && (
        <Html distanceFactor={8} center>
          <div style={{
            background: 'rgba(2, 8, 23, 0.93)',
            border: '1px solid #1e40af',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#f1f5f9',
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>
              {airport.code}
            </span>
            {' — '}
            <span style={{ color: '#cbd5e1' }}>{airport.city}</span>
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>
              {airport.country}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function GlobeScene({ flights, airports }) {
  const groupRef = useRef();
  const [hoveredAirport, setHoveredAirport] = useState(null);

  // Slow auto-rotation; pauses on pointer interaction
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.055;
    }
  });

  // Pre-resolve origin/destination objects for arcs
  const airportMap = useMemo(() => {
    const map = {};
    airports.forEach(a => { map[a.code] = a; });
    return map;
  }, [airports]);

  const activePairs = useMemo(() => {
    return flights.slice(0, 40).reduce((acc, f) => {
      const o = airportMap[f.origin_code];
      const d = airportMap[f.destination_code];
      if (o && d) acc.push({ flight: f, origin: o, destination: d });
      return acc;
    }, []);
  }, [flights, airportMap]);

  return (
    <group ref={groupRef}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshPhongMaterial
          color="#0c1f35"
          emissive="#081422"
          specular="#1e3a8a"
          shininess={22}
        />
      </mesh>

      {/* Lat/lon grid wireframe */}
      <mesh>
        <sphereGeometry args={[R + 0.004, 24, 24]} />
        <meshBasicMaterial
          color="#1d4ed8"
          wireframe
          transparent
          opacity={0.11}
        />
      </mesh>

      {/* Subtle atmosphere halo */}
      <mesh>
        <sphereGeometry args={[R + 0.14, 32, 32]} />
        <meshBasicMaterial
          color="#1e40af"
          transparent
          opacity={0.045}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Flight path arcs */}
      {activePairs.map(({ flight, origin, destination }, i) => (
        <FlightArc
          key={flight.id || i}
          origin={origin}
          destination={destination}
          status={flight.status}
        />
      ))}

      {/* Animated plane icons — one per active flight */}
      {flights.slice(0, 30).map((f, i) => (
        <AnimatedPlane key={f.id || i} flight={f} />
      ))}

      {/* Airport dots */}
      {airports.map(apt => (
        <AirportMarker
          key={apt.code}
          airport={apt}
          isHovered={hoveredAirport?.code === apt.code}
          onHover={setHoveredAirport}
        />
      ))}
    </group>
  );
}

export default function Globe3D({ flights = [], airports = [] }) {
  const inFlight = flights.filter(f => f.status === 'in-flight').length;
  const delayed  = flights.filter(f => f.status === 'delayed').length;
  const boarding = flights.filter(f => f.status === 'boarding').length;
  const other    = flights.length - inFlight - delayed - boarding;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1.2, 5.8], fov: 44 }}
        gl={{ antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[7, 7, 8]} intensity={1.7} color="#ffffff" />
        <pointLight position={[-6, -4, -6]} intensity={0.35} color="#3b82f6" />

        <GlobeScene flights={flights} airports={airports} />

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3.5}
          maxDistance={9}
        />
      </Canvas>

      {/* Status legend */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        left: 14,
        display: 'flex',
        gap: 14,
        fontSize: 11,
        color: '#94a3b8',
        pointerEvents: 'none',
      }}>
        <span><span style={{ color: '#4ade80' }}>●</span> In-Flight ({inFlight})</span>
        <span><span style={{ color: '#60a5fa' }}>●</span> Active ({other})</span>
        <span><span style={{ color: '#facc15' }}>●</span> Boarding ({boarding})</span>
        <span><span style={{ color: '#f87171' }}>●</span> Delayed ({delayed})</span>
        <span><span style={{ color: '#fbbf24' }}>●</span> Airport</span>
      </div>

      {/* Drag hint */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 14,
        fontSize: 10,
        color: '#475569',
        pointerEvents: 'none',
      }}>
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
