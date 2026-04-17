from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Response, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
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
import resend
from services.image_branding import process_branded_image, image_to_data_uri, process_and_upload_branded_image

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

# Resend Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'Kathuria.gavish94@gmail.com')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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
    image: str  # This will be the branded image URL
    original_image: Optional[str] = None  # Original unbranded image URL
    gallery: Optional[List[str]] = []
    original_gallery: Optional[List[str]] = []  # Original gallery images
    km_driven: int
    fuel_type: str
    transmission: str
    owners: Optional[int] = 1
    rto: Optional[str] = "DL"
    condition: Optional[str] = "Excellent"
    status: Optional[str] = "Available"  # Available, Sold, Booked
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
    original_image: Optional[str] = None
    gallery: Optional[List[str]] = []
    original_gallery: Optional[List[str]] = []
    km_driven: int
    fuel_type: str
    transmission: str
    owners: Optional[int] = 1
    rto: Optional[str] = "DL"
    condition: Optional[str] = "Excellent"
    status: Optional[str] = "Available"
    features: Optional[List[str]] = []
    specifications: Optional[dict] = {}
    is_featured: bool = False

class CarUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    image: Optional[str] = None
    original_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    original_gallery: Optional[List[str]] = None
    km_driven: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    owners: Optional[int] = None
    rto: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None
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

class CallbackRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    car_id: Optional[str] = None
    car_details: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CallbackRequestCreate(BaseModel):
    name: str
    phone: str
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

# Customer Leads Model
class CustomerLead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    mobile: str
    budget: Optional[str] = None
    car_interest: Optional[str] = None
    source: str = "login_click"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerLeadCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    budget: Optional[str] = None
    car_interest: Optional[str] = None
    source: str = "login_click"

# Password Reset Token Model
class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=1))
    used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# Delivery Images Model
class DeliveryImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_url: str
    car_name: str
    customer_name: str
    delivery_location: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeliveryImageCreate(BaseModel):
    image_url: str
    car_name: str
    customer_name: str
    delivery_location: str

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
    """Convert Google Drive share URL to a direct image URL that works for display and download"""
    import re
    if not url:
        return url
    
    if 'drive.google.com' in url:
        # Extract file ID from various Google Drive URL patterns
        file_id = None
        
        # Pattern 1: /file/d/FILE_ID/view or /file/d/FILE_ID/preview
        match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
        if match:
            file_id = match.group(1)
        
        # Pattern 2: /open?id=FILE_ID
        if not file_id:
            match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
            if match:
                file_id = match.group(1)
        
        if file_id:
            # Use the Google Drive direct download format that works better for images
            # This format is more reliable for downloading in backend and for display
            return f"https://drive.google.com/uc?export=view&id={file_id}"
    
    return url


async def validate_image_url(url: str) -> tuple[bool, str]:
    """Validate that an image URL is accessible and returns an image"""
    if not url:
        return False, "Image URL is required"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.head(url, follow_redirects=True)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type or 'drive.google.com' in url or 'googleusercontent' in url:
                    return True, "Valid image URL"
                else:
                    # For Google Drive URLs, allow even if content-type isn't image
                    if 'google' in url:
                        return True, "Google Drive URL (assumed valid)"
                    return False, f"URL does not point to an image (content-type: {content_type})"
            elif response.status_code == 403:
                return False, "Image URL is not publicly accessible (403 Forbidden). Make sure the file is shared with 'Anyone with the link'."
            elif response.status_code == 404:
                return False, "Image URL not found (404). Please check the URL is correct."
            else:
                return False, f"Failed to access image URL (HTTP {response.status_code})"
    except httpx.TimeoutException:
        # For timeout, allow it since it might just be a slow server
        return True, "URL validation timed out (will attempt to use anyway)"
    except Exception as e:
        return False, f"Error validating image URL: {str(e)}"

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

# Recently Sold Cars Endpoint - must be before /cars/{car_id}
@api_router.get("/cars/recently-sold")
async def get_recently_sold_cars(limit: int = 5):
    cars = await db.cars.find(
        {"status": {"$in": ["Sold", "Booked"]}},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
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
async def create_car(car_data: CarCreate, admin: dict = Depends(verify_token), background_tasks: BackgroundTasks = None):
    """
    Create a new car listing.
    Image branding is OPTIONAL - car is ALWAYS saved even if branding fails.
    """
    # Convert Google Drive URLs
    car_dict = car_data.model_dump()
    original_image = convert_google_drive_url(car_dict['image'])
    
    # Validate image URL (lenient mode for Google Drive)
    is_valid, validation_message = await validate_image_url(original_image)
    if not is_valid and 'google' not in original_image.lower():
        # Only block for non-Google URLs that are definitely invalid
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid image URL: {validation_message}"
        )
    
    # Store original image
    car_dict['original_image'] = original_image
    
    # Try to brand the main image (NON-BLOCKING - car saves regardless)
    branding_success = False
    branding_message = ""
    
    try:
        branded_result = await asyncio.wait_for(
            process_and_upload_branded_image(original_image),
            timeout=30.0  # 30 second timeout for branding
        )
        if branded_result:
            car_dict['image'] = branded_result
            branding_success = True
            branding_message = "Image branded successfully"
        else:
            car_dict['image'] = original_image
            branding_message = "Branding skipped - using original image"
            logger.warning(f"Image branding returned None for {original_image}, using original")
    except asyncio.TimeoutError:
        logger.warning(f"Image branding timed out for {original_image}")
        car_dict['image'] = original_image
        branding_message = "Branding timed out - using original image"
    except Exception as e:
        logger.warning(f"Error branding car image (non-blocking): {e}")
        car_dict['image'] = original_image
        branding_message = "Branding skipped - using original image"
    
    # Process gallery images (with individual timeouts, NON-BLOCKING)
    if car_dict.get('gallery'):
        original_gallery = [convert_google_drive_url(url) for url in car_dict['gallery']]
        car_dict['original_gallery'] = original_gallery
        
        branded_gallery = []
        for url in original_gallery[:5]:  # Limit to first 5 for performance
            try:
                branded = await asyncio.wait_for(
                    process_and_upload_branded_image(url),
                    timeout=15.0  # 15 second timeout per gallery image
                )
                branded_gallery.append(branded if branded else url)
            except asyncio.TimeoutError:
                logger.warning(f"Gallery image branding timed out for {url}")
                branded_gallery.append(url)
            except Exception:
                branded_gallery.append(url)
        
        car_dict['gallery'] = branded_gallery
    
    # ALWAYS save the car - this should NEVER fail due to branding
    try:
        car = Car(**car_dict)
        doc = car.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.cars.insert_one(doc)
        
        # Log success with branding status
        if branding_success:
            logger.info(f"Car created with TruVant branding: {car.make} {car.model}")
        else:
            logger.info(f"Car created (branding skipped): {car.make} {car.model} - {branding_message}")
        
        return car
    except Exception as e:
        logger.error(f"Database error creating car: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save car to database: {str(e)}")

@api_router.put("/cars/{car_id}", response_model=Car)
async def update_car(car_id: str, car_update: CarUpdate, admin: dict = Depends(verify_token)):
    existing_car = await db.cars.find_one({"id": car_id}, {"_id": 0})
    if not existing_car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    update_data = {k: v for k, v in car_update.model_dump().items() if v is not None}
    
    # Convert Google Drive URLs and brand images if present
    if 'image' in update_data:
        original_image = convert_google_drive_url(update_data['image'])
        update_data['original_image'] = original_image
        
        try:
            branded_result = await process_and_upload_branded_image(original_image)
            if branded_result:
                update_data['image'] = branded_result
            else:
                update_data['image'] = original_image
        except Exception as e:
            logger.error(f"Error branding updated car image: {e}")
            update_data['image'] = original_image
    
    if 'gallery' in update_data and update_data['gallery']:
        original_gallery = [convert_google_drive_url(url) for url in update_data['gallery']]
        update_data['original_gallery'] = original_gallery
        
        branded_gallery = []
        for url in original_gallery[:5]:
            try:
                branded = await process_and_upload_branded_image(url)
                branded_gallery.append(branded if branded else url)
            except Exception:
                branded_gallery.append(url)
        
        update_data['gallery'] = branded_gallery
    
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
                # Convert Google Drive URLs in gallery
                gallery = [convert_google_drive_url(url) for url in gallery]
                
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
                
                # Convert main image URL
                main_image = convert_google_drive_url(row['image'])
                
                car_data = {
                    'make': row['make'],
                    'model': row['model'],
                    'year': int(row['year']),
                    'price': float(row['price']),
                    'image': main_image,
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

@api_router.post("/callback-requests", response_model=CallbackRequest)
async def create_callback_request(callback_data: CallbackRequestCreate):
    car_details = ""
    car_price = ""
    if callback_data.car_id:
        car = await db.cars.find_one({"id": callback_data.car_id}, {"_id": 0})
        if car:
            car_details = f"{car.get('make')} {car.get('model')} ({car.get('year')})"
            price = car.get('price', 0)
            if price >= 100000:
                car_price = f"₹{price/100000:.2f} Lakh"
            else:
                car_price = f"₹{price:,}"
    
    callback = CallbackRequest(
        name=callback_data.name,
        phone=callback_data.phone,
        car_id=callback_data.car_id,
        car_details=car_details
    )
    doc = callback.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.callback_requests.insert_one(doc)
    
    # Send email notification to admin
    if RESEND_API_KEY:
        try:
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">TruVant - New Callback Request</h1>
                </div>
                <div style="padding: 30px; background-color: #f9fafb;">
                    <h2 style="color: #374151; margin-top: 0;">Customer Details</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #6b7280;">Name:</td>
                            <td style="padding: 10px 0; font-weight: bold; color: #111827;">{callback_data.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #6b7280;">Phone:</td>
                            <td style="padding: 10px 0; font-weight: bold; color: #111827;">{callback_data.phone}</td>
                        </tr>
                        {f'<tr><td style="padding: 10px 0; color: #6b7280;">Interested In:</td><td style="padding: 10px 0; font-weight: bold; color: #ea580c;">{car_details}</td></tr>' if car_details else ''}
                        {f'<tr><td style="padding: 10px 0; color: #6b7280;">Price:</td><td style="padding: 10px 0; font-weight: bold; color: #111827;">{car_price}</td></tr>' if car_price else ''}
                    </table>
                    <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            Please call the customer back within 2 hours during business hours.
                        </p>
                    </div>
                </div>
                <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                    TruVant - Your Trusted Partner for Pre-Owned Vehicles
                </div>
            </div>
            """
            
            params = {
                "from": SENDER_EMAIL,
                "to": [ADMIN_EMAIL],
                "subject": f"New Callback Request from {callback_data.name}" + (f" - {car_details}" if car_details else ""),
                "html": html_content
            }
            
            # Run sync SDK in thread to keep FastAPI non-blocking
            await asyncio.to_thread(resend.Emails.send, params)
            logging.info(f"Callback notification email sent for {callback_data.name}")
        except Exception as e:
            # Log error but don't fail the request
            logging.error(f"Failed to send callback notification email: {str(e)}")
    else:
        logging.info(f"Email notification skipped (RESEND_API_KEY not configured). Callback from {callback_data.name} saved.")
    
    return callback

@api_router.get("/callback-requests", response_model=List[CallbackRequest])
async def get_callback_requests(admin: dict = Depends(verify_token)):
    callbacks = await db.callback_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for callback in callbacks:
        if isinstance(callback.get('created_at'), str):
            callback['created_at'] = datetime.fromisoformat(callback['created_at'])
    return callbacks

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

# Image Branding Endpoints
class ImageBrandingRequest(BaseModel):
    image_url: str
    add_background: bool = True
    add_logo: bool = True
    add_badge: bool = True
    logo_opacity: float = 0.20

@api_router.post("/brand-image")
async def brand_image_endpoint(request: ImageBrandingRequest, admin: dict = Depends(verify_token)):
    """
    Process an image and add TruVant branding
    Returns the branded image as a data URI, or falls back to original URL
    """
    from services.image_branding import BRANDING_ENABLED
    
    # If branding is disabled, return original URL
    if not BRANDING_ENABLED:
        return {
            "success": True,
            "branded_image": request.image_url,
            "original_image": request.image_url,
            "branding_applied": False,
            "message": "Branding temporarily disabled"
        }
    
    try:
        result = await process_branded_image(
            request.image_url,
            add_background=request.add_background,
            add_logo=request.add_logo,
            add_badge=request.add_badge,
            logo_opacity=request.logo_opacity,
            output_quality=85
        )
        
        if result:
            content_type, image_bytes = result
            branded_uri = image_to_data_uri(image_bytes, content_type)
            return {
                "success": True,
                "branded_image": branded_uri,
                "original_image": request.image_url,
                "branding_applied": True
            }
        else:
            # Branding failed - return original URL as fallback (NOT an error)
            logger.warning(f"Branding failed for {request.image_url}, returning original")
            return {
                "success": True,
                "branded_image": request.image_url,
                "original_image": request.image_url,
                "branding_applied": False,
                "message": "Could not process image for branding, using original"
            }
    except Exception as e:
        logger.error(f"Error branding image: {e}")
        # Return original URL as fallback (NOT an error)
        return {
            "success": True,
            "branded_image": request.image_url,
            "original_image": request.image_url,
            "branding_applied": False,
            "message": f"Branding skipped: {str(e)}"
        }

@api_router.post("/brand-image-preview")
async def brand_image_preview(request: ImageBrandingRequest):
    """
    Preview branded image (no auth required for preview)
    NEVER blocks - always returns a result (branded or original)
    """
    from services.image_branding import BRANDING_ENABLED
    
    # If branding is disabled, return original URL
    if not BRANDING_ENABLED:
        return {
            "success": True,
            "branded_image": request.image_url,
            "branding_applied": False,
            "message": "Branding temporarily disabled - showing original"
        }
    
    try:
        result = await asyncio.wait_for(
            process_branded_image(
                request.image_url,
                add_background=request.add_background,
                add_logo=request.add_logo,
                add_badge=request.add_badge,
                logo_opacity=request.logo_opacity,
                output_quality=75  # Lower quality for preview
            ),
            timeout=20.0  # 20 second timeout for preview
        )
        
        if result:
            content_type, image_bytes = result
            branded_uri = image_to_data_uri(image_bytes, content_type)
            return {
                "success": True,
                "branded_image": branded_uri,
                "branding_applied": True
            }
        else:
            # Branding failed - return original URL (NOT an error)
            logger.warning(f"Preview branding failed for {request.image_url}, returning original")
            return {
                "success": True,
                "branded_image": request.image_url,
                "branding_applied": False,
                "message": "Could not generate preview. Image will be used as-is."
            }
    except asyncio.TimeoutError:
        logger.warning(f"Preview branding timed out for {request.image_url}")
        return {
            "success": True,
            "branded_image": request.image_url,
            "branding_applied": False,
            "message": "Preview timed out. Image will be processed when saving."
        }
    except Exception as e:
        logger.error(f"Error previewing branded image: {e}")
        # Return original URL as fallback (NOT an error)
        return {
            "success": True,
            "branded_image": request.image_url,
            "branding_applied": False,
            "message": "Preview unavailable: using original image"
        }

# Customer Leads Endpoints
@api_router.post("/customer-leads", response_model=CustomerLead)
async def create_customer_lead(lead_data: CustomerLeadCreate):
    lead = CustomerLead(**lead_data.model_dump())
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customer_leads.insert_one(doc)
    return lead

@api_router.get("/customer-leads", response_model=List[CustomerLead])
async def get_customer_leads(
    admin: dict = Depends(verify_token),
    search: Optional[str] = None,
    source: Optional[str] = None
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"mobile": {"$regex": search, "$options": "i"}}
        ]
    if source:
        query["source"] = source
    
    leads = await db.customer_leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    return leads

@api_router.get("/customer-leads/export")
async def export_customer_leads(admin: dict = Depends(verify_token)):
    leads = await db.customer_leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    csv_output = io.StringIO()
    writer = csv.writer(csv_output)
    writer.writerow(["Name", "Email", "Mobile", "Budget", "Car Interest", "Source", "Created At"])
    
    for lead in leads:
        writer.writerow([
            lead.get('name', ''),
            lead.get('email', ''),
            lead.get('mobile', ''),
            lead.get('budget', ''),
            lead.get('car_interest', ''),
            lead.get('source', ''),
            lead.get('created_at', '')
        ])
    
    csv_content = csv_output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=customer_leads_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# Admin Password Reset Endpoints
@api_router.post("/admin/forgot-password")
async def forgot_password(request_data: ForgotPasswordRequest):
    admin = await db.admins.find_one({"email": request_data.email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not admin:
        return {"message": "If an account exists with this email, a password reset link has been sent."}
    
    # Create reset token
    reset_token = PasswordResetToken(email=request_data.email)
    doc = reset_token.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['expires_at'] = doc['expires_at'].isoformat()
    await db.password_reset_tokens.insert_one(doc)
    
    # Send email with reset link
    if RESEND_API_KEY:
        try:
            reset_link = f"{os.environ.get('FRONTEND_URL', 'https://carloop-dealer.preview.emergentagent.com')}/admin/reset-password?token={reset_token.token}"
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #0F172A; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">TruVant Admin</h1>
                    <p style="margin: 10px 0 0 0; color: #94a3b8;">Password Reset Request</p>
                </div>
                <div style="padding: 40px 30px; background-color: #f8fafc;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Hello,<br><br>
                        We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="display: inline-block; padding: 14px 32px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background-color: #f1f5f9;">
                    TruVant - Your Trusted Partner for Pre-Owned Vehicles
                </div>
            </div>
            """
            
            params = {
                "from": SENDER_EMAIL,
                "to": [request_data.email],
                "subject": "TruVant Admin - Password Reset Request",
                "html": html_content
            }
            
            await asyncio.to_thread(resend.Emails.send, params)
            logging.info(f"Password reset email sent to {request_data.email}")
        except Exception as e:
            logging.error(f"Failed to send password reset email: {str(e)}")
    else:
        logging.info(f"Password reset requested for {request_data.email}. Token: {reset_token.token}")
    
    return {"message": "If an account exists with this email, a password reset link has been sent."}

@api_router.post("/admin/reset-password")
async def reset_password(request_data: ResetPasswordRequest):
    # Find valid token
    token_doc = await db.password_reset_tokens.find_one({
        "token": request_data.token,
        "used": False
    }, {"_id": 0})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    expires_at = token_doc['expires_at']
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    new_password_hash = pwd_context.hash(request_data.new_password)
    result = await db.admins.update_one(
        {"email": token_doc['email']},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Admin account not found")
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": request_data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

@api_router.get("/admin/verify-reset-token")
async def verify_reset_token(token: str):
    token_doc = await db.password_reset_tokens.find_one({
        "token": token,
        "used": False
    }, {"_id": 0})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    expires_at = token_doc['expires_at']
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    return {"valid": True, "email": token_doc['email']}

# Delivery Images Endpoints
@api_router.get("/delivery-images", response_model=List[DeliveryImage])
async def get_delivery_images(limit: Optional[int] = None):
    query = db.delivery_images.find({}, {"_id": 0}).sort("created_at", -1)
    if limit:
        query = query.limit(limit)
    deliveries = await query.to_list(100)
    for delivery in deliveries:
        if isinstance(delivery.get('created_at'), str):
            delivery['created_at'] = datetime.fromisoformat(delivery['created_at'])
    return deliveries

@api_router.post("/delivery-images", response_model=DeliveryImage)
async def create_delivery_image(delivery_data: DeliveryImageCreate, admin: dict = Depends(verify_token)):
    delivery = DeliveryImage(**delivery_data.model_dump())
    doc = delivery.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.delivery_images.insert_one(doc)
    return delivery

@api_router.delete("/delivery-images/{delivery_id}")
async def delete_delivery_image(delivery_id: str, admin: dict = Depends(verify_token)):
    result = await db.delivery_images.delete_one({"id": delivery_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery image not found")
    return {"message": "Delivery image deleted successfully"}

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
    # Create default admin admin@carloop.com (legacy)
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
    
    # Create new default admin admin@truvant.com
    truvant_admin_exists = await db.admins.find_one({"email": "admin@truvant.com"})
    if not truvant_admin_exists:
        admin = Admin(
            email="admin@truvant.com",
            password_hash=pwd_context.hash("Admin@123"),
            name="TruVant Admin"
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.admins.insert_one(doc)
        logger.info("Created TruVant admin: admin@truvant.com / Admin@123")
    
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
                status="Available",
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
            ),
            CarCreate(
                make="Honda",
                model="Civic",
                year=2021,
                price=1800000,
                image="https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
                gallery=[],
                km_driven=28000,
                fuel_type="Petrol",
                transmission="Automatic",
                owners=1,
                rto="DL5C",
                condition="Excellent",
                status="Sold",
                features=["Sunroof", "Leather Seats", "Premium Audio"],
                specifications={
                    "engine": "1.8L Petrol",
                    "power": "141 bhp",
                    "torque": "174 Nm",
                    "mileage": "16.5 kmpl",
                    "seats": 5,
                    "body_type": "Sedan",
                    "color": "Silver"
                },
                is_featured=False
            ),
            CarCreate(
                make="Kia",
                model="Seltos GTX Plus",
                year=2022,
                price=1650000,
                image="https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800",
                gallery=[],
                km_driven=20000,
                fuel_type="Petrol",
                transmission="Automatic",
                owners=1,
                rto="HR55",
                condition="Excellent",
                status="Booked",
                features=["Sunroof", "Ventilated Seats", "360 Camera", "Wireless Charger"],
                specifications={
                    "engine": "1.4L Turbo Petrol",
                    "power": "140 bhp",
                    "torque": "242 Nm",
                    "mileage": "16.8 kmpl",
                    "seats": 5,
                    "body_type": "SUV",
                    "color": "Red"
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