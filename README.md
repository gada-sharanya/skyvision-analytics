# ✈️ SkyVision Analytics Dashboard

**Real-Time Airline Operations Intelligence Dashboard**

A comprehensive full-stack web application for airline operations management, featuring real-time flight tracking, advanced analytics, and stunning 3D visualizations.

![Tech Stack](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-4.5-47A248?logo=mongodb)
![Three.js](https://img.shields.io/badge/Three.js-0.160-000000?logo=three.js)
![D3.js](https://img.shields.io/badge/D3.js-7.8-F9A03C?logo=d3.js)

## 🌟 Features

### Core Functionality
- **🌍 Interactive 3D Globe** - Real-time flight path visualization using Three.js
- **📊 Advanced Analytics Dashboard** - D3.js powered charts and metrics
- **✈️ Live Flight Status Board** - Real-time departure/arrival tracking
- **📈 Predictive Analytics** - Delay trends and performance insights
- **🚀 Fleet Management** - Aircraft tracking and utilization monitoring
- **💰 Route Profitability** - Revenue analysis and optimization

### Technical Highlights
- ⚡ **React 19** with modern hooks and functional components
- 🐍 **Python FastAPI** backend with async/await patterns
- 🗄️ **MongoDB** for scalable data persistence
- 🎨 **Tailwind CSS** + **shadcn/ui** for beautiful UI
- 📦 **Docker** containerized for easy deployment
- 🔄 **Real-time updates** with automatic data refresh
- 📱 **Responsive design** that works on all devices

## 🏗️ Architecture

```
SkyVision Analytics
├── Frontend (React 19)
│   ├── 3D Globe (Three.js + react-three-fiber)
│   ├── D3.js Charts (Delay trends, Revenue analysis)
│   ├── Real-time Dashboard
│   └── Responsive UI (Tailwind CSS)
│
├── Backend (FastAPI)
│   ├── RESTful API endpoints
│   ├── MongoDB data models
│   ├── Analytics engine
│   └── Data generation utilities
│
└── Database (MongoDB)
    ├── Flights collection
    ├── Airports collection
    ├── Aircraft fleet collection
    └── Route analytics collection
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/gada-sharanya/skyvision-analytics.git
cd skyvision-analytics
```

2. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

The application will automatically seed sample data on first launch.

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="skyvision"
export CORS_ORIGINS="http://localhost:3000"

# Run the server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend Setup
```bash
cd frontend
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start development server
yarn start
```

## 📊 API Endpoints

### Core Endpoints
- `GET /api/` - API health check
- `POST /api/seed-data` - Initialize database with sample data
- `GET /api/airports` - List all airports
- `GET /api/aircraft` - List all aircraft
- `GET /api/flights` - List flights with filters
- `GET /api/flights/active` - Get currently active flights

### Analytics Endpoints
- `GET /api/analytics/kpis` - Key performance indicators
- `GET /api/analytics/delays` - Delay trends over time
- `GET /api/analytics/fleet-status` - Fleet utilization metrics
- `GET /api/analytics/revenue-by-route` - Top routes by revenue
- `GET /api/routes/analytics` - Route performance data

## 🎨 Key Components

### 3D Globe Visualization
The interactive 3D globe uses **Three.js** and **react-three-fiber** to display:
- Rotating Earth with atmosphere effect
- Flight path arcs between airports
- Airport markers with coordinates
- Color-coded flight status (in-flight, delayed, boarding)
- Interactive camera controls with auto-rotation

### D3.js Charts
Advanced data visualizations include:
- **Delay Trend Chart** - Animated line chart showing average delays
- **Route Revenue Chart** - Interactive bar chart for route profitability
- **Load Factor Gauge** - Semi-circular gauge with smooth animations
- Responsive tooltips and transitions

### Dashboard KPIs
Real-time metrics displaying:
- Total flights and passengers
- Revenue generation
- On-time performance
- Load factor percentages
- Fleet utilization rates

## 🎯 Project Structure

```
skyvision-analytics/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── Dockerfile            # Backend container
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application
│   │   ├── App.css           # Global styles
│   │   ├── components/
│   │   │   ├── Globe3D.js    # Three.js globe component
│   │   │   └── D3Charts.js   # D3.js visualizations
│   │   └── hooks/
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile            # Frontend container
│
├── docker-compose.yml         # Multi-container setup
└── README.md                 # This file
```

## 🔧 Technologies Used

### Frontend
- **React 19** - UI framework
- **@react-three/fiber 8.15** - React renderer for Three.js
- **@react-three/drei 9.92** - Helpers for react-three-fiber
- **Three.js 0.160** - 3D graphics library
- **D3.js 7.8** - Data visualization library
- **Axios** - HTTP client
- **Tailwind CSS 3.4** - Utility-first CSS
- **Lucide React** - Icon library

### Backend
- **FastAPI 0.110** - Modern Python web framework
- **Motor 3.3** - Async MongoDB driver
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **NumPy & Pandas** - Data processing

### Database
- **MongoDB 4.5** - NoSQL database

### DevOps
- **Docker & Docker Compose** - Containerization
- **CORS** - Cross-origin resource sharing

## 📈 Data Models

### Flight Model
```python
{
    "id": "uuid",
    "flight_number": "SV123",
    "aircraft_id": "uuid",
    "origin_code": "JFK",
    "destination_code": "LAX",
    "departure_time": "datetime",
    "arrival_time": "datetime",
    "status": "in-flight",
    "delay_minutes": 0,
    "passengers": 189,
    "revenue": 45000.00,
    "distance_km": 3983.5
}
```

### Airport Model
```python
{
    "id": "uuid",
    "code": "JFK",
    "name": "John F. Kennedy International",
    "city": "New York",
    "country": "USA",
    "latitude": 40.6413,
    "longitude": -73.7781,
    "timezone": "America/New_York"
}
```

## 🎓 Learning Outcomes

This project demonstrates:

1. **Advanced React Patterns**
   - Custom hooks for data fetching
   - Suspense for code splitting
   - State management with useState/useEffect
   - Performance optimization

2. **3D Graphics Programming**
   - Three.js scene setup and rendering
   - 3D coordinate transformations
   - Animation loops with useFrame
   - Interactive camera controls

3. **Data Visualization**
   - D3.js scales, axes, and paths
   - SVG manipulation with React hooks
   - Smooth transitions and animations
   - Interactive tooltips and events

4. **Full-Stack Development**
   - RESTful API design
   - Async/await patterns
   - Database modeling and queries
   - CORS and security considerations

5. **DevOps & Deployment**
   - Docker containerization
   - Multi-container orchestration
   - Environment variable management
   - Production-ready builds

## 🚢 Deployment

### Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Environment Variables

**Backend (.env)**
```bash
MONGO_URL=mongodb://mongodb:27017
DB_NAME=skyvision
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```bash
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
yarn test

# Lint
yarn lint
```

## 📝 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] User authentication and authorization
- [ ] Historical data analysis with ML models
- [ ] Weather integration for delays
- [ ] Mobile app (React Native)
- [ ] Advanced filters and search
- [ ] Export reports to PDF/Excel
- [ ] Multi-airline support
- [ ] Predictive maintenance alerts
- [ ] Route optimization recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Sharanya Gada**
- GitHub: https://github.com/gada-sharanya
- Email: sharanyagada@gmail.com

## 🙏 Acknowledgments

- Three.js community for amazing 3D graphics library
- D3.js for powerful data visualization tools
- FastAPI for modern Python web framework
- React team for the best UI library

---

**Built with ❤️ for the aviation industry**

*Showcasing full-stack development skills with React, FastAPI, Three.js, and D3.js*
