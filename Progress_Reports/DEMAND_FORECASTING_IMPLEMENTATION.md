# 📊 DEMAND FORECASTING WITH PROPHET - IMPLEMENTATION GUIDE

**Status:** Ready to build  
**Algorithm:** Facebook Prophet  
**Timeline:** 13 days until pre-oral (Feb 26, 2026)  
**Purpose:** Long-term production use for client restaurant

---

## 🎯 WHY PROPHET?

| **Criterion** | **Why Prophet Wins** |
|--------------|-------------------|
| **Data Need** | Works with 2-4 weeks of data (you have this) |
| **Speed** | Implement in 2-3 hours |
| **Restaurant Fit** | Auto-detects lunch/dinner rush patterns |
| **Production Ready** | Improves continuously as data accumulates |
| **Explainable** | Easy to explain in pre-oral presentation |
| **Visualizations** | Beautiful charts for dashboard |
| **Scalable** | Upgrade path to ensemble/LSTM after 1 year |

---

## 📋 IMPLEMENTATION PHASES

### **PHASE 1: FOUNDATION (Pre-Oral - Feb 26)**
Objective: Get Prophet working with real data

#### **1.1 Install Dependencies**
```bash
cd backend
pip install prophet pandas numpy
```

#### **1.2 Create Data Collection System**
**File:** `backend/src/services/dataCollectionService.js`
- Query MongoDB orders
- Aggregate by date (daily total orders)
- Handle missing dates
- Export to CSV for Prophet

**Data needed:**
- Order date/time
- Quantity of items ordered
- Category (optional: separate desserts, beverages)
- Status (completed orders only)

**Minimum viable data:**
- 2 weeks = basic forecast
- 4 weeks = good accuracy
- 8+ weeks = excellent accuracy

#### **1.3 Create Prophet Integration**
**File:** `backend/src/services/forecastService.js`
- Loads historical order data
- Runs Prophet model
- Returns 7-day forecast with confidence intervals
- Tracks model accuracy (MAE, RMSE)

**Key Prophet settings:**
```python
from prophet import Prophet

# Initialize model
model = Prophet(
    yearly_seasonality=False,      # Not enough data yet
    weekly_seasonality=True,       # Detect weekly patterns
    daily_seasonality=False,       # Need hourly data for this
    seasonality_mode='additive',   # Good for restaurants
    interval_width=0.95            # 95% confidence interval
)

# Fit historical data
model.fit(df)

# Make forecast
future = model.make_future_dataframe(periods=7)
forecast = model.predict(future)
```

#### **1.4 Create API Endpoint**
**File:** `backend/src/routes/forecastRoutes.js`

```
GET /api/forecast?days=7
Response:
{
  "forecast": [
    {
      "date": "2026-02-14",
      "predicted_orders": 45,
      "lower_bound": 38,
      "upper_bound": 52,
      "confidence": 0.95
    },
    ...
  ],
  "model_accuracy": {
    "mae": 3.2,
    "rmse": 4.1,
    "data_points_used": 28
  }
}
```

#### **1.5 Add Dashboard Component**
**File:** `frontend/src/components/admin/ForecastChart.js`
- Display 7-day forecast graph
- Show confidence intervals
- Display key insights: "Expected 45 orders tomorrow"
- Show model accuracy metrics

#### **1.6 Update Admin Dashboard**
**File:** `frontend/src/pages/admin/AdminDashboard.js`
- Import ForecastChart component
- Display alongside current orders
- Add "Forecast" tab to dashboard

---

### **PHASE 2: PRESENTATION (Pre-Oral)**

**What to demonstrate:**
1. ✅ Prophet model forecasting next 7 days
2. ✅ Accuracy metrics (how good are predictions?)
3. ✅ Dashboard showing forecast chart
4. ✅ Explain why Prophet was chosen
5. ✅ Show how it will improve with more data

**What to say:**
> "We implemented Facebook Prophet for demand forecasting. It analyzes weekly patterns (lunch/dinner rushes) and predicts daily order volume. As we collect more data (2-4+ months), accuracy will improve significantly. The restaurant can use these predictions for inventory management and staff scheduling."

---

### **PHASE 3: LONG-TERM (Beyond Pre-Oral)**

#### **3.1 Weekly Retraining (Ongoing)**
- Every Monday: Retrain model with new week's data
- Track accuracy over time
- Alert if accuracy drops below threshold

#### **3.2 Advanced Insights**
**Add to dashboard:**
- Stock recommendations: "Order 60 chickens tomorrow"
- Staff scheduling: "Expect rush at 11:30 AM, staff 4 cooks"
- Inventory alerts: "Cheese stock will run out Friday, reorder now"

#### **3.3 Category-Level Forecasting**
- Separate models for: Mains, Desserts, Beverages
- Better inventory management per category

#### **3.4 External Factors** (Optional)
- Add weather data (people order more on rainy days)
- Add promotion dates (forecast spikes on promo days)
- Add holiday calendar

#### **3.5 Upgrade to Ensemble** (After 6+ months)
- Combine Prophet + LSTM
- Better accuracy with larger dataset
- Keep Prophet for interpretability

---

## 🗂️ FILES TO CREATE/MODIFY

| **File** | **Action** | **Purpose** |
|---------|-----------|-----------|
| `backend/src/services/dataCollectionService.js` | CREATE | Aggregate order data |
| `backend/src/services/forecastService.js` | CREATE | Run Prophet model |
| `backend/src/routes/forecastRoutes.js` | CREATE | API endpoints |
| `backend/src/models/Forecast.js` | CREATE | Store predictions in DB |
| `frontend/src/components/admin/ForecastChart.js` | CREATE | Display forecast graph |
| `frontend/src/pages/admin/AdminDashboard.js` | MODIFY | Add ForecastChart |
| `backend/package.json` | MODIFY | Add prophet dependency |
| `backend/src/routes/index.js` | MODIFY | Import forecastRoutes |

---

## ⏰ TIMELINE (13 DAYS)

**Day 1-2 (Feb 13-14):** 
- Install dependencies ✓
- Create data collection service ✓
- Create forecast service ✓

**Day 3-4 (Feb 15-16):**
- Create API endpoints ✓
- Test with sample data ✓

**Day 5-6 (Feb 17-18):**
- Build dashboard component ✓
- Add to AdminDashboard ✓

**Day 7-10 (Feb 19-22):**
- Polish UI/UX
- Collect real data
- Test with actual restaurant orders
- Verify accuracy

**Day 11-13 (Feb 23-25):**
- Prepare pre-oral presentation
- Document system
- Create demo data
- Practice explanation

**Feb 26:** Pre-Oral presentation ✅

---

## 📊 EXPECTED RESULTS

**After 2 weeks of data:**
- Forecast accuracy: ~80%
- Detects lunch/dinner patterns

**After 1 month of data:**
- Forecast accuracy: ~85-90%
- Captures weekly patterns

**After 3 months of data:**
- Forecast accuracy: ~90%+
- Ready for production use

---

## 🚨 POTENTIAL CHALLENGES & SOLUTIONS

| **Challenge** | **Solution** |
|---------------|------------|
| **Not enough historical data** | Seed with synthetic data for pre-oral, use real data afterwards |
| **Forecast accuracy low initially** | Normal - improves as you collect more data. Show trend of improvement |
| **Orders aren't being captured** | Fix database connection first (TIER 1 priority) |
| **Prophet installation fails** | Make sure Python 3.7+ installed, use virtual environment |

---

## 📚 RESOURCES

- **Prophet Documentation:** https://facebook.github.io/prophet/
- **Prophet Quick Start:** https://facebook.github.io/prophet/docs/quick_start.html
- **Restaurant Demand Forecasting Best Practices:** Use weekly seasonality, ingore daily for now

---

## ✅ PRE-ORAL CHECKLIST

- [ ] Prophet API endpoint working
- [ ] Dashboard showing 7-day forecast
- [ ] Accuracy metrics displayed
- [ ] Demo data seeded
- [ ] Chart renders beautifully
- [ ] Can explain why Prophet was chosen
- [ ] Can explain how accuracy will improve
- [ ] Know next steps after pre-oral
- [ ] Presentation slides ready

---

## 🎯 NEXT STEP

**Ready to build?** Start with:
1. Install prophet/pandas/numpy
2. Create data collection service
3. Run initial forecast

Ask if you need help with any step!
