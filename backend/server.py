from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Response, UploadFile, File
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
import csv
import io

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

class CarUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    image: Optional[str] = None
    gallery: Optional[List[str]] = None
    km_driven: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    owners: Optional[int] = None
    rto: Optional[str] = None
    condition: Optional[str] = None
    features: Optional[List[str]] = None
    specifications: Optional[dict] = None
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

class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    youtube_url: str
    video_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestimonialCreate(BaseModel):
    customer_name: str
    youtube_url: str
    is_active: bool = True

def create_token(admin_id: str, email: str) -> str:
    payload = {
        'id': admin_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def extract_youtube_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats"""
    import re
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/shorts\/([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")

def convert_google_drive_url(url: str) -> str:
    """Convert Google Drive share URL to direct image URL"""
    import re
    if 'drive.google.com' in url:
        match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
        if match:
            file_id = match.group(1)
            return f"https://drive.google.com/uc?export=view&id={file_id}"
    return url

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

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

@api_router.get("/")
async def root():
    return {"message": "Carloop API"}

@api_router.post("/customer/auth/session")
async def create_customer_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid session: {str(e)}")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data.get("picture")
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/customer/auth/me")
async def get_customer_profile(user: User = Depends(get_current_user)):
    return user

@api_router.post("/customer/auth/logout")
async def customer_logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none")
    return {"message": "Logged out successfully"}

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
    # Convert Google Drive URLs
    car_dict = car_data.model_dump()
    car_dict['image'] = convert_google_drive_url(car_dict['image'])
    
    if car_dict.get('gallery'):
        car_dict['gallery'] = [convert_google_drive_url(url) for url in car_dict['gallery']]
    
    car = Car(**car_dict)
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
    
    # Convert Google Drive URLs if present
    if 'image' in update_data:
        update_data['image'] = convert_google_drive_url(update_data['image'])
    
    if 'gallery' in update_data and update_data['gallery']:
        update_data['gallery'] = [convert_google_drive_url(url) for url in update_data['gallery']]
    
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

@api_router.post("/cars/bulk-upload")
async def bulk_upload_cars(file: UploadFile = File(...), admin: dict = Depends(verify_token)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        contents = await file.read()
        csv_data = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        added_count = 0
        updated_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                gallery = [img.strip() for img in row.get('gallery', '').split('|') if img.strip()]
                features = [f.strip() for f in row.get('features', '').split(',') if f.strip()]
                
                specifications = {}
                if row.get('engine'):
                    specifications['engine'] = row['engine']
                if row.get('power'):
                    specifications['power'] = row['power']
                if row.get('torque'):
                    specifications['torque'] = row['torque']
                if row.get('mileage'):
                    specifications['mileage'] = row['mileage']
                if row.get('seats'):
                    specifications['seats'] = int(row['seats']) if row['seats'] else 5
                if row.get('body_type'):
                    specifications['body_type'] = row['body_type']
                if row.get('color'):
                    specifications['color'] = row['color']
                
                car_data = {
                    'make': row['make'],
                    'model': row['model'],
                    'year': int(row['year']),
                    'price': float(row['price']),
                    'image': row['image'],
                    'gallery': gallery,
                    'km_driven': int(row['km_driven']),
                    'fuel_type': row['fuel_type'],
                    'transmission': row['transmission'],
                    'owners': int(row.get('owners', 1)),
                    'rto': row.get('rto', 'DL'),
                    'condition': row.get('condition', 'Excellent'),
                    'features': features,
                    'specifications': specifications,
                    'is_featured': row.get('is_featured', '').lower() in ['true', 'yes', '1']
                }
                
                existing_car = await db.cars.find_one({
                    'make': car_data['make'],
                    'model': car_data['model'],
                    'year': car_data['year']
                }, {"_id": 0})
                
                if existing_car:
                    await db.cars.update_one(
                        {'id': existing_car['id']},
                        {'$set': car_data}
                    )
                    updated_count += 1
                else:
                    car = Car(**car_data)
                    doc = car.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.cars.insert_one(doc)
                    added_count += 1
                    
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return {
            "message": "Bulk upload completed",
            "added": added_count,
            "updated": updated_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

@api_router.get("/cars/template/download")
async def download_csv_template():
    csv_content = """make,model,year,price,image,gallery,km_driven,fuel_type,transmission,owners,rto,condition,features,engine,power,torque,mileage,seats,body_type,color,is_featured
Mercedes-Benz,E-Class E 220d,2021,3500000,https://images.pexels.com/photos/12070967/pexels-photo-12070967.jpeg,https://images.pexels.com/photos/12070967/pexels-photo-12070967.jpeg|https://images.unsplash.com/photo-1617531653520-bd466115490d,25000,Diesel,Automatic,1,DL3C,Excellent,"Sunroof,Leather Seats,Navigation,Rear Camera",2.0L Diesel,194 bhp,400 Nm,17.9 kmpl,5,Sedan,Black,true
BMW,3 Series 320d M Sport,2020,2800000,https://images.unsplash.com/photo-1555215695-3004980ad54e,https://images.unsplash.com/photo-1555215695-3004980ad54e|https://images.unsplash.com/photo-1617531653520-bd466115490d,30000,Diesel,Automatic,1,HR26,Excellent,"Sunroof,Alloy Wheels,M Sport Package",2.0L Diesel,190 bhp,400 Nm,18.3 kmpl,5,Sedan,White,true
Maruti Suzuki,Swift VXI,2019,550000,https://images.unsplash.com/photo-1583121274602-3e2820c69888,,45000,Petrol,Manual,1,DL1C,Good,"Power Windows,AC,Music System",1.2L Petrol,82 bhp,113 Nm,21.2 kmpl,5,Hatchback,Red,false"""
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=carloop_inventory_template.csv"}
    )

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

@api_router.post("/testimonials", response_model=Testimonial)
async def create_testimonial(testimonial_data: TestimonialCreate, admin: dict = Depends(verify_token)):
    try:
        video_id = extract_youtube_video_id(testimonial_data.youtube_url)
        testimonial = Testimonial(
            customer_name=testimonial_data.customer_name,
            youtube_url=testimonial_data.youtube_url,
            video_id=video_id,
            is_active=testimonial_data.is_active
        )
        doc = testimonial.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.testimonials.insert_one(doc)
        return testimonial
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/testimonials", response_model=List[Testimonial])
async def get_testimonials(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    testimonials = await db.testimonials.find(query, {"_id": 0}).to_list(1000)
    for testimonial in testimonials:
        if isinstance(testimonial.get('created_at'), str):
            testimonial['created_at'] = datetime.fromisoformat(testimonial['created_at'])
    return testimonials

@api_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, admin: dict = Depends(verify_token)):
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted successfully"}

@api_router.post("/convert-drive-url")
async def convert_drive_url_endpoint(request: Request):
    data = await request.json()
    url = data.get('url', '')
    converted_url = convert_google_drive_url(url)
    return {"original": url, "converted": converted_url}

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
                model="E-Class E 220d",
                year=2021,
                price=3500000,
                image="https://images.pexels.com/photos/12070967/pexels-photo-12070967.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                gallery=[
                    "https://images.pexels.com/photos/12070967/pexels-photo-12070967.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                    "https://images.unsplash.com/photo-1617531653520-bd466115490d?w=800",
                    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800",
                    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800"
                ],
                km_driven=25000,
                fuel_type="Diesel",
                transmission="Automatic",
                owners=1,
                rto="DL3C",
                condition="Excellent",
                features=["Sunroof", "Leather Seats", "Navigation", "Rear Camera", "Parking Sensors", "Alloy Wheels", "Climate Control"],
                specifications={
                    "engine": "2.0L Diesel",
                    "power": "194 bhp",
                    "torque": "400 Nm",
                    "mileage": "17.9 kmpl",
                    "seats": 5,
                    "body_type": "Sedan",
                    "color": "Black"
                },
                is_featured=True
            ),
            CarCreate(
                make="BMW",
                model="3 Series 320d M Sport",
                year=2020,
                price=2800000,
                image="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
                    "https://images.unsplash.com/photo-1617531653520-bd466115490d?w=800",
                    "https://images.unsplash.com/photo-1617531653457-c4b2b7e1b7e0?w=800"
                ],
                km_driven=30000,
                fuel_type="Diesel",
                transmission="Automatic",
                owners=1,
                rto="HR26",
                condition="Excellent",
                features=["Sunroof", "Alloy Wheels", "M Sport Package", "LED Headlights", "Rear Camera"],
                specifications={
                    "engine": "2.0L Diesel",
                    "power": "190 bhp",
                    "torque": "400 Nm",
                    "mileage": "18.3 kmpl",
                    "seats": 5,
                    "body_type": "Sedan",
                    "color": "White"
                },
                is_featured=True
            ),
            CarCreate(
                make="Audi",
                model="A4 Premium Plus 2.0 TFSI",
                year=2022,
                price=4200000,
                image="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
                    "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800",
                    "https://images.unsplash.com/photo-1617531653520-bd466115490d?w=800"
                ],
                km_driven=18000,
                fuel_type="Petrol",
                transmission="Automatic",
                owners=1,
                rto="DL8C",
                condition="Excellent",
                features=["Sunroof", "Leather Seats", "Premium Sound", "Virtual Cockpit", "Matrix LED", "Wireless Charging"],
                specifications={
                    "engine": "2.0L TFSI Petrol",
                    "power": "190 bhp",
                    "torque": "320 Nm",
                    "mileage": "13.9 kmpl",
                    "seats": 5,
                    "body_type": "Sedan",
                    "color": "Grey"
                },
                is_featured=True
            ),
            CarCreate(
                make="Maruti Suzuki",
                model="Swift VXI",
                year=2019,
                price=550000,
                image="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
                    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"
                ],
                km_driven=45000,
                fuel_type="Petrol",
                transmission="Manual",
                owners=1,
                rto="DL1C",
                condition="Good",
                features=["Power Windows", "AC", "Music System", "ABS"],
                specifications={
                    "engine": "1.2L Petrol",
                    "power": "82 bhp",
                    "torque": "113 Nm",
                    "mileage": "21.2 kmpl",
                    "seats": 5,
                    "body_type": "Hatchback",
                    "color": "Red"
                },
                is_featured=False
            ),
            CarCreate(
                make="Hyundai",
                model="Creta SX Diesel",
                year=2021,
                price=1450000,
                image="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
                    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800"
                ],
                km_driven=32000,
                fuel_type="Diesel",
                transmission="Automatic",
                owners=1,
                rto="HR51",
                condition="Excellent",
                features=["Sunroof", "Touchscreen", "Rear Camera", "Cruise Control", "Ventilated Seats"],
                specifications={
                    "engine": "1.5L Diesel",
                    "power": "115 bhp",
                    "torque": "250 Nm",
                    "mileage": "18.5 kmpl",
                    "seats": 5,
                    "body_type": "SUV",
                    "color": "White"
                },
                is_featured=False
            ),
            CarCreate(
                make="Honda",
                model="City VX CVT",
                year=2020,
                price=980000,
                image="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
                    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800"
                ],
                km_driven=38000,
                fuel_type="Petrol",
                transmission="Automatic",
                owners=1,
                rto="DL9C",
                condition="Good",
                features=["Touchscreen", "Rear Camera", "Alloy Wheels", "Push Button Start"],
                specifications={
                    "engine": "1.5L Petrol",
                    "power": "121 bhp",
                    "torque": "145 Nm",
                    "mileage": "17.8 kmpl",
                    "seats": 5,
                    "body_type": "Sedan",
                    "color": "Silver"
                },
                is_featured=False
            ),
            CarCreate(
                make="Tata",
                model="Nexon XZ+ Petrol",
                year=2022,
                price=1150000,
                image="https://images.unsplash.com/photo-1617654112368-307921291f42?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1617654112368-307921291f42?w=800"
                ],
                km_driven=22000,
                fuel_type="Petrol",
                transmission="Manual",
                owners=1,
                rto="UP16",
                condition="Excellent",
                features=["Sunroof", "Touchscreen", "Rear Camera", "Dual Airbags", "ABS", "Cooled Glovebox"],
                specifications={
                    "engine": "1.2L Turbo Petrol",
                    "power": "120 bhp",
                    "torque": "170 Nm",
                    "mileage": "17.2 kmpl",
                    "seats": 5,
                    "body_type": "SUV",
                    "color": "Blue"
                },
                is_featured=False
            ),
            CarCreate(
                make="Mahindra",
                model="XUV700 AX7 Diesel",
                year=2023,
                price=2150000,
                image="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
                gallery=[
                    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800"
                ],
                km_driven=15000,
                fuel_type="Diesel",
                transmission="Automatic",
                owners=1,
                rto="MH12",
                condition="Excellent",
                features=["Panoramic Sunroof", "ADAS", "360 Camera", "Wireless Charger", "Premium Audio", "Ventilated Seats"],
                specifications={
                    "engine": "2.2L Diesel",
                    "power": "185 bhp",
                    "torque": "450 Nm",
                    "mileage": "16.1 kmpl",
                    "seats": 7,
                    "body_type": "SUV",
                    "color": "Black"
                },
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