# Carloop Inventory CSV Upload Guide

## 📋 Overview
You can now bulk upload and update your entire vehicle inventory using CSV files! This is perfect for:
- Adding multiple cars at once
- Updating prices and details in bulk
- Managing large inventories efficiently

## 🚀 How to Use CSV Upload

### Step 1: Download the Template
1. Login to Admin Dashboard (`admin@carloop.com` / `admin123`)
2. Go to the **Inventory** tab
3. Click **"Download CSV Template"** button
4. A file named `carloop_inventory_template.csv` will be downloaded

### Step 2: Edit the CSV File
Open the CSV file in:
- **Microsoft Excel**
- **Google Sheets**
- **LibreOffice Calc**
- Any spreadsheet software

### Step 3: Fill in Your Data
Follow the column format exactly as shown in the template.

### Step 4: Upload Your CSV
1. Click **"Upload CSV"** button in Admin Dashboard
2. Select your edited CSV file
3. Wait for the upload to complete
4. Check the results summary

## 📊 CSV Column Format

### Required Columns:
| Column | Description | Example |
|--------|-------------|---------|
| **make** | Car manufacturer | Mercedes-Benz, BMW, Audi |
| **model** | Car model name | E-Class, 3 Series, Swift |
| **year** | Manufacturing year | 2021, 2020, 2019 |
| **price** | Price in rupees (no commas) | 3500000 |
| **image** | Main image URL | https://example.com/car.jpg |
| **km_driven** | Kilometers driven | 25000 |
| **fuel_type** | Fuel type | Petrol, Diesel, CNG, Electric |
| **transmission** | Transmission type | Manual, Automatic |

### Optional Columns:
| Column | Description | Example |
|--------|-------------|---------|
| **gallery** | Multiple image URLs separated by `\|` | url1\|url2\|url3 |
| **owners** | Number of previous owners | 1, 2, 3 |
| **rto** | RTO registration code | DL3C, HR26, MH12 |
| **condition** | Car condition | Excellent, Good, Fair |
| **features** | Features separated by commas | Sunroof,Leather Seats,Navigation |
| **engine** | Engine specification | 2.0L Diesel |
| **power** | Power output | 194 bhp |
| **torque** | Torque output | 400 Nm |
| **mileage** | Fuel efficiency | 17.9 kmpl |
| **seats** | Number of seats | 5, 7 |
| **body_type** | Body type | Sedan, SUV, Hatchback, MUV |
| **color** | Car color | Black, White, Red, Blue |
| **is_featured** | Show on homepage | true, false, yes, no |

## 📝 Example Rows

### Basic Example:
```csv
make,model,year,price,image,gallery,km_driven,fuel_type,transmission,owners,rto,condition,features,engine,power,torque,mileage,seats,body_type,color,is_featured
Maruti Suzuki,Swift VXI,2019,550000,https://example.com/swift.jpg,,45000,Petrol,Manual,1,DL1C,Good,"Power Windows,AC",1.2L Petrol,82 bhp,113 Nm,21.2 kmpl,5,Hatchback,Red,false
```

### Premium Car Example:
```csv
make,model,year,price,image,gallery,km_driven,fuel_type,transmission,owners,rto,condition,features,engine,power,torque,mileage,seats,body_type,color,is_featured
Mercedes-Benz,E-Class E 220d,2021,3500000,https://example.com/merc1.jpg,https://example.com/merc1.jpg|https://example.com/merc2.jpg|https://example.com/merc3.jpg,25000,Diesel,Automatic,1,DL3C,Excellent,"Sunroof,Leather Seats,Navigation,Rear Camera,Parking Sensors",2.0L Diesel,194 bhp,400 Nm,17.9 kmpl,5,Sedan,Black,true
```

## ⚠️ Important Rules

### DO's:
✅ Use exact column names as shown in template
✅ Keep all data in one line per car (no line breaks within cells)
✅ Use pipe `|` to separate multiple gallery images
✅ Use commas to separate multiple features
✅ Remove commas from numbers (3500000 not 35,00,000)
✅ Use valid image URLs (https://...)
✅ Save file as CSV format

### DON'Ts:
❌ Don't add extra columns
❌ Don't skip required columns
❌ Don't use special characters in text (except commas in features)
❌ Don't add line breaks within cells
❌ Don't use spaces before/after commas in features
❌ Don't forget to save as .csv (not .xlsx)

## 🔄 Update Behavior

**The system automatically detects duplicates:**
- If a car with the **same Make + Model + Year** exists → **Updates** that car
- If no match found → **Adds** as new car

This means you can safely re-upload your entire inventory to update prices or details!

## 💡 Pro Tips

1. **Start Small**: Test with 2-3 cars first before uploading your entire inventory

2. **Image Hosting**: 
   - Use Unsplash, Imgur, or your own image hosting
   - Make sure images are publicly accessible
   - Recommended size: 1200x800px minimum

3. **Gallery Images**:
   - Upload 3-5 images per car for best results
   - Include: Front view, Interior, Side view, Rear view, Engine

4. **Features**:
   - List most important features first
   - Keep descriptions short and clear
   - Common features: Sunroof, Leather Seats, Navigation, Rear Camera, Alloy Wheels, Climate Control

5. **Pricing**:
   - Keep prices realistic and competitive
   - Update regularly based on market trends

6. **Featured Cars**:
   - Mark your best 3-5 cars as featured
   - These appear on the homepage
   - Choose diverse categories (Luxury, Budget, SUV, etc.)

## 🐛 Common Errors & Solutions

### Error: "Row X: invalid literal for int()"
**Solution**: Check that year, price, km_driven, owners, and seats are numbers without commas or text

### Error: "Row X: could not convert string to float"
**Solution**: Price must be a number. Remove ₹ symbol or commas

### Error: "Only CSV files are allowed"
**Solution**: Save your file as .csv format, not .xlsx or .xls

### Error: Missing required field
**Solution**: Ensure all required columns have values (make, model, year, price, image, km_driven, fuel_type, transmission)

## 📞 Need Help?

If you encounter any issues:
1. Check your CSV format matches the template exactly
2. Verify all URLs are accessible
3. Make sure numbers don't have commas or special characters
4. Contact support at **8683-996-996**

## 🎯 Quick Start Checklist

- [ ] Downloaded CSV template from Admin Dashboard
- [ ] Opened template in spreadsheet software
- [ ] Filled in car details following the format
- [ ] Checked all image URLs are working
- [ ] Saved file as .csv format
- [ ] Uploaded CSV through Admin Dashboard
- [ ] Verified upload results
- [ ] Checked inventory page to confirm cars are visible

---

**Happy Listing! 🚗💨**

Your Carloop Team
