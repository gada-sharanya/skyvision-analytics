from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="SkyVision Analytics API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== DATA MODELS ====================

class Airport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # IATA code
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: str

class Aircraft(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    registration: str
    model: str
    manufacturer: str
    capacity: int
    year_manufactured: int
    status: str  # active, maintenance, retired

class Flight(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    flight_number: str
    aircraft_id: str
    origin_code: str
    destination_code: str
    departure_time: datetime
    arrival_time: datetime
    status: str  # scheduled, boarding, departed, in-flight, landed, delayed, cancelled
    delay_minutes: int = 0
    passengers: int
    revenue: float
    distance_km: float

class RouteAnalytics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    route: str  # "JFK-LAX"
    origin_code: str
    destination_code: str
    total_flights: int
    avg_passengers: float
    avg_load_factor: float
    total_revenue: float
    avg_delay_minutes: float
    profitability_score: float

class DelayAnalytics(BaseModel):
    date: str
    total_flights: int
    delayed_flights: int
    avg_delay: float
    on_time_percentage: float

class FleetStatus(BaseModel):
    total_aircraft: int
    active: int
    maintenance: int
    utilization_rate: float

# ==================== HELPER FUNCTIONS ====================

def generate_sample_airports():
    """Generate realistic airport data"""
    airports = [
        {"code": "JFK", "name": "John F. Kennedy International", "city": "New York", "country": "USA", "latitude": 40.6413, "longitude": -73.7781, "timezone": "America/New_York"},
        {"code": "LAX", "name": "Los Angeles International", "city": "Los Angeles", "country": "USA", "latitude": 33.9416, "longitude": -118.4085, "timezone": "America/Los_Angeles"},
        {"code": "ORD", "name": "O'Hare International", "city": "Chicago", "country": "USA", "latitude": 41.9742, "longitude": -87.9073, "timezone": "America/Chicago"},
        {"code": "LHR", "name": "London Heathrow", "city": "London", "country": "UK", "latitude": 51.4700, "longitude": -0.4543, "timezone": "Europe/London"},
        {"code": "DXB", "name": "Dubai International", "city": "Dubai", "country": "UAE", "latitude": 25.2532, "longitude": 55.3657, "timezone": "Asia/Dubai"},
        {"code": "SIN", "name": "Singapore Changi", "city": "Singapore", "country": "Singapore", "latitude": 1.3644, "longitude": 103.9915, "timezone": "Asia/Singapore"},
        {"code": "NRT", "name": "Narita International", "city": "Tokyo", "country": "Japan", "latitude": 35.7720, "longitude": 140.3929, "timezone": "Asia/Tokyo"},
        {"code": "SYD", "name": "Sydney Kingsford Smith", "city": "Sydney", "country": "Australia", "latitude": -33.9399, "longitude": 151.1753, "timezone": "Australia/Sydney"},
        {"code": "CDG", "name": "Charles de Gaulle", "city": "Paris", "country": "France", "latitude": 49.0097, "longitude": 2.5479, "timezone": "Europe/Paris"},
        {"code": "FRA", "name": "Frankfurt Airport", "city": "Frankfurt", "country": "Germany", "latitude": 50.0379, "longitude": 8.5622, "timezone": "Europe/Berlin"},
        {"code": "AMS", "name": "Amsterdam Schiphol", "city": "Amsterdam", "country": "Netherlands", "latitude": 52.3105, "longitude": 4.7683, "timezone": "Europe/Amsterdam"},
        {"code": "HKG", "name": "Hong Kong International", "city": "Hong Kong", "country": "Hong Kong", "latitude": 22.3080, "longitude": 113.9185, "timezone": "Asia/Hong_Kong"},
        {"code": "MIA", "name": "Miami International", "city": "Miami", "country": "USA", "latitude": 25.7959, "longitude": -80.2870, "timezone": "America/New_York"},
        {"code": "ATL", "name": "Hartsfield-Jackson Atlanta", "city": "Atlanta", "country": "USA", "latitude": 33.6407, "longitude": -84.4277, "timezone": "America/New_York"},
        {"code": "DFW", "name": "Dallas/Fort Worth", "city": "Dallas", "country": "USA", "latitude": 32.8998, "longitude": -97.0403, "timezone": "America/Chicago"},
    ]
    return [Airport(**{**apt, "id": str(uuid.uuid4())}) for apt in airports]

def generate_sample_aircraft():
    """Generate realistic aircraft fleet"""
    models = [
        {"model": "Boeing 737-800", "manufacturer": "Boeing", "capacity": 189},
        {"model": "Boeing 777-300ER", "manufacturer": "Boeing", "capacity": 396},
        {"model": "Airbus A320", "manufacturer": "Airbus", "capacity": 180},
        {"model": "Airbus A350-900", "manufacturer": "Airbus", "capacity": 325},
        {"model": "Boeing 787-9", "manufacturer": "Boeing", "capacity": 296},
    ]
    
    aircraft = []
    for i in range(50):
        model_data = random.choice(models)
        aircraft.append(Aircraft(
            id=str(uuid.uuid4()),
            registration=f"N{random.randint(100, 999)}{chr(65 + random.randint(0, 25))}{chr(65 + random.randint(0, 25))}",
            model=model_data["model"],
            manufacturer=model_data["manufacturer"],
            capacity=model_data["capacity"],
            year_manufactured=random.randint(2010, 2024),
            status=random.choices(["active", "maintenance"], weights=[0.92, 0.08])[0]
        ))
    return aircraft

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km"""
    from math import radians, sin, cos, sqrt, atan2
    R = 6371  # Earth's radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

def generate_sample_flights(airports, aircraft):
    """Generate realistic flight data"""
    flights = []
    now = datetime.now(timezone.utc)
    
    # Generate flights for the past 30 days and next 7 days
    for day_offset in range(-30, 7):
        date = now + timedelta(days=day_offset)
        num_flights = random.randint(40, 60)
        
        for _ in range(num_flights):
            origin = random.choice(airports)
            destination = random.choice([a for a in airports if a.code != origin.code])
            plane = random.choice([a for a in aircraft if a.status == "active"])
            
            # Calculate flight details
            distance = calculate_distance(origin.latitude, origin.longitude, 
                                        destination.latitude, destination.longitude)
            flight_hours = distance / 800  # Average speed 800 km/h
            
            departure = date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59))
            arrival = departure + timedelta(hours=flight_hours)
            
            # Determine status based on time
            time_until_departure = (departure - now).total_seconds() / 3600
            if time_until_departure < -flight_hours:
                status = "landed"
            elif time_until_departure < 0:
                status = "in-flight"
            elif time_until_departure < 2:
                status = "boarding"
            else:
                status = "scheduled"
            
            # Random delays
            delay = 0
            if random.random() < 0.25:  # 25% chance of delay
                delay = random.randint(15, 180)
                if status in ["scheduled", "boarding"]:
                    status = "delayed"
            
            passengers = random.randint(int(plane.capacity * 0.6), plane.capacity)
            load_factor = passengers / plane.capacity
            revenue = passengers * distance * random.uniform(0.10, 0.20)  # Revenue per passenger-km
            
            flights.append(Flight(
                id=str(uuid.uuid4()),
                flight_number=f"SV{random.randint(100, 999)}",
                aircraft_id=plane.id,
                origin_code=origin.code,
                destination_code=destination.code,
                departure_time=departure,
                arrival_time=arrival,
                status=status,
                delay_minutes=delay,
                passengers=passengers,
                revenue=revenue,
                distance_km=distance
            ))
    
    return flights

# ==================== API ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "SkyVision Analytics API", "version": "1.0.0"}

@api_router.post("/seed-data")
async def seed_data():
    """Seed the database with sample data"""
    try:
        # Clear existing data
        await db.airports.delete_many({})
        await db.aircraft.delete_many({})
        await db.flights.delete_many({})
        await db.route_analytics.delete_many({})
        
        # Generate and insert airports
        airports = generate_sample_airports()
        await db.airports.insert_many([apt.model_dump() for apt in airports])
        
        # Generate and insert aircraft
        aircraft = generate_sample_aircraft()
        await db.aircraft.insert_many([ac.model_dump() for ac in aircraft])
        
        # Generate and insert flights
        flights = generate_sample_flights(airports, aircraft)
        flights_data = []
        for flight in flights:
            flight_dict = flight.model_dump()
            flight_dict['departure_time'] = flight_dict['departure_time'].isoformat()
            flight_dict['arrival_time'] = flight_dict['arrival_time'].isoformat()
            flights_data.append(flight_dict)
        
        await db.flights.insert_many(flights_data)
        
        # Generate route analytics
        route_stats = {}
        for flight in flights:
            route_key = f"{flight.origin_code}-{flight.destination_code}"
            if route_key not in route_stats:
                route_stats[route_key] = {
                    "flights": [],
                    "origin": flight.origin_code,
                    "destination": flight.destination_code
                }
            route_stats[route_key]["flights"].append(flight)
        
        route_analytics = []
        for route_key, data in route_stats.items():
            flights_list = data["flights"]
            total_flights = len(flights_list)
            avg_passengers = sum(f.passengers for f in flights_list) / total_flights
            total_revenue = sum(f.revenue for f in flights_list)
            avg_delay = sum(f.delay_minutes for f in flights_list) / total_flights
            
            # Calculate average load factor
            avg_capacity = 250  # Approximate
            avg_load_factor = (avg_passengers / avg_capacity) * 100
            
            # Calculate profitability score (0-100)
            profitability = min(100, (avg_load_factor * 0.6 + (100 - min(avg_delay, 100)) * 0.4))
            
            route_analytics.append(RouteAnalytics(
                route=route_key,
                origin_code=data["origin"],
                destination_code=data["destination"],
                total_flights=total_flights,
                avg_passengers=avg_passengers,
                avg_load_factor=avg_load_factor,
                total_revenue=total_revenue,
                avg_delay_minutes=avg_delay,
                profitability_score=profitability
            ))
        
        await db.route_analytics.insert_many([ra.model_dump() for ra in route_analytics])
        
        return {
            "success": True,
            "data": {
                "airports": len(airports),
                "aircraft": len(aircraft),
                "flights": len(flights),
                "routes": len(route_analytics)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/airports", response_model=List[Airport])
async def get_airports():
    """Get all airports"""
    airports = await db.airports.find({}, {"_id": 0}).to_list(1000)
    return airports

@api_router.get("/aircraft", response_model=List[Aircraft])
async def get_aircraft():
    """Get all aircraft"""
    aircraft = await db.aircraft.find({}, {"_id": 0}).to_list(1000)
    return aircraft

@api_router.get("/flights", response_model=List[Flight])
async def get_flights(status: Optional[str] = None, limit: int = 100):
    """Get flights with optional status filter"""
    query = {}
    if status:
        query["status"] = status
    
    flights = await db.flights.find(query, {"_id": 0}).sort("departure_time", -1).to_list(limit)
    
    # Convert ISO strings back to datetime
    for flight in flights:
        if isinstance(flight['departure_time'], str):
            flight['departure_time'] = datetime.fromisoformat(flight['departure_time'])
        if isinstance(flight['arrival_time'], str):
            flight['arrival_time'] = datetime.fromisoformat(flight['arrival_time'])
    
    return flights

@api_router.get("/flights/active")
async def get_active_flights():
    """Get currently active flights (boarding, departed, in-flight)"""
    active_statuses = ["boarding", "departed", "in-flight"]
    flights = await db.flights.find(
        {"status": {"$in": active_statuses}}, 
        {"_id": 0}
    ).to_list(1000)
    
    # Convert ISO strings and add airport details
    airports_dict = {}
    airports = await db.airports.find({}, {"_id": 0}).to_list(1000)
    for apt in airports:
        airports_dict[apt["code"]] = apt
    
    for flight in flights:
        if isinstance(flight['departure_time'], str):
            flight['departure_time'] = datetime.fromisoformat(flight['departure_time'])
        if isinstance(flight['arrival_time'], str):
            flight['arrival_time'] = datetime.fromisoformat(flight['arrival_time'])
        
        # Add airport coordinates for 3D visualization
        flight['origin'] = airports_dict.get(flight['origin_code'], {})
        flight['destination'] = airports_dict.get(flight['destination_code'], {})
    
    return flights

@api_router.get("/routes/analytics", response_model=List[RouteAnalytics])
async def get_route_analytics():
    """Get route performance analytics"""
    routes = await db.route_analytics.find({}, {"_id": 0}).sort("total_revenue", -1).to_list(1000)
    return routes

@api_router.get("/analytics/delays")
async def get_delay_analytics(days: int = 30):
    """Get delay analytics over time"""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    
    flights = await db.flights.find(
        {"departure_time": {"$gte": start_date.isoformat()}},
        {"_id": 0}
    ).to_list(10000)
    
    # Group by date
    daily_stats = {}
    for flight in flights:
        date = flight['departure_time'][:10]  # Get YYYY-MM-DD
        if date not in daily_stats:
            daily_stats[date] = {"total": 0, "delayed": 0, "total_delay": 0}
        
        daily_stats[date]["total"] += 1
        if flight["delay_minutes"] > 0:
            daily_stats[date]["delayed"] += 1
            daily_stats[date]["total_delay"] += flight["delay_minutes"]
    
    # Convert to list
    result = []
    for date, stats in sorted(daily_stats.items()):
        avg_delay = stats["total_delay"] / stats["total"] if stats["total"] > 0 else 0
        on_time_pct = ((stats["total"] - stats["delayed"]) / stats["total"] * 100) if stats["total"] > 0 else 100
        
        result.append(DelayAnalytics(
            date=date,
            total_flights=stats["total"],
            delayed_flights=stats["delayed"],
            avg_delay=round(avg_delay, 2),
            on_time_percentage=round(on_time_pct, 2)
        ))
    
    return result

@api_router.get("/analytics/fleet-status")
async def get_fleet_status():
    """Get current fleet status"""
    aircraft = await db.aircraft.find({}, {"_id": 0}).to_list(1000)
    
    total = len(aircraft)
    active = sum(1 for a in aircraft if a["status"] == "active")
    maintenance = sum(1 for a in aircraft if a["status"] == "maintenance")
    
    # Calculate utilization (active flights / active aircraft)
    now = datetime.now(timezone.utc)
    active_flights = await db.flights.count_documents({
        "status": {"$in": ["boarding", "departed", "in-flight"]}
    })
    
    utilization = (active_flights / active) * 100 if active > 0 else 0
    
    return FleetStatus(
        total_aircraft=total,
        active=active,
        maintenance=maintenance,
        utilization_rate=round(utilization, 2)
    )

@api_router.get("/analytics/kpis")
async def get_kpis():
    """Get key performance indicators"""
    # Get recent flights (last 30 days)
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=30)
    
    flights = await db.flights.find(
        {"departure_time": {"$gte": start_date.isoformat()}},
        {"_id": 0}
    ).to_list(10000)
    
    if not flights:
        return {
            "total_flights": 0,
            "total_passengers": 0,
            "total_revenue": 0,
            "avg_load_factor": 0,
            "on_time_percentage": 0,
            "avg_delay": 0
        }
    
    total_flights = len(flights)
    total_passengers = sum(f["passengers"] for f in flights)
    total_revenue = sum(f["revenue"] for f in flights)
    delayed_flights = sum(1 for f in flights if f["delay_minutes"] > 0)
    total_delay = sum(f["delay_minutes"] for f in flights)
    
    # Calculate average load factor
    aircraft_list = await db.aircraft.find({}, {"_id": 0}).to_list(1000)
    avg_capacity = sum(a["capacity"] for a in aircraft_list) / len(aircraft_list) if aircraft_list else 250
    avg_load_factor = (total_passengers / (total_flights * avg_capacity)) * 100
    
    on_time_pct = ((total_flights - delayed_flights) / total_flights * 100)
    avg_delay = total_delay / total_flights
    
    return {
        "total_flights": total_flights,
        "total_passengers": total_passengers,
        "total_revenue": round(total_revenue, 2),
        "avg_load_factor": round(avg_load_factor, 2),
        "on_time_percentage": round(on_time_pct, 2),
        "avg_delay": round(avg_delay, 2)
    }

@api_router.get("/analytics/revenue-by-route")
async def get_revenue_by_route(limit: int = 10):
    """Get top routes by revenue"""
    routes = await db.route_analytics.find(
        {}, 
        {"_id": 0}
    ).sort("total_revenue", -1).limit(limit).to_list(limit)
    
    return routes

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
