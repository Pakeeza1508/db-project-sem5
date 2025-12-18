# 🚀 Quick Start: Testing Alert System

## Step 1: Seed Seasonal Events Database

```bash
# Start dev server
netlify dev

# Open in browser or curl:
curl http://localhost:8888/.netlify/functions/seedSeasonalEvents
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Seasonal events seeded successfully",
  "count": 18
}
```

---

## Step 2: Test Budget Search with Alerts

1. **Open Budget Search**: `http://localhost:8888/budget-search.html`

2. **Fill Form**:
   - Budget: 50000 PKR
   - Days: 3
   - Starting City: Karachi
   - Travel Type: Solo

3. **Submit**: Click "Find Destinations"

4. **Expected Results**:
   - ✅ 3 destination cards appear
   - ✅ Each card shows "Get Price Alerts" button
   - ✅ Seasonal event badges appear (e.g., Lahore shows Dolmen Mall Festival if in Nov/Dec)
   - ✅ Notification bell icon in header

---

## Step 3: Subscribe to Price Alert

1. **Click** "Get Price Alerts" on a destination card (e.g., Lahore)

2. **Expected Behavior**:
   - Button changes to "Subscribed" with checkmark
   - Toast notification: "✅ Alert subscribed! We'll notify you when prices drop."

3. **Verify in Database**:
```bash
# Open MongoDB Compass
# Collection: alerts
# Should see new document with:
{
  destination: "Lahore",
  currentPrice: 45000,
  alertThreshold: 5,
  active: true,
  triggered: false
}
```

---

## Step 4: Check Seasonal Events

**Browser Console**:
```javascript
// Get Lahore events
fetch('/.netlify/functions/getSeasonalRecommendations?city=Lahore&month=December')
  .then(r => r.json())
  .then(data => console.log(data));
```

**Expected Response**:
```json
{
  "success": true,
  "city": "Lahore",
  "month": "December",
  "events": [
    {
      "eventName": "Dolmen Mall Winter Festivals",
      "alertMessage": "🎉 Dolmen Mall Lahore Winter Festival is coming!",
      "icon": "🛍️",
      "priority": "high"
    },
    {
      "eventName": "Food Street Peak Season",
      "alertMessage": "🍽️ Perfect weather for Lahore Food Streets!",
      "icon": "🍽️",
      "priority": "medium"
    }
  ]
}
```

---

## Step 5: Simulate Price Drop

### 5.1 Record Initial Price
```bash
curl -X POST http://localhost:8888/.netlify/functions/trackPriceHistory \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Lahore",
    "days": 3,
    "travelType": "Solo",
    "totalCost": 45000,
    "breakdown": {
      "transport": 10000,
      "food": 12000,
      "localTransport": 8000,
      "activities": 15000
    }
  }'
```

### 5.2 Record Lower Price (simulate drop)
```bash
curl -X POST http://localhost:8888/.netlify/functions/trackPriceHistory \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Lahore",
    "days": 3,
    "travelType": "Solo",
    "totalCost": 42000,
    "breakdown": {
      "transport": 9000,
      "food": 11000,
      "localTransport": 7000,
      "activities": 15000
    }
  }'
```

### 5.3 Check for Price Drops
```bash
curl http://localhost:8888/.netlify/functions/checkPriceDrops
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Price drop check completed",
  "stats": {
    "totalActive": 1,
    "checked": 1,
    "triggered": 1,
    "triggeredAlerts": [
      {
        "destination": "Lahore",
        "notification": {
          "message": "🎉 Price Alert! Lahore trip cost dropped by 6.7%",
          "oldPrice": 45000,
          "newPrice": 42000,
          "savings": "3000.00"
        }
      }
    ]
  }
}
```

---

## Step 6: View Alert Notification

1. **Refresh** budget-search.html or planner.html

2. **Click** notification bell icon in header

3. **Expected Dropdown**:
   - Red badge with "1" count
   - Alert item showing:
     ```
     💰 Price Drop Alert!
     Price Alert! Lahore trip cost dropped by 6.7%
     
     PKR 45,000 → PKR 42,000
     Save PKR 3,000
     
     Just now
     ```

---

## Step 7: Test Seasonal Alert Badge

**December Example**:
1. Search for Lahore (November/December)
2. Destination card shows:
   ```
   🛍️ Dolmen Mall Winter Festivals
   December • Shopping & Entertainment
   ```

**April Example**:
1. Search for Hunza (March/April)
2. Card shows:
   ```
   🌸 Cherry Blossom Season
   April • Nature & Photography
   ```

---

## Step 8: Get Price History & Stats

```bash
curl "http://localhost:8888/.netlify/functions/trackPriceHistory?destination=Lahore&days=3&limit=10"
```

**Expected Response**:
```json
{
  "success": true,
  "destination": "Lahore",
  "history": [
    { "totalCost": 42000, "recordedAt": "2024-12-18T..." },
    { "totalCost": 45000, "recordedAt": "2024-12-17T..." }
  ],
  "stats": {
    "minPrice": 42000,
    "maxPrice": 45000,
    "avgPrice": "43500.00",
    "currentPrice": 42000,
    "savingsFromMax": "6.67",
    "dataPoints": 2
  }
}
```

---

## Step 9: Get User's Alerts

```bash
curl "http://localhost:8888/.netlify/functions/subscribeToAlerts?userId=anonymous"
```

**Expected Response**:
```json
{
  "success": true,
  "alerts": [
    {
      "destination": "Lahore",
      "currentPrice": 45000,
      "targetPrice": 42750,
      "active": true,
      "triggered": true,
      "notifications": [
        {
          "message": "🎉 Price Alert! Lahore trip cost dropped by 6.7%",
          "oldPrice": 45000,
          "newPrice": 42000,
          "savings": "3000.00"
        }
      ]
    }
  ],
  "count": 1,
  "activeAlerts": 0,
  "triggeredAlerts": 1
}
```

---

## Step 10: Delete Alert

```bash
curl -X DELETE "http://localhost:8888/.netlify/functions/subscribeToAlerts?alertId=YOUR_ALERT_ID"
```

---

## 🎯 Success Checklist

- [x] Seasonal events seeded (18 events)
- [x] Budget search shows seasonal badges
- [x] "Get Price Alerts" button works
- [x] Toast notifications appear
- [x] Notification bell shows in header
- [x] Price tracking works
- [x] Price drop detection triggers alerts
- [x] Alert dropdown displays notifications
- [x] Price history stats calculate correctly
- [x] Seasonal events filter by city/month

---

## 🐛 Troubleshooting

**No seasonal badges?**
- Check current month matches event months
- Verify events seeded: `db.seasonalEvents.count()`

**Alerts not triggering?**
- Ensure price drop is ≥ 5%
- Check alert threshold in database
- Manually run checkPriceDrops

**Bell not showing?**
- Check browser console for errors
- Verify alert-system.js loaded
- Ensure initAlertSystem() called

**No price history?**
- Track prices after budget search
- Check priceHistory collection in MongoDB

---

## 📅 Scheduled Function (Production)

Once deployed to Netlify:
1. Scheduled function runs automatically at midnight UTC
2. Check logs: Netlify Dashboard > Functions > checkPriceDrops
3. View execution history and any errors

**Manual Trigger**:
```bash
curl https://your-site.netlify.app/.netlify/functions/checkPriceDrops
```

---

## 🎉 All Done!

You now have a fully functional alert system with:
- ✅ Price drop monitoring
- ✅ Seasonal event recommendations  
- ✅ Real-time notifications
- ✅ Historical price tracking
- ✅ User subscriptions
- ✅ Automated daily checks

Enjoy your smart travel planning with alerts! 🚀
