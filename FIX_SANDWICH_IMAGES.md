# Fix Sandwich Images on Deployed App

## Problem
Sandwich menu items (and some other items) are missing images on the portal. This is because the `image` field in your MongoDB Atlas database is empty.

## Solution Overview
There are **3 ways** to fix this depending on your preference:

### Option 1: Quick Database Migration (Recommended for Deployed Apps)
Use this if your app is already live and you don't want to reseed everything.

#### Steps:
1. **Get your MongoDB connection string** from MongoDB Atlas:
   - Go to [mongodb.com/cloud/atlas](https://login.mongodb.com)
   - Navigate to your cluster
   - Click "Connect" → "Drivers"
   - Copy the connection string

2. **Update the migration script** with your MongoDB URI:
   ```bash
   # On your Render backend server, set environment variable:
   export MONGODB_URI="mongodb+srv://username:password@yourcluster.mongodb.net/alimento?retryWrites=true&w=majority"
   ```

3. **Run the migration** on your Render server:
   ```bash
   cd /your/app/backend
   node migrateImages.js
   ```

4. **Verify** - Go to your portal and check if images now appear on the sandwich cards

---

### Option 2: Reseed the Database (Clean Slate)
Use if you want to update all menu items fresh.

#### Steps:
1. **Clear existing menu items** in MongoDB Atlas:
   - Go to MongoDB Atlas → Collections → alimento → MenuItem
   - Delete all documents (or drop the collection)

2. **Run the seed script** from your Render deployment:
   ```bash
   cd /your/app/backend
   node quickSeed.js
   # OR
   node seedDatabase.js
   # OR
   node seedAll.js
   ```

3. **Restart your backend** server on Render

4. **Refresh** the portal page and images should now appear

---

### Option 3: Manual MongoDB Update (Using MongoDB Atlas UI)
If you prefer GUI:

1. **Log into MongoDB Atlas**
2. **Go to Collections** → Select your `MenuItem` collection
3. **Find the "BBQ CHEESEBURGER"** document
4. **Edit the document** and change:
   ```
   image: ""
   ```
   to:
   ```
   image: "food/Choricheeseburger2.jpg"
   ```
5. **Save** and refresh your app

---

## What Was Fixed

### Files Updated:
- ✅ `backend/src/data/completeMenu.js` - Added missing images
- ✅ `backend/quickSeed.js` - Added missing images  
- ✅ `backend/migrateImages.js` - New migration script

### Images Added to:
- **SANDWICHES:**
  - BBQ CHEESEBURGER → `Choricheeseburger2.jpg`

- **SIDES:**
  - CAJUN FRIES → `placeholder.jpg`

- **RICE MEALS:**
  - BURGER STEAK RICE MEAL → `Baconsteak.jpg`

---

## Image Files Available
All these images are already in your `/frontend/public/images/food/` folder:
- `ThickCutBacon.jpg` ✓ (THICK CUT BACON)
- `CrispyChix.jpg` ✓ (CRISPY CHIX)
- `Choricheeseburger.jpg` ✓ (CHORI CHEESEBURGER)
- `Choricheeseburger2.jpg` ✓ (BBQ CHEESEBURGER - now using this)
- `BuffaloWings12s_2.jpg` (CHICKEN WINGS)
- `Baconsteak.jpg` (BACON STEAK RICE MEAL)
- `Homemadechorizo.jpg` (HOMEMADE CHORIZO)
- `Chickentocino.jpg` (CHICKEN TOCINO)
- And more...

---

## Important Notes for Vercel + Render + MongoDB Setup

### ✓ Image Path Format
Your app uses this logic for image paths:
1. Images stored in MongoDB as: `food/filename.jpg` or `filename.jpg`
2. Frontend looks for them in: `/images/food/` (public folder)
3. The `getFoodImage()` utility normalizes paths automatically

### ✓ Case Sensitivity
- **On Vercel (Windows)**: Case-insensitive (mostly works)
- **On Render (Linux)**: **Case-sensitive!** Exactly match filename casing
- Example: `Choricheeseburger.jpg` ≠ `choricheeseburger.jpg` on Linux

### ✓ Deployment Flow
```
Local Changes → Commit & Push → Vercel (auto-deploys frontend)
                            ↓ Render (auto-deploys backend)  
                            ↓ MongoDB Atlas (always in sync)
```

---

## Troubleshooting

### Images Still Not Showing?
1. **Check browser console** (F12) for 404 errors
2. **Verify MongoDB connection** - Check Render logs
3. **Clear browser cache** - Ctrl+Shift+Delete
4. **Hard refresh** - Ctrl+F5
5. **Run migration script** - If database is truly updated

### Wrong Image Showing?
- Verify image filename in MongoDB matches exactly
- Check `imageUtils.js` path construction
- Ensure no spaces in filenames

---

## Next Steps

After fixing the sandwich images:
1. Add images for other items (Cocktails, Yogurt Milkshakes, etc.)
2. Consider uploading images to a CDN instead (Cloudinary, AWS S3)
3. Implement image upload functionality in admin panel

