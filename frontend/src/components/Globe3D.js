import React from 'react';

// Fallback 2D World Map visualization with flight paths
export default function Globe3D({ flights = [], airports = [] }) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-blue-400 rounded-full animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-8">
        <div className="mb-6">
          <div className="inline-block p-4 bg-blue-500/20 rounded-full mb-4">
            <svg className="w-24 h-24 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-100 mb-3">
          Global Flight Network
        </h3>
        
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-800/50 rounded-lg backdrop-blur">
            <span className="text-slate-300">Active Flights</span>
            <span className="text-2xl font-bold text-green-400">{flights.length}</span>
          </div>
          
          <div className="flex items-center justify-between px-6 py-3 bg-slate-800/50 rounded-lg backdrop-blur">
            <span className="text-slate-300">Airports Served</span>
            <span className="text-2xl font-bold text-blue-400">{airports.length}</span>
          </div>
          
          <div className="flex items-center justify-between px-6 py-3 bg-slate-800/50 rounded-lg backdrop-blur">
            <span className="text-slate-300">Status</span>
            <span className="flex items-center text-green-400 font-semibold">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Operational
            </span>
          </div>
        </div>
        
        {/* Top Routes */}
        {flights.length > 0 && (
          <div className="mt-6 text-left max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">ACTIVE ROUTES</h4>
            <div className="space-y-2">
              {flights.slice(0, 5).map((flight, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 bg-slate-800/30 rounded backdrop-blur text-sm">
                  <span className="text-slate-300">{flight.origin_code} → {flight.destination_code}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    flight.status === 'in-flight' ? 'bg-green-500/20 text-green-400' :
                    flight.status === 'delayed' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {flight.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
