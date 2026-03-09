import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plane, Users, DollarSign, TrendingUp, AlertTriangle, Settings } from "lucide-react";
import Globe3D from "@/components/Globe3D";
import { DelayTrendChart, RouteRevenueChart, LoadFactorGauge } from "@/components/D3Charts";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// KPI Card Component
function KPICard({ title, value, subtitle, icon: Icon, trend, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1" data-testid={`kpi-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</p>
          <p className="text-3xl font-bold text-slate-100 mb-1" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
          {subtitle && <p className="text-sm text-slate-500" data-testid={`kpi-subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Flight Status Board
function FlightStatusBoard({ flights }) {
  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'boarding': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'departed': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'in-flight': 'bg-green-500/20 text-green-400 border-green-500/30',
      'landed': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'delayed': 'bg-red-500/20 text-red-400 border-red-500/30',
      'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return badges[status] || badges['scheduled'];
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden" data-testid="flight-status-board">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-bold text-slate-100 flex items-center" data-testid="flight-board-title">
          <Plane className="w-5 h-5 mr-2" />
          Live Flight Status
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Flight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Departure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Arrival</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Passengers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {flights.slice(0, 10).map((flight, index) => (
              <tr key={index} className="hover:bg-slate-750 transition-colors" data-testid={`flight-row-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-slate-200" data-testid={`flight-number-${index}`}>{flight.flight_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300" data-testid={`flight-route-${index}`}>
                    {flight.origin_code} → {flight.destination_code}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400" data-testid={`flight-departure-${index}`}>
                  {formatTime(flight.departure_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400" data-testid={`flight-arrival-${index}`}>
                  {formatTime(flight.arrival_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(flight.status)}`} data-testid={`flight-status-${index}`}>
                    {flight.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400" data-testid={`flight-passengers-${index}`}>
                  {flight.passengers}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({});
  const [flights, setFlights] = useState([]);
  const [activeFlights, setActiveFlights] = useState([]);
  const [airports, setAirports] = useState([]);
  const [delayData, setDelayData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [fleetStatus, setFleetStatus] = useState({});
  const [dataSeeded, setDataSeeded] = useState(false);

  // Seed data on first load
  useEffect(() => {
    const seedData = async () => {
      try {
        const response = await axios.post(`${API}/seed-data`);
        if (response.data.success) {
          setDataSeeded(true);
        }
      } catch (err) {
        console.error("Error seeding data:", err);
      }
    };
    seedData();
  }, []);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!dataSeeded) return;

      try {
        setLoading(true);
        
        const [
          kpisRes,
          flightsRes,
          activeFlightsRes,
          airportsRes,
          delayRes,
          revenueRes,
          fleetRes
        ] = await Promise.all([
          axios.get(`${API}/analytics/kpis`),
          axios.get(`${API}/flights?limit=50`),
          axios.get(`${API}/flights/active`),
          axios.get(`${API}/airports`),
          axios.get(`${API}/analytics/delays?days=30`),
          axios.get(`${API}/analytics/revenue-by-route?limit=10`),
          axios.get(`${API}/analytics/fleet-status`)
        ]);

        setKpis(kpisRes.data);
        setFlights(flightsRes.data);
        setActiveFlights(activeFlightsRes.data);
        setAirports(airportsRes.data);
        setDelayData(delayRes.data);
        setRevenueData(revenueRes.data);
        setFleetStatus(fleetRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [dataSeeded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center" data-testid="loading-indicator">
          <Plane className="w-16 h-16 text-blue-500 animate-bounce mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading SkyVision Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center" data-testid="error-message">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50" data-testid="app-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100" data-testid="app-title">SkyVision Analytics</h1>
                <p className="text-sm text-slate-400">Real-Time Airline Operations Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Last Updated</p>
                <p className="text-sm font-semibold text-slate-200">{new Date().toLocaleTimeString()}</p>
              </div>
              <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors" data-testid="settings-button">
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-cards-section">
          <KPICard
            title="Total Flights"
            value={kpis.total_flights?.toLocaleString() || "0"}
            subtitle="Last 30 days"
            icon={Plane}
            color="blue"
          />
          <KPICard
            title="Total Passengers"
            value={kpis.total_passengers?.toLocaleString() || "0"}
            subtitle={`${kpis.avg_load_factor?.toFixed(1) || 0}% load factor`}
            icon={Users}
            color="green"
          />
          <KPICard
            title="Total Revenue"
            value={`$${((kpis.total_revenue || 0) / 1000000).toFixed(2)}M`}
            subtitle="Last 30 days"
            icon={DollarSign}
            color="yellow"
          />
          <KPICard
            title="On-Time Performance"
            value={`${kpis.on_time_percentage?.toFixed(1) || 0}%`}
            subtitle={`Avg delay: ${kpis.avg_delay?.toFixed(0) || 0} min`}
            icon={TrendingUp}
            color={kpis.on_time_percentage >= 80 ? "green" : "red"}
          />
        </div>

        {/* 3D Globe and Load Factor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden" data-testid="globe-container">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-slate-100">Global Flight Network</h2>
              <p className="text-sm text-slate-400">{activeFlights.length} active flights</p>
            </div>
            <div className="h-[500px]">
              <Globe3D flights={activeFlights} airports={airports} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6" data-testid="load-factor-gauge">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Average Load Factor</h3>
              <div className="flex justify-center">
                <LoadFactorGauge value={kpis.avg_load_factor || 0} />
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6" data-testid="fleet-status-card">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Fleet Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Aircraft</span>
                  <span className="text-2xl font-bold text-slate-100">{fleetStatus.total_aircraft || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active</span>
                  <span className="text-lg font-semibold text-green-400">{fleetStatus.active || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Maintenance</span>
                  <span className="text-lg font-semibold text-yellow-400">{fleetStatus.maintenance || 0}</span>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Utilization Rate</span>
                    <span className="text-lg font-semibold text-blue-400">{fleetStatus.utilization_rate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${fleetStatus.utilization_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* D3 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="charts-section">
          <DelayTrendChart data={delayData} width={600} height={300} />
          <RouteRevenueChart data={revenueData} width={600} height={400} />
        </div>

        {/* Flight Status Board */}
        <FlightStatusBoard flights={flights} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              © 2025 SkyVision Analytics. Built with React, FastAPI, Three.js & D3.js
            </p>
            <div className="flex space-x-4">
              <span className="text-xs text-slate-500">API Status: <span className="text-green-400">●</span> Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
