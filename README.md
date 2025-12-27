# 🧵 Cloth POS - Quick Start Guide

## 🚀 Your servers are RUNNING!

### Backend (Django)
```
http://127.0.0.1:8000/
```
- **Admin Panel**: http://127.0.0.1:8000/admin/
- **Login**: `admin` / `admin`

### Frontend (React)
```
http://localhost:5173/
```

---

## ⚡ Quick Test (5 Minutes)

### Step 1: Add Sample Product
1. Open: http://127.0.0.1:8000/admin/
2. Login: `admin` / `admin`
3. Click **Categories** → **Add Category**
   - Name: `T-Shirts`
   - Save

4. Click **Products** → **Add Product**
   - Category: `T-Shirts`
   - Name: `Cotton Crew Neck`
   - Brand: `Nike`
   - Save and continue editing

5. Scroll to **Product Variants** → Add inline:
   | Size | Color | Barcode | Price | GST | Stock |
   |------|-------|---------|-------|-----|-------|
   | M    | Red   | ABC123  | 1500  | 18  | 50    |
   | L    | Blue  | DEF456  | 1600  | 18  | 30    |
   - Click **Save**

### Step 2: Test POS
1. Open: http://localhost:5173/
2. Click **💳 Point of Sale**
3. Type in barcode field: `ABC123` → Press Enter
4. Item appears in cart!
5. Click **+** to add more quantity
6. Select **Payment Mode**: Cash
7. Click **🧾 Complete Sale**
8. ✅ Success! Invoice generated

### Step 3: Verify Stock
1. Go to **📦 Inventory** tab
2. Check stock reduced from 50 to 49 ✅

---

## 📁 Project Structure

```
e:/Cloth-pos/
├── backend/               # Django API
│   ├── inventory/         # Product models
│   ├── sales/            # Sales models
│   └── manage.py         # Django CLI
├── frontend/             # React UI
│   └── src/
│       ├── components/   # POS & Inventory
│       └── api.js        # Backend integration
└── venv/                 # Python virtualenv
```

---

## 🛠️ Useful Commands

### Backend
```powershell
# Navigate to backend
cd e:/Cloth-pos/backend

# Run migrations (after model changes)
..\..\venv\Scripts\python manage.py makemigrations
..\..\venv\Scripts\python manage.py migrate

# Create admin user
..\..\venv\Scripts\python manage.py createsuperuser

# Start server (already running)
..\..\venv\Scripts\python manage.py runserver
```

### Frontend
```powershell
# Navigate to frontend
cd e:/Cloth-pos/frontend

# Install dependencies
npm install

# Start dev server (already running)
npm run dev

# Build for production
npm run build
```

---

## 🎯 Key Features

✅ **Product Variants** (Size/Color)
✅ **Barcode Scanning**
✅ **Real-time Cart**
✅ **GST Calculation**
✅ **Auto Stock Deduction**
✅ **Invoice Generation**
✅ **Admin Panel**
✅ **Modern UI** (Tailwind)

---

## 📊 API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

- `GET /categories/` - List categories
- `GET /products/` - List products
- `GET /variants/?search=ABC123` - Search by barcode
- `POST /sales/` - Create sale

**Example: Search Barcode**
```javascript
fetch('http://127.0.0.1:8000/api/variants/?search=ABC123')
  .then(res => res.json())
  .then(data => console.log(data))
```

---

## 🔥 What's Next?

**Now that it's running, you can:**

1. **Add more products** via Admin panel
2. **Test the POS flow** with multiple items
3. **Customize the UI** (colors, branding)
4. **Add features**:
   - Print receipts
   - Reports dashboard
   - User roles
   - Returns module

**Need help?** Check [walkthrough.md](file:///C:/Users/SUMAN%20SHINDE/.gemini/antigravity/brain/07bf20d4-cbcb-4dc0-8152-bdd2fc464c0f/walkthrough.md) for complete details!

---

**🎉 Your Advanced POS System is LIVE!**

---

## 🏗️ Architecture & Stock Management (Important)

The system uses a **Variant-Based Inventory Architecture**, following industry standards.

### Why not simple "Product Stock"?
In real-world retail, you cannot just sell a "Shirt". You sell a "Shirt (Size M, Color Red)".
If we only stored "Total Stock = 10", we wouldn't know if we have enough Mediums left.

### Our Logic:
1.  **Product**: Defines the general item (e.g., "Fancy Designer Saree").
2.  **ProductVariant**: Stores the physical SKU details:
    *   **Size**: (S, M, L)
    *   **Color**: (Red, Blue)
    *   **Barcode**: Unique per variant
    *   **Stock**: **Individual quantity** for this specific combination.

**Example**:
- Total Stock: 12
- Small: 2
- Medium: 7
- Large: 3

**How Billing Works**:
When a cashier scans a barcode or selects "Small", the system deducts stock **ONLY** from the "Small" variant. The "Medium" and "Large" stock remain untouched. This ensures 100% inventory accuracy and prevents stock mismatches.
