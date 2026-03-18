# SkyVision Analytics

**Real-Time Airline Operations Intelligence Dashboard**

A production-grade full-stack application for airline operations management — featuring a live 3D globe with animated aircraft, AI-powered delay risk scoring, persistent MongoDB CRUD, real-time toast notifications, and interactive D3.js analytics.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Motor_3.3-47A248?logo=mongodb&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.160-000000?logo=threedotjs&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-7.8-F9A03C?logo=d3dotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## Live Features

### Interactive 3D Globe (Three.js + React Three Fiber)
The centerpiece of the dashboard is a fully interactive 3D Earth rendered with WebGL:

- **Animated aircraft icons** travel along their flight arc in real time, interpolated from actual `departure_time` / `arrival_time` timestamps stored in MongoDB. Each plane is a directional cone oriented along the tangent of its Bézier curve path — it points where it is going.
- **Color-coded flight arcs** drawn as quadratic Bézier curves between airports: green for in-flight, yellow for boarding, red for delayed.
- **Airport markers** at all 15 served airports worldwide. DFW (Dallas/Fort Worth) is highlighted in amber gold.
- **Hover tooltips** on each airport dot reveal the IATA code, city, and country, following the 3D position as the globe rotates.
- **Orbit controls** — drag to rotate, scroll to zoom, with damping for a natural feel.
- **Auto-rotation** with delta-time animation for frame-rate-independent smooth movement.
- **Atmosphere halo** and lat/lon wireframe grid for visual depth.
- **Live status legend** showing counts for in-flight, boarding, delayed, and active flights.

### Full CRUD — Flights Read and Written to MongoDB
Every operation persists to and reads from the MongoDB database via Motor (async driver):

- **Add Flight** — modal form with aircraft selector (populated from DB), IATA codes, datetime pickers, status, delay, passengers, revenue, distance. Immediately written to the `flights` collection.
- **Edit Flight** — pre-fills form from the selected row's live DB record. Patches only changed fields via `PUT /api/flights/{id}`.
- **Delete Flight** — confirmation dialog before issuing `DELETE /api/flights/{id}`. Removes the record from MongoDB permanently.
- **KPIs auto-refresh** after every write so totals (revenue, passenger count, on-time %) reflect the new state instantly.
- **Idempotent seeding** — the database is seeded once on first launch and never wiped on subsequent page loads, so every flight you add or edit persists across browser refreshes. A "Reset Data" button in the header lets you restore the full demo dataset on demand.

### Delay Risk Scoring Engine (Backend Analytics)
A custom analytics endpoint (`GET /api/analytics/delay-risk`) scores every scheduled or boarding flight departing in the next 24 hours using a multi-factor algorithm:

```
base_score  = min(50, historical_avg_delay_on_route / 90 × 50)   — up to 50 pts
load_score  = avg_load_factor_on_route / 100 × 25                 — up to 25 pts
multiplier  = 1.35 if departure_hour in peak windows else 1.0     — peak: 06-09, 15-19
risk_score  = min(100, (base_score + load_score) × multiplier)
```

Risk levels: **HIGH** (≥ 55) · **MEDIUM** (≥ 30) · **LOW** (< 30)

All factors are computed from aggregated historical data already stored in MongoDB's `route_analytics` collection — no external API calls, no hardcoded numbers.

The results surface in two places:
1. **Delay Risk Analysis panel** — a dedicated section above the flight table showing the top 8 highest-risk upcoming flights with a visual score progress bar, peak-hour flag, historical delay average, and average load factor.
2. **Risk badge column** in the flight table — every row with a risk score shows a color-coded badge (HIGH / MEDIUM / LOW) with a tooltip showing the full factor breakdown on hover.

### Searchable, Filterable Flight Table with CSV Export
The live flight board is a fully interactive data management interface:

- **Search** — real-time filtering by flight number, origin IATA code, or destination IATA code as you type.
- **Status filter** — dropdown to isolate any single flight status (scheduled, boarding, departed, in-flight, landed, delayed, cancelled).
- **"X of Y records"** count updates live as filters are applied.
- **Empty state** — a clean illustration when no flights match the search, rather than a blank table.
- **Revenue column** — formatted with `Intl.NumberFormat` currency notation (e.g. $42,300).
- **Delay indicator** — delay minutes shown inline next to the status badge (e.g. `DELAYED +45m`).
- **Export CSV** — downloads the current filtered view as a properly-quoted CSV with all columns including risk level. Works client-side with no server round-trip.

### Real-Time Toast Notifications (Sonner)
Every database mutation fires a contextual notification in the bottom-right corner:

| Action | Toast style | Example |
|---|---|---|
| Add flight | Success (green) | "Flight SV302 added · DFW → JFK" |
| Edit flight | Info (blue) | "Flight SV302 updated · status: DELAYED" |
| Delete flight | Error (red) | "Flight SV302 removed from database" |
| Reset demo data | Success or Error | "Demo data reset successfully" |

### D3.js Analytics Charts
Three custom SVG visualizations built with D3.js, all using the `useRef` + `useEffect` pattern with proper cleanup:

- **Delay Trend Line Chart** — 30-day rolling average delay with an animated path draw-on effect, area fill gradient, and interactive hover tooltips showing exact values per day.
- **Route Revenue Bar Chart** — top-10 routes by total revenue with staggered entrance animation, color scale, and hover tooltips showing route name, revenue, and flight count.
- **Load Factor Gauge** — semi-circular arc gauge with animated counter and color coding (green ≥ 80%, yellow ≥ 60%, red below).

### KPI Dashboard
Four live metric cards fed from aggregated MongoDB queries over the rolling 30-day window:

| Metric | Source |
|---|---|
| Total Flights | Count of flights in DB (last 30 days) |
| Total Passengers | Sum of passengers across all flights |
| Total Revenue | Sum of revenue, formatted in millions |
| On-Time Performance | % of flights with zero delay + avg delay minutes |

---

## Architecture

```
skyvision-analytics/
├── backend/
│   └── server.py              # FastAPI app — all models, endpoints, analytics
│
├── frontend/src/
│   ├── App.js                 # Main dashboard, CRUD handlers, state management
│   └── components/
│       ├── Globe3D.js         # Three.js globe — arcs, animated planes, markers
│       └── D3Charts.js        # Delay trend, revenue bar, load factor gauge
│
└── docker-compose.yml         # MongoDB + FastAPI + React orchestration
```

### Data Flow

```
MongoDB (Motor async)
    └── FastAPI endpoints  (/api/flights, /api/analytics/*, /api/analytics/delay-risk)
            └── React (Axios, Promise.all parallel fetch)
                    ├── Globe3D  →  Three.js WebGL canvas
                    ├── D3Charts →  SVG visualizations
                    └── App.js   →  KPI cards, flight table, risk panel
```

---

## API Reference

### Flight CRUD
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/flights?limit=100` | Paginated flight list, optional `?status=` filter |
| `GET` | `/api/flights/active` | In-flight / boarding / departed with airport coordinates |
| `POST` | `/api/flights` | Create a new flight record in MongoDB |
| `PUT` | `/api/flights/{id}` | Partial update — only provided fields are patched |
| `DELETE` | `/api/flights/{id}` | Remove flight from MongoDB |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/kpis` | Revenue, passengers, on-time %, load factor (30-day) |
| `GET` | `/api/analytics/delays?days=30` | Daily delay trend with on-time percentages |
| `GET` | `/api/analytics/fleet-status` | Aircraft counts and live utilization rate |
| `GET` | `/api/analytics/revenue-by-route?limit=10` | Top routes ranked by total revenue |
| `GET` | `/api/analytics/delay-risk` | Risk scores for all upcoming flights (next 24h) |
| `GET` | `/api/routes/analytics` | Full route performance table |

### Data Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/seed-data` | Seed DB if empty (idempotent — safe to call on every load) |
| `POST` | `/api/seed-data?force=true` | Wipe and regenerate all sample data |

Interactive API documentation available at `http://localhost:8001/docs` (Swagger UI).

---

## Database Collections

**`flights`** — 1,800+ records spanning 30 days of history + 7-day forecast
```json
{
  "id": "uuid",
  "flight_number": "SV302",
  "aircraft_id": "uuid",
  "origin_code": "DFW",
  "destination_code": "JFK",
  "departure_time": "2026-03-18T14:30:00+00:00",
  "arrival_time": "2026-03-18T18:15:00+00:00",
  "status": "in-flight",
  "delay_minutes": 0,
  "passengers": 176,
  "revenue": 52340.80,
  "distance_km": 2248.1
}
```

**`airports`** — 15 major international airports (JFK, LAX, ORD, LHR, DXB, SIN, NRT, SYD, CDG, FRA, AMS, HKG, MIA, ATL, DFW)

**`aircraft`** — 50 aircraft across 5 models (Boeing 737-800, 777-300ER, 787-9; Airbus A320, A350-900)

**`route_analytics`** — Pre-aggregated per-route statistics (avg delay, avg load factor, total revenue, profitability score) used by the delay-risk engine

---

## Quick Start

### Docker (Recommended)
```bash
docker-compose up --build
```
Open `http://localhost:3000` — data seeds automatically on first launch.

### Local Development

**Backend**
```bash
cd backend
pip install -r requirements.txt
# backend/.env: MONGO_URL=mongodb://localhost:27017  DB_NAME=skyvision
uvicorn server:app --reload --port 8001
```

**Frontend**
```bash
cd frontend
yarn install
# frontend/.env: REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

**Seed data**
```bash
curl -X POST http://localhost:8001/api/seed-data
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI framework | React 18.3 | Component model, hooks, state |
| 3D rendering | Three.js 0.160 + React Three Fiber 8 | WebGL globe and animation |
| 3D helpers | @react-three/drei 9.92 | OrbitControls, Line, Html |
| Data viz | D3.js 7.8 | SVG charts, scales, transitions |
| HTTP client | Axios | Parallel API calls via Promise.all |
| Notifications | Sonner | Toast system with dark theme |
| Styling | Tailwind CSS 3.4 + shadcn/ui | Dark dashboard theme |
| Icons | Lucide React | Consistent icon set |
| API framework | FastAPI 0.110 | Async Python, auto Swagger docs |
| DB driver | Motor 3.3 | Async MongoDB access |
| Validation | Pydantic v2 | Request/response models |
| Database | MongoDB | Collections for all domain objects |
| Containerization | Docker + Compose | One-command full-stack startup |

---

Some snapshots of all enhancements made:

<img width="1160" height="668" alt="globe" src="https://github.com/user-attachments/assets/a90780ec-7a38-4b48-b6df-984fb1ec9e66" />

<img width="1700" height="198" alt="db_enhancement" src="https://github.com/user-attachments/assets/1970818a-00bb-4858-9936-fbd71e354a23" />

<img width="1680" height="710" alt="delay_flights" src="https://github.com/user-attachments/assets/a4096833-b8d1-4f8c-a2fc-284dcd74c342" />

<img width="1736" height="610" alt="add_edit_export_functionality" src="https://github.com/user-attachments/assets/d8b9c3a7-71fc-40fa-9adf-f643fd8b5888" />


## Author

**Sharanya Gada**
- GitHub: https://github.com/gada-sharanya
- Email: sharanyagada@gmail.com
