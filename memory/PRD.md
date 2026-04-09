# TruVant (formerly Carloop) - Used Car Dealership Platform

## Original Problem Statement
Create a complete car dealer website that includes a homepage, inventory page, and contact page. The homepage should have a hero section with featured cars, a short description, and a navigation bar. The inventory page should show vehicle listing in card format with car images, price and a 'See Details' button. Keep the design clean, responsive and professional. Brand name is TruVant (originally Carloop) and help with an admin login wherein the admin should be able to manage the live inventory on the website.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI, Lucide Icons, Axios
- **Backend**: FastAPI, Motor/PyMongo, Resend (Email)
- **Database**: MongoDB
- **Authentication**: JWT (Admin), Emergent-managed Google Auth (Customers)

## Key Features Implemented

### Phase 1: Core Platform (DONE)
- [x] Homepage with hero section, featured cars, navigation
- [x] Inventory page with car listings in card format
- [x] Contact page with enquiry form
- [x] Admin Dashboard with JWT authentication
- [x] CRUD operations for car inventory

### Phase 2: Enhanced Features (DONE)
- [x] Google Auth for customer login (Emergent-managed)
- [x] CSV bulk upload for inventory (`/api/cars/bulk-upload`)
- [x] Google Drive image URL auto-conversion
- [x] WhatsApp integration button
- [x] "Get A Call Back" capture forms
- [x] Sold/Booked status tiles on car cards
- [x] Testimonials with YouTube video embeds

### Phase 3: TruVant Premium Homepage Redesign (DONE)
- [x] Complete rebrand from "Carloop" to "TruVant"
- [x] Premium "Spinny-like" homepage design with 7 sections
- [x] Updated Footer with TruVant branding
- [x] Custom Tailwind classes in index.css
- [x] Outfit + DM Sans typography

### Phase 4: Premium Styling for All Pages (DONE)
- [x] InventoryPage redesign with dark header, sticky filters
- [x] CarDetailPage redesign with gallery, specs cards, trust badges
- [x] ContactPage redesign with colored info cards, dark help section

### Phase 5: Email Notifications & Mobile UX (DONE)
- [x] Real email sending for callbacks using Resend API
- [x] Mobile sticky bottom bar component (Call, WhatsApp buttons)

### Phase 6: Customer Lead Capture & Admin Recovery (DONE - April 9, 2026)
- [x] **Customer Lead Capture Modal**
  - Opens when user clicks "Login" button
  - Captures: Name, Mobile (10-digit validation), Email (required)
  - Optional: Budget Range, Interested Car Type
  - Saves to `customer_leads` collection
  - Then redirects to Google Auth
- [x] **Circular TruVant Logo**
  - CircularLogo component with white background, soft shadow
  - Applied to: Navbar, Footer, Admin Login, Admin Dashboard
  - TruVant brand colors: Primary #0F172A, Accent #2563EB
- [x] **Admin Forgot Password Flow**
  - "Forgot Password?" link on login page
  - Password reset email (requires RESEND_API_KEY)
  - Token-based reset with expiry
- [x] **New Default Admin**
  - Email: admin@truvant.com
  - Password: Admin@123
- [x] **Admin Customer Leads Section**
  - New "Customer Leads" tab in Admin Dashboard
  - Search by name, email, mobile
  - Filter by source
  - Export CSV functionality

## Database Schema
- **cars**: make, model, year, price, mileage, fuel_type, transmission, image_url, gallery_urls, features, specifications, is_featured, status
- **users**: email, role, google_id
- **enquiries**: name, email, phone, message
- **callbacks**: name, phone, car_id, car_details, status
- **testimonials**: customer_name, youtube_url, video_id, is_active
- **customer_leads**: name, email, mobile, budget, car_interest, source, created_at
- **password_reset_tokens**: email, token, expires_at, used

## API Endpoints
- `GET/POST /api/cars` - Car CRUD
- `GET /api/cars/{id}` - Car details
- `POST /api/auth/login` - Admin login
- `POST /api/auth/google` - Customer Google auth
- `POST /api/cars/bulk-upload` - CSV inventory upload
- `POST /api/callbacks` - Callback requests (with email notification)
- `POST /api/enquiries` - Contact form submissions
- `GET/POST /api/testimonials` - Testimonials
- `POST /api/customer-leads` - Create customer lead
- `GET /api/customer-leads` - List leads (admin auth required)
- `GET /api/customer-leads/export` - Export leads as CSV
- `POST /api/admin/forgot-password` - Request password reset
- `POST /api/admin/reset-password` - Reset password with token
- `GET /api/admin/verify-reset-token` - Verify reset token

## Admin Credentials
- **New (TruVant)**: admin@truvant.com / Admin@123
- **Legacy (Carloop)**: admin@carloop.com / admin123

## Environment Variables Required
```
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
RESEND_API_KEY=re_xxxxx (optional - for email notifications)
SENDER_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=Kathuria.gavish94@gmail.com
```

## Testing Results
- Backend: 100% (19/19 tests passed)
- Frontend: 100% functional
- All 6 phases verified working

## Mocked Features
- Email notifications require `RESEND_API_KEY` environment variable
- If not configured, callbacks saved but emails logged only
- Password reset tokens logged to console if no email API configured

## Key Files
- `/app/frontend/src/components/LeadCaptureModal.js` - Lead capture modal
- `/app/frontend/src/components/CircularLogo.js` - Circular logo component
- `/app/frontend/src/pages/ForgotPasswordPage.js` - Forgot password
- `/app/frontend/src/pages/ResetPasswordPage.js` - Reset password
- `/app/frontend/src/pages/AdminCustomerLeads.js` - Leads management
- `/app/frontend/src/pages/HomePage.js` - Premium homepage
- `/app/frontend/src/pages/InventoryPage.js` - Redesigned inventory
- `/app/frontend/src/pages/CarDetailPage.js` - Redesigned car details
- `/app/frontend/src/pages/ContactPage.js` - Redesigned contact
- `/app/frontend/src/components/MobileBottomBar.js` - Mobile sticky bar
- `/app/frontend/src/components/PremiumCarCard.js` - Car card component
- `/app/frontend/src/components/Footer.js` - TruVant footer
- `/app/frontend/src/index.css` - Custom Tailwind classes
- `/app/backend/server.py` - Main API server

## Last Updated
April 9, 2026 - Completed Phase 6: Customer Lead Capture Modal, Circular TruVant Logo branding, Admin Forgot Password flow with new admin@truvant.com credentials, Admin Customer Leads section with search/filter/export.

## Future Enhancements (Optional)
- [ ] Add "Compare Cars" feature
- [ ] Implement car finance calculator
- [ ] Add customer reviews/ratings per car
- [ ] Implement wishlist/favorites functionality
