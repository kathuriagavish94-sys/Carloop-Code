from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'carloop-secret-key-2026')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    admin: dict

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Car(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    make: str
    model: str
    year: int
    price: float
    image: str
    gallery: Optional[List[str]] = []
    km_driven: int
    fuel_type: str
    transmission: str
    owners: Optional[int] = 1
    rto: Optional[str] = "DL"
    condition: Optional[str] = "Excellent"
    features: Optional[List[str]] = []
    specifications: Optional[dict] = {}
    is_featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CarCreate(BaseModel):
    make: str
    model: str
    year: int
    price: float
    image: str
    km_driven: int
    fuel_type: str
    transmission: str
    condition: Optional[str] = "Excellent"
    features: Optional[List[str]] = []
    is_featured: bool = False

class CarUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    image: Optional[str] = None
    km_driven: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    condition: Optional[str] = None
    features: Optional[List[str]] = None
    is_featured: Optional[bool] = None

class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    message: str
    car_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    message: str
    car_id: Optional[str] = None

def create_token(admin_id: str, email: str) -> str:
    payload = {
        'id': admin_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin = await db.admins.find_one({"id": payload['id']}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid token")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/")
async def root():
    return {"message": "Carloop API"}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: AdminLogin):
    admin = await db.admins.find_one({"email": credentials.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin['id'], admin['email'])
    return {
        "token": token,
        "admin": {"id": admin['id'], "email": admin['email'], "name": admin['name']}
    }

@api_router.get("/auth/me")
async def get_current_admin(admin: dict = Depends(verify_token)):
    return {"id": admin['id'], "email": admin['email'], "name": admin['name']}

@api_router.get("/cars", response_model=List[Car])
async def get_cars(featured: Optional[bool] = None):
    query = {}
    if featured is not None:
        query['is_featured'] = featured
    
    cars = await db.cars.find(query, {"_id": 0}).to_list(1000)
    for car in cars:
        if isinstance(car.get('created_at'), str):
            car['created_at'] = datetime.fromisoformat(car['created_at'])
    return cars

@api_router.get("/cars/{car_id}", response_model=Car)
async def get_car(car_id: str):
    car = await db.cars.find_one({"id": car_id}, {"_id": 0})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    if isinstance(car.get('created_at'), str):
        car['created_at'] = datetime.fromisoformat(car['created_at'])
    return car

@api_router.post("/cars", response_model=Car)
async def create_car(car_data: CarCreate, admin: dict = Depends(verify_token)):
    car = Car(**car_data.model_dump())
    doc = car.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.cars.insert_one(doc)
    return car

@api_router.put("/cars/{car_id}", response_model=Car)
async def update_car(car_id: str, car_update: CarUpdate, admin: dict = Depends(verify_token)):
    existing_car = await db.cars.find_one({"id": car_id}, {"_id": 0})
    if not existing_car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    update_data = {k: v for k, v in car_update.model_dump().items() if v is not None}
    if update_data:
        await db.cars.update_one({"id": car_id}, {"$set": update_data})
    
    updated_car = await db.cars.find_one({"id": car_id}, {"_id": 0})
    if isinstance(updated_car.get('created_at'), str):
        updated_car['created_at'] = datetime.fromisoformat(updated_car['created_at'])
    return Car(**updated_car)

@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str, admin: dict = Depends(verify_token)):
    result = await db.cars.delete_one({"id": car_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    return {"message": "Car deleted successfully"}

@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(enquiry_data: EnquiryCreate):
    enquiry = Enquiry(**enquiry_data.model_dump())
    doc = enquiry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.enquiries.insert_one(doc)
    return enquiry

@api_router.get("/enquiries", response_model=List[Enquiry])
async def get_enquiries(admin: dict = Depends(verify_token)):
    enquiries = await db.enquiries.find({}, {"_id": 0}).to_list(1000)
    for enquiry in enquiries:
        if isinstance(enquiry.get('created_at'), str):
            enquiry['created_at'] = datetime.fromisoformat(enquiry['created_at'])
    return enquiries

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    admin_exists = await db.admins.find_one({"email": "admin@carloop.com"})
    if not admin_exists:
        admin = Admin(
            email="admin@carloop.com",
            password_hash=pwd_context.hash("admin123"),
            name="Admin User"
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.admins.insert_one(doc)
        logger.info("Created default admin: admin@carloop.com / admin123")
    
    car_count = await db.cars.count_documents({})
    if car_count == 0:
        sample_cars = [
            CarCreate(
                make="Mercedes-Benz",
                model="E-Class",
                year=2021,
                price=3500000,
                image="https://images.pexels.com/photos/12070967/pexels-photo-12070967.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                km_driven=25000,
                fuel_type="Petrol",
                transmission="Automatic",
                condition="Excellent",
                features=["Sunroof", "Leather Seats", "Navigation"],
                is_featured=True
            ),
            CarCreate(
                make="BMW",
                model="3 Series",
                year=2020,
                price=2800000,
                image="https://images.unsplash.com/photo-1555215695-3004980ad54e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjA1NzR8MHwxfHNlYXJjaHwxfHxibXclMjAzJTIwc2VyaWVzfGVufDB8fHx8MTY3MjA4NDkxMnww&ixlib=rb-4.1.0&q=85",
                km_driven=30000,
                fuel_type="Diesel",
                transmission="Automatic",
                condition="Excellent",
                features=["Sunroof", "Alloy Wheels"],
                is_featured=True
            ),
            CarCreate(
                make="Audi",
                model="A4",
                year=2022,
                price=4200000,
                image="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjA1NzR8MHwxfHNlYXJjaHwxfHxhdWRpJTIwYTR8ZW58MHx8fHwxNjcyMDg0OTE1fDA&ixlib=rb-4.1.0&q=85",
                km_driven=18000,
                fuel_type="Petrol",
                transmission="Automatic",
                condition="Excellent",
                features=["Sunroof", "Leather Seats", "Premium Sound"],
                is_featured=True
            ),
            CarCreate(
                make="Maruti Suzuki",
                model="Swift",
                year=2019,
                price=550000,
                image="https://images.unsplash.com/photo-1583121274602-3e2820c69888?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjA1NzR8MHwxfHNlYXJjaHwxfHxtYXJ1dGklMjBzd2lmdHxlbnwwfHx8fDE2NzIwODQ5MTh8MA&ixlib=rb-4.1.0&q=85",
                km_driven=45000,
                fuel_type="Petrol",
                transmission="Manual",
                condition="Good",
                features=["Power Windows", "AC"],
                is_featured=False
            ),
            CarCreate(
                make="Hyundai",
                model="Creta",
                year=2021,
                price=1450000,
                image="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjA1NzR8MHwxfHNlYXJjaHwxfHxoeXVuZGFpJTIwY3JldGF8ZW58MHx8fHwxNjcyMDg0OTIxfDA&ixlib=rb-4.1.0&q=85",
                km_driven=32000,
                fuel_type="Diesel",
                transmission="Automatic",
                condition="Excellent",
                features=["Sunroof", "Touchscreen", "Rear Camera"],
                is_featured=False
            ),
            CarCreate(
                make="Honda",
                model="City",
                year=2020,
                price=980000,
                image="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w0NjA1NzR8MHwxfHNlYXJjaHwxfHxob25kYSUyMGNpdHl8ZW58MHx8fHwxNjcyMDg0OTI0fDA&ixlib=rb-4.1.0&q=85",
                km_driven=38000,
                fuel_type="Petrol",
                transmission="Manual",
                condition="Good",
                features=["Touchscreen", "Rear Camera"],
                is_featured=False
            )
        ]
        
        for car_data in sample_cars:
            car = Car(**car_data.model_dump())
            doc = car.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.cars.insert_one(doc)
        
        logger.info(f"Created {len(sample_cars)} sample cars")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()