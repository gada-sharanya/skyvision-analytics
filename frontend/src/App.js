import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import {
  Plane, Users, DollarSign, TrendingUp, AlertTriangle, Settings,
  Plus, Pencil, Trash2, X, RefreshCw, Database, Download, Search, AlertCircle,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Globe3D from "@/components/Globe3D";
import { DelayTrendChart, RouteRevenueChart, LoadFactorGauge } from "@/components/D3Charts";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, trend, color = "blue" }) {
  const colorClasses = {
    blue:   "from-blue-500 to-blue-600",
    green:  "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red:    "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
  };
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1"
             data-testid={`kpi-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</p>
          <p className="text-3xl font-bold text-slate-100 mb-1"
             data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500"
               data-testid={`kpi-subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>{subtitle}</p>
          )}
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

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["scheduled", "boarding", "departed", "in-flight", "landed", "delayed", "cancelled"];

const EMPTY_FORM = {
  flight_number: "", aircraft_id: "", origin_code: "", destination_code: "",
  departure_time: "", arrival_time: "", status: "scheduled",
  delay_minutes: 0, passengers: 0, revenue: 0, distance_km: 0,
};

const RISK_STYLES = {
  HIGH:   "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  LOW:    "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_BADGES = {
  scheduled:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  boarding:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  departed:   "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "in-flight":"bg-green-500/20 text-green-400 border-green-500/30",
  landed:     "bg-gray-500/20 text-gray-400 border-gray-500/30",
  delayed:    "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled:  "bg-red-500/20 text-red-400 border-red-500/30",
};

// ─── Flight Form Modal ────────────────────────────────────────────────────────
function FlightModal({ open, onClose, onSave, initialData, aircraft }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      const toLocalISO = (dt) => {
        const d = new Date(dt);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };
      setForm({
        ...initialData,
        departure_time: initialData.departure_time ? toLocalISO(initialData.departure_time) : "",
        arrival_time:   initialData.arrival_time   ? toLocalISO(initialData.arrival_time)   : "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        delay_minutes: Number(form.delay_minutes),
        passengers:    Number(form.passengers),
        revenue:       Number(form.revenue),
        distance_km:   Number(form.distance_km),
        departure_time: new Date(form.departure_time).toISOString(),
        arrival_time:   new Date(form.arrival_time).toISOString(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="flight-modal">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-slate-100">{initialData ? "Edit Flight" : "Add Flight"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Flight Number</label>
              <input className={inputCls} name="flight_number" value={form.flight_number} onChange={handleChange} required placeholder="SV123" />
            </div>
            <div>
              <label className={labelCls}>Aircraft</label>
              <select className={inputCls} name="aircraft_id" value={form.aircraft_id} onChange={handleChange} required>
                <option value="">Select aircraft</option>
                {aircraft.map(ac => <option key={ac.id} value={ac.id}>{ac.registration} — {ac.model}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Origin (IATA)</label>
              <input className={inputCls} name="origin_code" value={form.origin_code} onChange={handleChange} required maxLength={3} placeholder="JFK" />
            </div>
            <div>
              <label className={labelCls}>Destination (IATA)</label>
              <input className={inputCls} name="destination_code" value={form.destination_code} onChange={handleChange} required maxLength={3} placeholder="LAX" />
            </div>
            <div>
              <label className={labelCls}>Departure Time</label>
              <input type="datetime-local" className={inputCls} name="departure_time" value={form.departure_time} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelCls}>Arrival Time</label>
              <input type="datetime-local" className={inputCls} name="arrival_time" value={form.arrival_time} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Delay (min)</label>
              <input type="number" className={inputCls} name="delay_minutes" value={form.delay_minutes} onChange={handleChange} min={0} />
            </div>
            <div>
              <label className={labelCls}>Passengers</label>
              <input type="number" className={inputCls} name="passengers" value={form.passengers} onChange={handleChange} min={0} required />
            </div>
            <div>
              <label className={labelCls}>Revenue ($)</label>
              <input type="number" className={inputCls} name="revenue" value={form.revenue} onChange={handleChange} min={0} step="0.01" required />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Distance (km)</label>
              <input type="number" className={inputCls} name="distance_km" value={form.distance_km} onChange={handleChange} min={0} step="0.1" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-sm disabled:opacity-50">
              {saving ? "Saving…" : initialData ? "Save Changes" : "Add Flight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Flight Status Board ──────────────────────────────────────────────────────
function FlightStatusBoard({ flights, aircraft, onAdd, onEdit, onDelete, delayRiskMap }) {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flights.filter(f => {
      const matchesSearch = !q ||
        f.flight_number.toLowerCase().includes(q) ||
        f.origin_code.toLowerCase().includes(q) ||
        f.destination_code.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [flights, search, statusFilter]);

  const exportCSV = () => {
    const headers = [
      'Flight', 'Origin', 'Destination', 'Departure (UTC)', 'Arrival (UTC)',
      'Status', 'Delay (min)', 'Passengers', 'Revenue ($)', 'Delay Risk',
    ];
    const rows = filtered.map(f => {
      const risk = delayRiskMap[f.id];
      return [
        f.flight_number, f.origin_code, f.destination_code,
        new Date(f.departure_time).toISOString(),
        new Date(f.arrival_time).toISOString(),
        f.status, f.delay_minutes, f.passengers,
        f.revenue.toFixed(2),
        risk ? `${risk.risk_level} (${risk.risk_score})` : 'N/A',
      ];
    });
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `skyvision_flights_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fmt = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtRevenue = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden" data-testid="flight-status-board">
      {/* Header */}
      <div className="p-5 border-b border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2" data-testid="flight-board-title">
            <Plane className="w-5 h-5" />
            Live Flight Status
            <span className="text-sm font-normal text-slate-500 ml-1">
              {filtered.length === flights.length
                ? `${flights.length} records`
                : `${filtered.length} of ${flights.length}`}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600 text-xs rounded-lg transition-colors"
              title="Export filtered results to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              data-testid="add-flight-button"
            >
              <Plus className="w-4 h-4" />
              Add Flight
            </button>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search flight, origin or destination…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No flights match your search.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                {['Flight','Route','Departure','Arrival','Status','Risk','Pax','Revenue','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filtered.slice(0, 20).map((flight, index) => {
                const risk = delayRiskMap[flight.id];
                return (
                  <tr
                    key={flight.id || index}
                    className="hover:bg-slate-700/30 transition-colors"
                    data-testid={`flight-row-${index}`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-200" data-testid={`flight-number-${index}`}>
                        {flight.flight_number}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-slate-300 font-mono" data-testid={`flight-route-${index}`}>
                        {flight.origin_code} → {flight.destination_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400" data-testid={`flight-departure-${index}`}>
                      {fmt(flight.departure_time)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400" data-testid={`flight-arrival-${index}`}>
                      {fmt(flight.arrival_time)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap" data-testid={`flight-status-${index}`}>
                      <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full border ${STATUS_BADGES[flight.status] || STATUS_BADGES.scheduled}`}>
                        {flight.status.toUpperCase()}
                      </span>
                      {flight.delay_minutes > 0 && (
                        <span className="ml-1.5 text-xs text-red-400">+{flight.delay_minutes}m</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {risk ? (
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded border ${RISK_STYLES[risk.risk_level]}`}
                          title={`Score: ${risk.risk_score} | Hist. delay: ${risk.factors.historical_avg_delay_min}min | Load: ${risk.factors.avg_load_factor_pct}%`}
                        >
                          {risk.risk_level}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-slate-400" data-testid={`flight-passengers-${index}`}>
                      {flight.passengers.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-green-400">
                      {fmtRevenue(flight.revenue)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEdit(flight)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                          title="Edit flight"
                          data-testid={`edit-flight-${index}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(flight)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                          title="Delete flight"
                          data-testid={`delete-flight-${index}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 20 && (
        <div className="px-5 py-3 border-t border-slate-700 text-xs text-slate-500 text-center">
          Showing first 20 of {filtered.length} results — use search or filter to narrow down
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const isInitialLoad               = useRef(true);

  const [kpis, setKpis]             = useState({});
  const [flights, setFlights]       = useState([]);
  const [activeFlights, setActiveFlights] = useState([]);
  const [airports, setAirports]     = useState([]);
  const [aircraft, setAircraft]     = useState([]);
  const [delayData, setDelayData]   = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [fleetStatus, setFleetStatus] = useState({});
  const [delayRisk, setDelayRisk]   = useState([]);
  const [dataSeeded, setDataSeeded] = useState(false);

  // Flight management state
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reseeding, setReseeding]       = useState(false);

  // Build a flight_id → risk object map for O(1) badge lookups in the table
  const delayRiskMap = useMemo(() => {
    const map = {};
    delayRisk.forEach(r => { map[r.flight_id] = r; });
    return map;
  }, [delayRisk]);

  // ── Seed on first load (skips if DB already has data) ──────────────────────
  useEffect(() => {
    const seedData = async () => {
      try {
        const res = await axios.post(`${API}/seed-data`);
        if (res.data.success) setDataSeeded(true);
      } catch {
        // Data may already exist — attempt fetch anyway
        setDataSeeded(true);
      }
    };
    seedData();
  }, []);

  const handleReseedData = async () => {
    if (!window.confirm("Reset all demo data? Any flights you've added or edited will be lost.")) return;
    setReseeding(true);
    try {
      await axios.post(`${API}/seed-data?force=true`);
      setDataSeeded(false);
      setTimeout(() => setDataSeeded(true), 100);
      toast.success("Demo data reset successfully");
    } catch {
      toast.error("Failed to reset data");
    } finally {
      setReseeding(false);
    }
  };

  // ── Fetch all data from MongoDB via API ────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!dataSeeded) return;
    try {
      if (isInitialLoad.current) setLoading(true);

      const [
        kpisRes, flightsRes, activeFlightsRes, airportsRes,
        aircraftRes, delayRes, revenueRes, fleetRes, riskRes,
      ] = await Promise.all([
        axios.get(`${API}/analytics/kpis`),
        axios.get(`${API}/flights?limit=100`),
        axios.get(`${API}/flights/active`),
        axios.get(`${API}/airports`),
        axios.get(`${API}/aircraft`),
        axios.get(`${API}/analytics/delays?days=30`),
        axios.get(`${API}/analytics/revenue-by-route?limit=10`),
        axios.get(`${API}/analytics/fleet-status`),
        axios.get(`${API}/analytics/delay-risk`),
      ]);

      setKpis(kpisRes.data);
      setFlights(flightsRes.data);
      setActiveFlights(activeFlightsRes.data);
      setAirports(airportsRes.data);
      setAircraft(aircraftRes.data);
      setDelayData(delayRes.data);
      setRevenueData(revenueRes.data);
      setFleetStatus(fleetRes.data);
      setDelayRisk(riskRes.data);
      setLoading(false);
      isInitialLoad.current = false;
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [dataSeeded]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Refresh flights + KPIs after CRUD ─────────────────────────────────────
  const refreshFlights = async () => {
    const [flightsRes, kpisRes, riskRes] = await Promise.all([
      axios.get(`${API}/flights?limit=100`),
      axios.get(`${API}/analytics/kpis`),
      axios.get(`${API}/analytics/delay-risk`),
    ]);
    setFlights(flightsRes.data);
    setKpis(kpisRes.data);
    setDelayRisk(riskRes.data);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleAddFlight = () => {
    setEditingFlight(null);
    setModalOpen(true);
  };

  const handleEditFlight = (flight) => {
    setEditingFlight(flight);
    setModalOpen(true);
  };

  const handleSaveFlight = async (formData) => {
    if (editingFlight) {
      await axios.put(`${API}/flights/${editingFlight.id}`, formData);
      toast.info(`Flight ${editingFlight.flight_number} updated`, {
        description: `${formData.origin_code} → ${formData.destination_code} · ${formData.status.toUpperCase()}`,
      });
    } else {
      await axios.post(`${API}/flights`, formData);
      toast.success(`Flight ${formData.flight_number} added`, {
        description: `${formData.origin_code} → ${formData.destination_code}`,
      });
    }
    await refreshFlights();
  };

  const handleDeleteFlight = (flight) => setDeleteConfirm(flight);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const fn = deleteConfirm.flight_number;
    await axios.delete(`${API}/flights/${deleteConfirm.id}`);
    setDeleteConfirm(null);
    await refreshFlights();
    toast.error(`Flight ${fn} removed from database`);
  };

  // ── Loading / error screens ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center" data-testid="loading-indicator">
          <Plane className="w-16 h-16 text-blue-500 animate-bounce mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading SkyVision Analytics…</p>
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

  const highRisk   = delayRisk.filter(r => r.risk_level === 'HIGH');
  const medRisk    = delayRisk.filter(r => r.risk_level === 'MEDIUM');
  const lowRisk    = delayRisk.filter(r => r.risk_level === 'LOW');

  return (
    <div className="min-h-screen bg-slate-950">
      <Toaster position="bottom-right" theme="dark" richColors closeButton />

      {/* ── Header ── */}
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
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-400">
                  <span className="text-slate-200 font-semibold">{flights.length}</span> flights in DB
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Auto-refresh</p>
                <p className="text-sm font-semibold text-slate-200">{new Date().toLocaleTimeString()}</p>
              </div>
              <button
                onClick={handleReseedData}
                disabled={reseeding}
                title="Reset demo data"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200 text-xs disabled:opacity-50"
                data-testid="reseed-button"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Reset Data</span>
              </button>
              <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700" data-testid="settings-button">
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-cards-section">
          <KPICard title="Total Flights"      value={kpis.total_flights?.toLocaleString() || "0"}       subtitle="Last 30 days"                                    icon={Plane}      color="blue"   />
          <KPICard title="Total Passengers"   value={kpis.total_passengers?.toLocaleString() || "0"}    subtitle={`${kpis.avg_load_factor?.toFixed(1) || 0}% load factor`} icon={Users}      color="green"  />
          <KPICard title="Total Revenue"      value={`$${((kpis.total_revenue || 0) / 1_000_000).toFixed(2)}M`} subtitle="Last 30 days"                           icon={DollarSign} color="yellow" />
          <KPICard title="On-Time Performance" value={`${kpis.on_time_percentage?.toFixed(1) || 0}%`}  subtitle={`Avg delay: ${kpis.avg_delay?.toFixed(0) || 0} min`} icon={TrendingUp} color={kpis.on_time_percentage >= 80 ? "green" : "red"} />
        </div>

        {/* ── 3D Globe + sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden" data-testid="globe-container">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-slate-100">Global Flight Network</h2>
              <p className="text-sm text-slate-400">{activeFlights.length} active flights — drag to rotate, scroll to zoom</p>
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
                      style={{ width: `${Math.min(fleetStatus.utilization_rate || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── D3 Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="charts-section">
          <DelayTrendChart data={delayData} width={600} height={300} />
          <RouteRevenueChart data={revenueData} width={600} height={400} />
        </div>

        {/* ── Delay Risk Analysis ── */}
        {delayRisk.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8" data-testid="risk-section">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Upcoming Delay Risk
                <span className="text-sm font-normal text-slate-500">— Next 24 hours · {delayRisk.length} flights</span>
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
                  HIGH: {highRisk.length}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  MEDIUM: {medRisk.length}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-green-500/20 text-green-400 border-green-500/30">
                  LOW: {lowRisk.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    {['Flight','Route','Departure','Risk Level','Score','Peak Hour?','Hist. Avg Delay','Avg Load'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {delayRisk.slice(0, 8).map(r => (
                    <tr key={r.flight_id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-200">{r.flight_number}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">{r.route}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(r.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${RISK_STYLES[r.risk_level]}`}>
                          {r.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-16">
                            <div
                              className={`h-1.5 rounded-full ${r.risk_level === 'HIGH' ? 'bg-red-500' : r.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${r.risk_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{r.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {r.factors.peak_hour
                          ? <span className="text-yellow-400 font-semibold">Yes</span>
                          : <span className="text-slate-600">No</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.factors.historical_avg_delay_min} min</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{r.factors.avg_load_factor_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Flight Status Board ── */}
        <FlightStatusBoard
          flights={flights}
          aircraft={aircraft}
          onAdd={handleAddFlight}
          onEdit={handleEditFlight}
          onDelete={handleDeleteFlight}
          delayRiskMap={delayRiskMap}
        />
      </main>

      {/* ── Add / Edit Modal ── */}
      <FlightModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFlight}
        initialData={editingFlight}
        aircraft={aircraft}
      />

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-testid="delete-confirm-modal">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete Flight</h3>
            <p className="text-slate-400 text-sm mb-6">
              Permanently delete flight{' '}
              <span className="text-slate-200 font-semibold">{deleteConfirm.flight_number}</span>{' '}
              ({deleteConfirm.origin_code} → {deleteConfirm.destination_code}) from the database?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-sm" data-testid="confirm-delete-button">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            © 2025 SkyVision Analytics · React · FastAPI · MongoDB · Three.js · D3.js
          </p>
          <span className="text-xs text-slate-500">
            API Status: <span className="text-green-400">●</span> Operational
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
