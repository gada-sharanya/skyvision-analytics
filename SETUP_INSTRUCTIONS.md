# 🚀 SkyVision Analytics - Local Setup Guide

## 📦 Download & Extract

You have downloaded `skyvision-analytics.zip` - Extract it to your desired location:

```bash
# Extract the zip file
unzip skyvision-analytics.zip -d skyvision-analytics
cd skyvision-analytics
```

## 🔧 Local Setup & Testing

### Option 1: Using Docker (Recommended - Easiest)

**Prerequisites**: Docker and Docker Compose installed

```bash
# Start all services
docker-compose up --build

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8001
# - API Docs: http://localhost:8001/docs

# To stop:
# Press Ctrl+C, then run:
docker-compose down
```

### Option 2: Manual Setup (For Development)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Make sure MongoDB is running (install separately)
# Then start the backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Backend Environment Variables** (backend/.env):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=skyvision
CORS_ORIGINS=http://localhost:3000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies (use yarn, not npm)
yarn install

# Start development server
yarn start

# Frontend will open at http://localhost:3000
```

**Frontend Environment Variables** (frontend/.env):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📊 Seed Data

The application automatically seeds data when you make a POST request to `/api/seed-data`:

```bash
# Or just visit the frontend - it seeds automatically on first load
curl -X POST http://localhost:8001/api/seed-data
```

## 🧪 Testing the Application

1. **Visit Frontend**: http://localhost:3000
2. **Check KPI Cards**: Should show flight metrics
3. **View D3.js Charts**: Scroll down to see delay trends and revenue charts
4. **Flight Status Board**: Live flight data at the bottom
5. **API Documentation**: http://localhost:8001/docs (Swagger UI)

### Test API Endpoints

```bash
# Get KPIs
curl http://localhost:8001/api/analytics/kpis

# Get flights
curl http://localhost:8001/api/flights

# Get delay analytics
curl http://localhost:8001/api/analytics/delays

# Get active flights
curl http://localhost:8001/api/flights/active
```

## 📤 Push to GitHub

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `skyvision-analytics`
3. Description: "Real-time airline operations intelligence dashboard with React, FastAPI, D3.js"
4. Choose Public
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Push Code

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SkyVision Analytics - Airline Operations Dashboard"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/skyvision-analytics.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Update README

Before pushing, update these sections in `README.md`:

1. Replace `yourusername` with your actual GitHub username in all links
2. Update the **Author** section at the bottom:
   ```markdown
   ## 👨‍💻 Author
   
   **Your Name**
   - GitHub: [@your_username](https://github.com/your_username)
   - LinkedIn: [Your Name](https://linkedin.com/in/your-profile)
   - Email: your.email@example.com
   ```

## 🎯 For the Hiring Manager

### Share with Hiring Manager

Send them:
1. **GitHub Repository Link**: `https://github.com/YOUR_USERNAME/skyvision-analytics`
2. **Quick Start Instructions**:

```
Hi [Hiring Manager Name],

I've built SkyVision Analytics, a comprehensive airline operations dashboard showcasing 
my React and full-stack skills. 

GitHub: https://github.com/YOUR_USERNAME/skyvision-analytics
Live Demo: [if you deploy it somewhere]

To run locally with Docker:
1. git clone https://github.com/YOUR_USERNAME/skyvision-analytics.git
2. cd skyvision-analytics
3. docker-compose up --build
4. Visit http://localhost:3000

Key Features:
- React 18 with modern hooks
- D3.js advanced visualizations (bonus requirement)
- FastAPI backend with MongoDB
- Real-time flight tracking
- Professional dashboard UI
- 1,800+ flights with realistic data

Looking forward to walking you through the code!

Best regards,
[Your Name]
```

## 🎤 Demo Walkthrough (5-10 minutes)

1. **Introduction** (1 min)
   - "Built a real-time airline operations dashboard"
   - "Demonstrates React, D3.js, FastAPI, and MongoDB skills"

2. **Frontend Tour** (3 min)
   - Show KPI cards with live metrics
   - Demonstrate D3.js delay trend chart (hover tooltips)
   - Show route revenue bar chart with animations
   - Explain load factor gauge visualization
   - Display flight status board

3. **Code Highlights** (3 min)
   - Show React component structure (`App.js`)
   - Explain D3.js integration with React hooks (`D3Charts.js`)
   - Walk through FastAPI endpoints (`backend/server.py`)
   - Show data generation algorithm

4. **Backend & Data** (2 min)
   - Open API docs (http://localhost:8001/docs)
   - Demonstrate a few API calls
   - Explain MongoDB data models
   - Show realistic data generation

5. **Docker & Deployment** (1 min)
   - Show docker-compose.yml
   - Explain containerization approach

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed
**Solution**: Make sure MongoDB is running
```bash
# On macOS with Homebrew:
brew services start mongodb-community

# On Ubuntu:
sudo systemctl start mongod

# Or use Docker for MongoDB only:
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Issue: Port Already in Use
**Solution**: Change ports in docker-compose.yml or kill the process:
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Find process using port 8001
lsof -ti:8001 | xargs kill -9
```

### Issue: Frontend Can't Connect to Backend
**Solution**: Check REACT_APP_BACKEND_URL in `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Issue: yarn.lock conflicts
**Solution**: Delete node_modules and reinstall:
```bash
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

## 📚 Project Structure Overview

```
skyvision-analytics/
├── README.md                    # Main documentation
├── PROJECT_GUIDE.md            # Technical guide & interview tips
├── docker-compose.yml          # Multi-container setup
├── backend/
│   ├── server.py              # FastAPI application (500+ lines)
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend container
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main dashboard
│   │   ├── components/
│   │   │   ├── D3Charts.js   # D3.js visualizations
│   │   │   └── Globe3D.js    # Flight network display
│   │   ├── App.css           # Global styles
│   │   └── index.js          # Entry point
│   ├── package.json          # Node dependencies
│   ├── Dockerfile            # Frontend container
│   └── .env                  # Frontend environment variables
└── .gitignore                # Git ignore rules
```

## 🎓 Key Skills Demonstrated

- ✅ **React 18**: Modern hooks (useState, useEffect, useMemo)
- ✅ **D3.js 7**: Advanced SVG visualizations with transitions
- ✅ **FastAPI**: Async/await, Pydantic models, REST APIs
- ✅ **MongoDB**: NoSQL database design with Motor (async driver)
- ✅ **Docker**: Multi-container orchestration
- ✅ **Full-Stack**: Complete backend-frontend integration
- ✅ **UI/UX**: Professional design with Tailwind CSS
- ✅ **Data Engineering**: Realistic data generation algorithms
- ✅ **Code Quality**: Clean, organized, well-documented code

## 💡 Interview Tips

**When asked about React**:
- "Used React 18's latest features including modern hooks"
- "Implemented custom data fetching patterns with useEffect"
- "Optimized performance with useMemo for expensive calculations"

**When asked about D3.js**:
- "Integrated D3 with React using the ref pattern"
- "Created animated line charts with gradient fills"
- "Built interactive tooltips with hover events"
- "Used D3 scales, axes, and transitions for smooth animations"

**When asked about Backend**:
- "Designed RESTful API with FastAPI's async capabilities"
- "Used Motor for async MongoDB operations"
- "Implemented complex analytics with data aggregations"
- "Generated realistic data using statistical distributions"

**When asked about the project choice**:
- "Chose airline domain to demonstrate understanding of complex business logic"
- "Focused on data visualization because it's crucial for operations dashboards"
- "Built production-ready code, not a tutorial-level project"

## 🚀 Ready to Impress!

Your project is complete and ready to showcase. The hiring manager will see:
1. Strong technical skills across the full stack
2. Real-world problem-solving ability
3. Professional code quality
4. Modern development practices
5. Passion for programming (you built this on your own!)

**Good luck with your interview! You've got this! 🎯**

---

**Need Help?**
- Check `README.md` for detailed documentation
- Read `PROJECT_GUIDE.md` for technical deep-dive
- Review code comments for implementation details
