# Wanderly Trip Planner - Database Schema

## Database: `wanderly`

This document outlines the complete MongoDB database schema for the Wanderly Trip Planner application.

---

## Collections Overview

1. **users** - User accounts and authentication
2. **plans** - Trip plans created by users
3. **trips** - Legacy trip data
4. **savedTrips** - User's saved/favorited trips
5. **shares** - Shared trip links with expiration
6. **comments** - Comments on shared trips
7. **testimonials** - User testimonials and reviews
8. **trendingDestinations** - Curated trending destinations
9. **cities** - City database with costs and information
10. **alerts** - Price drop alert subscriptions
11. **searchHistory** - User search history tracking
12. **seasonalEvents** - Seasonal events and recommendations
13. **exchangeRates** - Currency exchange rate data
14. **priceHistory** - Historical price data for destinations
15. **locations** - Location search cache
16. **cache** - General caching (AI responses, geocoding, weather)
17. **trending_destinations** - Additional trending destinations data

---

## Detailed Schema

### 1. users
**Purpose:** Store user account information and authentication data

```javascript
{
  _id: ObjectId,
  name: String,                    // User's full name
  email: String,                   // Email (lowercase, unique)
  password: String,                // Bcrypt hashed password
  createdAt: Date,                 // Account creation timestamp
  trips: Array                     // Array of trip IDs (legacy field)
}
```

**Indexes:**
- `email`: Unique index for fast user lookup

---

### 2. plans
**Purpose:** Store detailed trip plans created by users

```javascript
{
  _id: ObjectId,
  userId: String,                  // User ID who created the plan
  destination: String,             // Destination name
  days: Number,                    // Number of travel days
  startDate: String,               // Trip start date (YYYY-MM-DD)
  endDate: String,                 // Trip end date (YYYY-MM-DD)
  budget: Number,                  // Total budget in PKR
  travelType: String,              // "solo", "couple", "family", "friends"
  travelers: Number,               // Number of travelers
  
  // Trip details
  activities: Array,               // Array of planned activities
  accommodation: Object,           // Hotel/accommodation details
  transportation: Object,          // Transportation details
  itinerary: Array,                // Day-by-day itinerary
  
  // Costs breakdown
  costs: {
    accommodation: Number,
    transportation: Number,
    activities: Number,
    food: Number,
    total: Number
  },
  
  // Metadata
  createdAt: Date,                 // Plan creation timestamp
  updatedAt: Date,                 // Last update timestamp
  rating: Number,                  // User rating (1-5)
  favorite: Boolean,               // Is favorited by user
  notes: String,                   // Additional notes
  
  // AI-generated content
  aiResponse: String,              // AI-generated suggestions
  recommendations: Array           // AI recommendations
}
```

**Indexes:**
- `userId`: Index for filtering by user
- `destination`: Text index for search
- `createdAt`: Index for sorting by date
- `rating`: Index for filtering rated trips

---

### 3. trips (Legacy)
**Purpose:** Legacy trip storage (older format)

```javascript
{
  _id: ObjectId,
  destination: String,             // Destination name
  duration: Number,                // Trip duration in days
  travelDays: Number,              // Number of travel days
  
  // Costs
  costs: {
    total: String                  // Total cost as string (e.g., "$2,500")
  },
  total_cost_numeric: Number,      // Parsed numeric cost
  
  createdAt: Date,                 // Creation timestamp
  
  // Additional fields from user input
  // (varies based on trip data)
}
```

**Indexes:**
- `destination`: Text index for search
- `total_cost_numeric`: Index for budget filtering

---

### 4. savedTrips
**Purpose:** Track user's saved/favorited trips

```javascript
{
  _id: ObjectId,
  userId: String,                  // User ID who saved the trip
  tripId: ObjectId,                // Reference to plan/trip
  savedAt: Date,                   // When trip was saved
  notes: String,                   // Optional user notes
  tags: Array                      // Optional tags
}
```

**Indexes:**
- `userId`: Index for filtering by user
- `tripId`: Index for filtering by trip
- Compound index on `(userId, tripId)` for uniqueness

---

### 5. shares
**Purpose:** Manage shared trip links with expiration

```javascript
{
  _id: ObjectId,
  shareId: String,                 // Unique share identifier (16 char hex)
  tripId: ObjectId,                // Reference to the trip being shared
  createdAt: Date,                 // Share creation timestamp
  expiresAt: Date,                 // Expiration timestamp
  password: String | null,         // Optional password protection
  views: Number                    // Number of times viewed
}
```

**Indexes:**
- `shareId`: Unique index for fast lookup
- `expiresAt`: Index for cleanup queries
- `tripId`: Index for finding shares of a trip

---

### 6. comments
**Purpose:** Store comments on shared trips

```javascript
{
  _id: ObjectId,
  shareId: String,                 // Reference to the share
  author: String,                  // Comment author name
  text: String,                    // Comment text
  createdAt: Date                  // Comment timestamp
}
```

**Indexes:**
- `shareId`: Index for loading comments by share
- `createdAt`: Index for sorting

---

### 7. testimonials
**Purpose:** Store user testimonials and reviews

```javascript
{
  _id: ObjectId,
  name: String,                    // User name
  text: String,                    // Testimonial text
  avatar: String,                  // Avatar URL
  rating: Number,                  // Rating 1-5
  createdAt: Date,                 // Creation timestamp
  likes: Number                    // Number of likes (optional)
}
```

**Indexes:**
- `createdAt`: Index for sorting
- `rating`: Index for filtering

---

### 8. trendingDestinations
**Purpose:** Curated trending destinations to display

```javascript
{
  _id: ObjectId,
  name: String,                    // Destination name
  country: String,                 // Country name
  imageUrl: String,                // Destination image URL
  tripadvisorUrl: String,          // TripAdvisor link
  createdAt: Date                  // When added
}
```

**Indexes:**
- `name`: Text index for search

---

### 9. cities
**Purpose:** Comprehensive city database with costs and information

```javascript
{
  _id: ObjectId,
  name: String,                    // City name
  avgPerDay: Number,               // Average cost per day (PKR)
  busFare: Number,                 // Bus/transport fare (PKR)
  
  // Accommodation costs
  hotelCheap: Number,              // Budget hotel (PKR/night)
  hotelModerate: Number,           // Mid-range hotel (PKR/night)
  hotelLuxury: Number,             // Luxury hotel (PKR/night)
  
  foodAvg: Number,                 // Average food cost per day (PKR)
  rating: Number,                  // City rating (1-5)
  attractions: String,             // Key attractions (comma-separated)
  weather: String,                 // Weather description
  region: String,                  // Geographic region
  
  // Seasonal information
  bestMonths: Array[String],       // Best months to visit
  avoidMonths: Array[String],      // Months to avoid
  seasonalWarning: String,         // Seasonal warning message
  
  // Location (optional)
  coordinates: {
    lat: Number,
    lng: Number
  }
}
```

**Indexes:**
- `name`: Text index for search
- `avgPerDay`: Index for budget filtering
- `region`: Index for regional filtering

---

### 10. alerts
**Purpose:** Price drop alert subscriptions

```javascript
{
  _id: ObjectId,
  userId: String,                  // User ID (or "anonymous")
  email: String | null,            // Email for notifications
  destination: String,             // Destination being monitored
  
  // Search criteria
  budget: Number | null,           // Budget threshold
  days: Number | null,             // Number of days
  travelType: String | null,       // Travel type
  
  // Price tracking
  currentPrice: Number,            // Current price when subscribed
  alertThreshold: Number,          // Alert when drops by X%
  targetPrice: Number,             // Target price to trigger alert
  
  // Status
  active: Boolean,                 // Is alert active
  triggered: Boolean,              // Has alert been triggered
  
  // Timestamps
  createdAt: Date,                 // Alert creation
  lastChecked: Date,               // Last price check
  
  notifications: Array[{           // History of notifications sent
    sentAt: Date,
    oldPrice: Number,
    newPrice: Number,
    percentDrop: Number
  }]
}
```

**Indexes:**
- `userId`: Index for user alerts
- `destination`: Index for destination alerts
- `active`: Index for active alerts
- `lastChecked`: Index for batch checking

---

### 11. searchHistory
**Purpose:** Track user search history for personalization

```javascript
{
  _id: ObjectId,
  userId: String,                  // User ID
  searchType: String,              // "budget-search", "planner", "location", "destination"
  query: String | null,            // Search query text
  
  filters: {                       // Applied filters
    budget: Number,
    days: Number,
    travelType: String,
    region: String
    // ... other filters
  },
  
  results: Array | null,           // Search results (optional)
  resultCount: Number,             // Number of results
  searchedAt: Date,                // Search timestamp
  source: String                   // "web", "mobile", etc.
}
```

**Indexes:**
- `userId`: Index for user searches
- `searchedAt`: Index for sorting by date
- `searchType`: Index for filtering by type
- Compound index on `(userId, searchedAt)` for cleanup

---

### 12. seasonalEvents
**Purpose:** Store seasonal events and recommendations

```javascript
{
  _id: ObjectId,
  destination: String,             // Destination name
  month: String,                   // Month name
  season: String,                  // "Spring", "Summer", "Fall", "Winter"
  events: Array[String],           // List of events
  highlights: String,              // Seasonal highlights
  temperature: String,             // Temperature range
  crowds: String,                  // Crowd level
  pricing: String,                 // Price level
  recommendation: String           // Recommendation text
}
```

**Indexes:**
- `destination`: Index for filtering
- `month`: Index for month-based queries

---

### 13. exchangeRates
**Purpose:** Store currency exchange rates

```javascript
{
  _id: ObjectId,
  baseCurrency: String,            // Base currency (e.g., "USD")
  rates: {                         // Exchange rates
    PKR: Number,
    EUR: Number,
    GBP: Number,
    JPY: Number,
    AUD: Number,
    CAD: Number,
    SAR: Number,
    AED: Number
    // ... other currencies
  },
  lastUpdated: Date                // Last update timestamp
}
```

**Indexes:**
- `baseCurrency`: Index for lookup

---

### 14. priceHistory
**Purpose:** Track historical price data for destinations

```javascript
{
  _id: ObjectId,
  destination: String,             // Destination name
  date: Date,                      // Price date
  price: Number,                   // Price in base currency
  currency: String,                // Currency code
  travelType: String,              // Travel type
  days: Number,                    // Number of days
  source: String                   // Data source
}
```

**Indexes:**
- Compound index on `(destination, date)` for queries
- `destination`: Index for filtering

---

### 15. locations
**Purpose:** Cache for location search results

```javascript
{
  _id: ObjectId,
  query: String,                   // Search query
  results: Array[{                 // Location results
    name: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    type: String
  }],
  cachedAt: Date                   // Cache timestamp
}
```

**Indexes:**
- `query`: Index for cache lookup
- `cachedAt`: Index for cache expiration

---

### 16. cache
**Purpose:** General-purpose caching (AI responses, geocoding, weather)

```javascript
{
  _id: ObjectId,
  cacheKey: String,                // Unique cache key
  cacheType: String,               // "ai", "geocode", "weather", etc.
  data: Mixed,                     // Cached data (any type)
  cachedAt: Date,                  // Cache timestamp
  expiresAt: Date | null           // Expiration timestamp (optional)
}
```

**Indexes:**
- Compound index on `(cacheType, cacheKey)` for lookup
- `expiresAt`: Index for cleanup

---

### 17. trending_destinations
**Purpose:** Additional trending destinations data

```javascript
{
  _id: ObjectId,
  name: String,                    // Destination name
  country: String,                 // Country name
  popularity: Number,              // Popularity score
  imageUrl: String,                // Image URL
  description: String,             // Description
  createdAt: Date                  // When added
}
```

**Indexes:**
- `popularity`: Index for sorting
- `name`: Text index for search

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   users     │
│─────────────│
│ _id (PK)    │───┐
│ email       │   │
│ password    │   │
│ name        │   │
│ createdAt   │   │
└─────────────┘   │
                  │
                  │ userId (FK)
                  │
       ┌──────────┴──────────┬──────────────────┐
       │                     │                  │
       ▼                     ▼                  ▼
┌─────────────┐    ┌──────────────┐   ┌──────────────┐
│   plans     │    │  savedTrips  │   │ searchHistory│
│─────────────│    │──────────────│   │──────────────│
│ _id (PK)    │◄───│ tripId (FK)  │   │ userId (FK)  │
│ userId (FK) │    │ userId (FK)  │   │ searchType   │
│ destination │    │ savedAt      │   │ query        │
│ days        │    └──────────────┘   │ searchedAt   │
│ budget      │                       └──────────────┘
│ costs       │
│ createdAt   │
└─────────────┘
       │
       │ tripId (FK)
       │
       ▼
┌─────────────┐
│   shares    │
│─────────────│
│ _id (PK)    │───┐
│ shareId     │   │
│ tripId (FK) │   │
│ expiresAt   │   │ shareId (FK)
│ views       │   │
└─────────────┘   │
                  │
                  ▼
           ┌─────────────┐
           │  comments   │
           │─────────────│
           │ _id (PK)    │
           │ shareId(FK) │
           │ author      │
           │ text        │
           │ createdAt   │
           └─────────────┘

┌──────────────┐
│    alerts    │
│──────────────│
│ _id (PK)     │
│ userId       │
│ destination  │───┐
│ targetPrice  │   │
│ active       │   │
└──────────────┘   │
                   │
                   │ destination (relation)
                   │
                   ▼
            ┌─────────────┐
            │   cities    │
            │─────────────│
            │ _id (PK)    │
            │ name        │
            │ avgPerDay   │
            │ rating      │
            │ region      │
            └─────────────┘

┌──────────────────┐
│ trendingDests    │
│──────────────────│
│ _id (PK)         │
│ name             │
│ country          │
│ imageUrl         │
└──────────────────┘

┌──────────────────┐
│ testimonials     │
│──────────────────│
│ _id (PK)         │
│ name             │
│ text             │
│ rating           │
└──────────────────┘

┌──────────────────┐
│ seasonalEvents   │
│──────────────────│
│ _id (PK)         │
│ destination      │
│ month            │
│ events           │
└──────────────────┘

┌──────────────────┐
│ exchangeRates    │
│──────────────────│
│ _id (PK)         │
│ baseCurrency     │
│ rates            │
└──────────────────┘

┌──────────────────┐
│     cache        │
│──────────────────│
│ _id (PK)         │
│ cacheType        │
│ cacheKey         │
│ data             │
└──────────────────┘
```

---

## Class Diagram (OOP Representation)

```
┌──────────────────────────────┐
│         User                 │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - name: String               │
│ - email: String              │
│ - password: String           │
│ - createdAt: Date            │
│ - trips: Array               │
├──────────────────────────────┤
│ + register()                 │
│ + login()                    │
│ + updateProfile()            │
│ + getTrips()                 │
└──────────────────────────────┘
         │
         │ 1
         │
         │ *
         ▼
┌──────────────────────────────┐
│         Plan                 │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - userId: String             │
│ - destination: String        │
│ - days: Number               │
│ - budget: Number             │
│ - travelType: String         │
│ - costs: Object              │
│ - itinerary: Array           │
│ - rating: Number             │
│ - favorite: Boolean          │
│ - createdAt: Date            │
├──────────────────────────────┤
│ + createPlan()               │
│ + updatePlan()               │
│ + deletePlan()               │
│ + ratePlan()                 │
│ + toggleFavorite()           │
│ + share()                    │
└──────────────────────────────┘
         │
         │ 1
         │
         │ 0..1
         ▼
┌──────────────────────────────┐
│         Share                │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - shareId: String            │
│ - tripId: ObjectId           │
│ - expiresAt: Date            │
│ - password: String?          │
│ - views: Number              │
├──────────────────────────────┤
│ + createShare()              │
│ + validateAccess()           │
│ + incrementViews()           │
│ + getComments()              │
└──────────────────────────────┘
         │
         │ 1
         │
         │ *
         ▼
┌──────────────────────────────┐
│        Comment               │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - shareId: String            │
│ - author: String             │
│ - text: String               │
│ - createdAt: Date            │
├──────────────────────────────┤
│ + addComment()               │
│ + getComments()              │
└──────────────────────────────┘

┌──────────────────────────────┐
│         City                 │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - name: String               │
│ - avgPerDay: Number          │
│ - hotelCheap: Number         │
│ - hotelModerate: Number      │
│ - hotelLuxury: Number        │
│ - rating: Number             │
│ - attractions: String        │
│ - bestMonths: Array          │
├──────────────────────────────┤
│ + searchByBudget()           │
│ + getNearby()                │
│ + getSeasonalInfo()          │
└──────────────────────────────┘

┌──────────────────────────────┐
│         Alert                │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - userId: String             │
│ - destination: String        │
│ - currentPrice: Number       │
│ - targetPrice: Number        │
│ - active: Boolean            │
│ - triggered: Boolean         │
├──────────────────────────────┤
│ + subscribe()                │
│ + unsubscribe()              │
│ + checkPriceDrops()          │
│ + notify()                   │
└──────────────────────────────┘

┌──────────────────────────────┐
│      SearchHistory           │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - userId: String             │
│ - searchType: String         │
│ - query: String              │
│ - filters: Object            │
│ - searchedAt: Date           │
├──────────────────────────────┤
│ + saveSearch()               │
│ + getHistory()               │
│ + clearHistory()             │
│ + getRecommendations()       │
└──────────────────────────────┘

┌──────────────────────────────┐
│      Testimonial             │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - name: String               │
│ - text: String               │
│ - rating: Number             │
│ - avatar: String             │
│ - createdAt: Date            │
├──────────────────────────────┤
│ + addTestimonial()           │
│ + getTestimonials()          │
│ + likeTestimonial()          │
└──────────────────────────────┘

┌──────────────────────────────┐
│   TrendingDestination        │
├──────────────────────────────┤
│ - _id: ObjectId              │
│ - name: String               │
│ - country: String            │
│ - imageUrl: String           │
│ - tripadvisorUrl: String     │
├──────────────────────────────┤
│ + addDestination()           │
│ + getTrending()              │
└──────────────────────────────┘

┌──────────────────────────────┐
│      CacheService            │
├──────────────────────────────┤
│ - cacheType: String          │
│ - cacheKey: String           │
│ - data: Mixed                │
│ - expiresAt: Date            │
├──────────────────────────────┤
│ + set()                      │
│ + get()                      │
│ + invalidate()               │
│ + cleanup()                  │
└──────────────────────────────┘
```

---

## Key Relationships

1. **User → Plans**: One-to-Many
   - A user can create multiple trip plans
   - Each plan belongs to one user

2. **User → SavedTrips**: Many-to-Many (through savedTrips)
   - Users can save multiple trips
   - Trips can be saved by multiple users

3. **Plan → Share**: One-to-One or One-to-Many
   - A plan can be shared via one or more share links
   - Each share link references one plan

4. **Share → Comments**: One-to-Many
   - A shared trip can have multiple comments
   - Each comment belongs to one share

5. **User → SearchHistory**: One-to-Many
   - A user can have multiple search history entries
   - Each search belongs to one user

6. **User → Alerts**: One-to-Many
   - A user can subscribe to multiple price alerts
   - Each alert belongs to one user

7. **Destination ↔ Cities**: Logical relationship
   - Plans reference city names
   - Cities provide cost and information data

---

## Indexing Strategy

### Primary Indexes
- All collections have default `_id` index

### Secondary Indexes
1. **users**: `email` (unique)
2. **plans**: `userId`, `destination` (text), `createdAt`, `rating`
3. **trips**: `destination` (text), `total_cost_numeric`
4. **shares**: `shareId` (unique), `tripId`, `expiresAt`
5. **comments**: `shareId`, `createdAt`
6. **alerts**: `userId`, `destination`, `active`, `lastChecked`
7. **searchHistory**: `userId`, `searchedAt`, `searchType`, `(userId, searchedAt)` compound
8. **cities**: `name` (text), `avgPerDay`, `region`
9. **cache**: `(cacheType, cacheKey)` compound, `expiresAt`
10. **savedTrips**: `userId`, `tripId`, `(userId, tripId)` compound

---

## Notes

- **MongoDB version**: Compatible with MongoDB 4.4+
- **Connection pooling**: Implemented via cached connections in serverless functions
- **Data validation**: Handled at application layer (no strict schemas)
- **Scalability**: Designed for horizontal scaling with proper indexing
- **Cache expiration**: Implemented for cache and shares collections
- **Security**: Passwords hashed with bcrypt, JWT tokens for authentication

---

## Maintenance Queries

### Cleanup old expired shares
```javascript
db.shares.deleteMany({ expiresAt: { $lt: new Date() } })
```

### Cleanup old cache entries
```javascript
db.cache.deleteMany({ expiresAt: { $lt: new Date() } })
```

### Limit search history per user
```javascript
// Implemented in searchHistory function - keeps last 100 per user
```

### Update exchange rates
```javascript
// Run seedExchangeRates function periodically
```

---

*Last Updated: January 17, 2026*
