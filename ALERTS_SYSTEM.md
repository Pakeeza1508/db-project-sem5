# 🔔 Alert System Documentation

## Overview
Comprehensive notification system that alerts users about:
- **Price Drops**: Get notified when trip costs decrease by 5% or more
- **Seasonal Events**: Discover festivals, best times to visit destinations
- **Real-time Updates**: Daily automated checks with MongoDB-backed tracking

---

## 🏗️ Architecture

### Database Collections

#### 1. `alerts` Collection
Stores user price drop subscriptions
```javascript
{
  _id: ObjectId,
  userId: "user123" or "anonymous",
  email: "user@example.com" or null,
  destination: "Lahore",
  budget: 50000,
  days: 3,
  travelType: "Solo",
  currentPrice: 45000,
  alertThreshold: 5, // Percentage
  targetPrice: 42750, // currentPrice * (1 - threshold/100)
  active: true,
  triggered: false,
  createdAt: ISODate,
  lastChecked: ISODate,
  triggeredAt: ISODate or null,
  latestPrice: 42000,
  priceDrop: 6.67, // Percentage
  notifications: [
    {
      message: "Price Alert! Lahore trip cost dropped by 6.7%",
      oldPrice: 45000,
      newPrice: 42000,
      savings: 3000,
      triggeredAt: ISODate
    }
  ]
}
```

#### 2. `seasonalEvents` Collection
Festival and best-time-to-visit data
```javascript
{
  _id: ObjectId,
  city: "Lahore",
  country: "Pakistan",
  eventName: "Dolmen Mall Winter Festivals",
  eventType: "Shopping & Entertainment",
  description: "End-of-year shopping festivals...",
  bestMonths: ["November", "December"],
  peakMonth: "December",
  alertMessage: "🎉 Dolmen Mall Lahore Winter Festival is coming!",
  icon: "🛍️",
  priority: "high" // high, medium, low
}
```

#### 3. `priceHistory` Collection
Historical price tracking
```javascript
{
  _id: ObjectId,
  destination: "Lahore",
  days: 3,
  travelType: "Solo",
  totalCost: 45000,
  breakdown: {
    accommodation: 15000,
    transport: 10000,
    food: 12000,
    activities: 8000
  },
  recordedAt: ISODate,
  source: "budget-search"
}
```

---

## 🚀 Backend Functions

### 1. `seedSeasonalEvents.js`
**Purpose**: Initialize database with seasonal events/festivals

**Endpoint**: `GET /.netlify/functions/seedSeasonalEvents`

**Seeded Events**:
- Lahore: Dolmen Mall Festivals, Basant, Food Streets
- Karachi: Clifton Beach Season, Karachi Eat Festival
- Islamabad: Margalla Hiking, Spring Flowers
- Murree: Snowfall Season
- Hunza: Cherry Blossom, Autumn Colors
- Swat: Malam Jabba Skiing
- Skardu: Summer Trekking
- Naran: Lake Saif ul Malook
- Multan: Mango Festival
- Dubai, Paris, Tokyo (international examples)

**Response**:
```json
{
  "success": true,
  "message": "Seasonal events seeded successfully",
  "count": 18
}
```

---

### 2. `getSeasonalRecommendations.js`
**Purpose**: Get seasonal events for a destination

**Endpoints**:
- All events: `GET /.netlify/functions/getSeasonalRecommendations`
- By city: `GET /.netlify/functions/getSeasonalRecommendations?city=Lahore`
- By month: `GET /.netlify/functions/getSeasonalRecommendations?month=December`
- Combined: `GET /.netlify/functions/getSeasonalRecommendations?city=Lahore&month=December`

**Response**:
```json
{
  "success": true,
  "city": "Lahore",
  "month": "December",
  "events": [
    {
      "city": "Lahore",
      "eventName": "Dolmen Mall Winter Festivals",
      "alertMessage": "🎉 Dolmen Mall Lahore Winter Festival is coming!",
      "icon": "🛍️",
      "priority": "high",
      "peakMonth": "December"
    }
  ],
  "count": 1,
  "hasAlerts": true
}
```

---

### 3. `subscribeToAlerts.js`
**Purpose**: Manage price drop alert subscriptions

**Create Alert** (POST):
```bash
curl -X POST /.netlify/functions/subscribeToAlerts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "email": "user@example.com",
    "destination": "Lahore",
    "currentPrice": 45000,
    "budget": 50000,
    "days": 3,
    "travelType": "Solo",
    "alertThreshold": 5
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Alert created! You'll be notified when price drops by 5% or more.",
  "alertId": "60a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Get User Alerts** (GET):
```bash
curl "/.netlify/functions/subscribeToAlerts?userId=user123"
```

**Delete Alert** (DELETE):
```bash
curl -X DELETE "/.netlify/functions/subscribeToAlerts?alertId=60a1b2c3d4e5f6g7h8i9j0k1"
```

---

### 4. `trackPriceHistory.js`
**Purpose**: Record and analyze price trends

**Record Price** (POST):
```bash
curl -X POST /.netlify/functions/trackPriceHistory \
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

**Response**:
```json
{
  "success": true,
  "message": "Price recorded successfully",
  "trend": "decreasing",
  "percentageChange": "-6.67",
  "currentPrice": 45000,
  "avgRecentPrice": "48200.00"
}
```

**Get Price History** (GET):
```bash
curl "/.netlify/functions/trackPriceHistory?destination=Lahore&days=3&limit=30"
```

**Response**:
```json
{
  "success": true,
  "destination": "Lahore",
  "days": "3",
  "history": [...],
  "stats": {
    "minPrice": 42000,
    "maxPrice": 52000,
    "avgPrice": "46500.00",
    "currentPrice": 45000,
    "savingsFromMax": "13.46",
    "dataPoints": 15
  }
}
```

---

### 5. `checkPriceDrops.js` (Scheduled)
**Purpose**: Daily automated price drop detection

**Schedule**: Runs daily at midnight UTC (configured in netlify.toml)

**Process**:
1. Fetches all active, non-triggered alerts
2. Gets latest price for each destination from `priceHistory`
3. Calculates price drop percentage
4. If drop ≥ threshold, triggers alert
5. Updates alert status and adds notification
6. (Optional) Sends email notification

**Manual Test**:
```bash
curl "/.netlify/functions/checkPriceDrops"
```

**Response**:
```json
{
  "success": true,
  "message": "Price drop check completed",
  "stats": {
    "totalActive": 5,
    "checked": 5,
    "triggered": 2,
    "triggeredAlerts": [
      {
        "alertId": "...",
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

## 🎨 Frontend Integration

### `alert-system.js`
Main frontend module for notifications

#### Key Functions:

**`initAlertSystem()`**
- Adds notification bell icon to header
- Loads user's triggered alerts
- Checks for seasonal events
- Updates badge count

**`subscribeToPriceAlert(destination, currentPrice, budget, days, travelType)`**
- Subscribes user to price drop notifications
- Returns alert ID on success

**`trackPrice(destination, days, travelType, totalCost, breakdown)`**
- Records price in history (called after budget search)

**`showToast(message, type)`**
- Shows success/error notifications

---

## 📋 Usage Examples

### 1. Subscribe to Price Alert (Frontend)
```javascript
// After user clicks "Get Price Alerts" button
const alertId = await subscribeToPriceAlert(
  'Lahore',       // destination
  45000,          // current price
  50000,          // budget
  3,              // days
  'Solo'          // travel type
);

if (alertId) {
  showToast('✅ Alert subscribed! We\'ll notify you when prices drop.', 'success');
}
```

### 2. Track Price After Search
```javascript
// Automatically called in displayResults()
await trackPrice(
  'Lahore',
  3,
  'Solo',
  45000,
  { transport: 10000, food: 12000, localTransport: 8000, activities: 15000 }
);
```

### 3. Display Seasonal Events
```javascript
// Load events for a destination
const response = await fetch('/.netlify/functions/getSeasonalRecommendations?city=Lahore&month=December');
const data = await response.json();

if (data.hasAlerts) {
  displaySeasonalEventBadge('Lahore', data.events);
}
```

---

## 🎯 User Experience Flow

### Budget Search Page:
1. User searches for destinations
2. Results show with "Get Price Alerts" button
3. Seasonal event badges appear (e.g., "🎉 Dolmen Mall Winter Festival")
4. Click alert button → subscribed
5. Price tracked automatically in database

### Notification Bell:
1. Bell icon in header shows unread count
2. Click bell → dropdown opens
3. Shows:
   - Price drop alerts with old/new prices
   - Seasonal event recommendations
   - Time stamps

### Daily Monitoring:
1. Cron job runs at midnight UTC
2. Checks all active alerts
3. Compares current prices with history
4. Triggers alerts if price drops ≥ 5%
5. User sees notification next time they visit

---

## ⚙️ Configuration

### Netlify Scheduled Functions
**File**: `netlify.toml`
```toml
[[functions]]
  name = "checkPriceDrops"
  schedule = "0 0 * * *"  # Daily at midnight UTC
```

### Email Notifications (Optional)
To enable email alerts, add to `checkPriceDrops.js`:

```javascript
// Install: npm install @sendgrid/mail
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: alert.email,
  from: 'alerts@wanderly.com',
  subject: 'Price Drop Alert!',
  html: `
    <h2>🎉 Great News!</h2>
    <p>${notification.message}</p>
    <p><strong>Old Price:</strong> PKR ${notification.oldPrice}</p>
    <p><strong>New Price:</strong> PKR ${notification.newPrice}</p>
    <p><strong>You Save:</strong> PKR ${notification.savings}</p>
  `
};

await sgMail.send(msg);
```

**Environment Variable**:
```bash
SENDGRID_API_KEY=your_api_key_here
```

---

## 🧪 Testing

### Test Seasonal Events
```bash
# Seed events
curl http://localhost:8888/.netlify/functions/seedSeasonalEvents

# Get Lahore events
curl "http://localhost:8888/.netlify/functions/getSeasonalRecommendations?city=Lahore"

# Get December events
curl "http://localhost:8888/.netlify/functions/getSeasonalRecommendations?month=December"
```

### Test Price Alerts
```bash
# Create alert
curl -X POST http://localhost:8888/.netlify/functions/subscribeToAlerts \
  -H "Content-Type: application/json" \
  -d '{"destination":"Lahore","currentPrice":45000,"days":3,"travelType":"Solo"}'

# Track price (lower than alert)
curl -X POST http://localhost:8888/.netlify/functions/trackPriceHistory \
  -H "Content-Type: application/json" \
  -d '{"destination":"Lahore","days":3,"totalCost":42000}'

# Check price drops (manual trigger)
curl http://localhost:8888/.netlify/functions/checkPriceDrops

# Get user alerts
curl "http://localhost:8888/.netlify/functions/subscribeToAlerts?userId=anonymous"
```

---

## 📊 Database Indexes

For optimal performance, create these indexes:

```javascript
// alerts collection
db.alerts.createIndex({ userId: 1, active: 1 })
db.alerts.createIndex({ destination: 1, days: 1 })
db.alerts.createIndex({ triggered: 1, active: 1 })

// seasonalEvents collection
db.seasonalEvents.createIndex({ city: 1, country: 1 })
db.seasonalEvents.createIndex({ peakMonth: 1 })
db.seasonalEvents.createIndex({ priority: 1 })

// priceHistory collection
db.priceHistory.createIndex({ destination: 1, days: 1, recordedAt: -1 })
db.priceHistory.createIndex({ recordedAt: -1 })
```

---

## 🚀 Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Push notifications (PWA)
- [ ] Custom alert thresholds (user preference)
- [ ] Weekly digest emails
- [ ] Alert for specific dates/seasons
- [ ] Multi-destination alerts
- [ ] Price prediction with ML
- [ ] Alert history dashboard

---

## 📞 Support

**Logs**: Check Netlify Functions logs for scheduled function executions
**Debug**: Use manual curl commands to test endpoints
**Email Issues**: Verify SendGrid API key and sender authentication

---

**Status**: ✅ Production Ready  
**Last Updated**: December 18, 2024
