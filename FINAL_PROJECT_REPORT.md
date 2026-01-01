# Wanderly Trip Planner – Final Project Report

## 1) Project Overview
- **Purpose:** AI-assisted budget-friendly travel planner with trip creation, comparisons, maps, saved trips, testimonials, and alerts.
- **Stack:** HTML/CSS/JS frontend, Netlify Functions (Node.js) backend, MongoDB Atlas.
- **Status:** Deployed on Netlify; data stored in MongoDB Atlas; JWT auth in place.

## 2) Key Features
- Trip planner (budget-first, destination optional) with Leaflet map view.
- Browse, compare, and budget search flows with currency conversion.
- Saved trips, sharing links, PDF export.
- Personalized alerts/notifications (price drops, weather, reminders).
- Search history, activity timeline, trip analytics on profile.
- Testimonials with likes and admin approval flow.
- Trending/nearby/seasonal recommendations and destination imagery.

## 3) Frontend Architecture
- **Pages:** index, planner, browse, budget-search, compare, manage-trip, my-trips, profile, testimonials embedded on landing/profile.
- **Assets:** css/ (global + planner + testimonials + saved-trips), js/ (feature-specific modules), images via Unsplash/remote.
- **State:** localStorage for auth token and user object `{ id, name, email }`.

### Architecture Diagram (Mermaid)
```mermaid
flowchart LR
	Browser[Browser (HTML/CSS/JS)] -->|HTTPS| Netlify[Netlify CDN + Functions]
	Netlify -->|CRUD, Auth, Planner| MongoDB[(MongoDB Atlas)]
	Netlify -->|Maps/Geo| GoogleAPI[Google Maps/Geocoding]
	Netlify -->|Weather| OpenWeather[OpenWeather]
	Netlify -->|Images| Unsplash[Unsplash]
	Netlify -->|AI| Gemini[Google Gemini]

	Browser -->|JWT in localStorage| Netlify
	subgraph Frontend Assets
		CSS[css/*.css]
		JS[js/*.js]
		HTML[*.html]
	end
	Browser --> CSS
	Browser --> JS
	Browser --> HTML
```

## 4) Backend (Netlify Functions)
- **Location:** netlify/functions/*.js
- **Core endpoints:** auth (signup/login/verifyToken), trips (saveTrip, getTrips, getTripById, updateTrip, deleteTrip, getTripsByIds), planner (savePlan, searchTrips, searchLocations, getDestinationsByBudget, getTrendingDestinations, getNearbyDestinations, getDestinationImages), analytics (getStats, getTripStats, getNotifications), testimonials (testimonials, likeTestimonial, addTestimonial via same handler), caching helpers (getCached*), alerts (subscribeToAlerts, checkPriceDrops, trackPriceHistory), seeds (seed* scripts for dummy data and costs/exchange rates).
- **DB helper:** netlify/functions/utils/db.js initializes Mongo client and returns collections by name.

## 5) Authentication
- JWT stored in localStorage as `{ token, user }` (7-day default).
- Protected actions (save trip, testimonial submit/like, alerts) require token/userId.

## 6) Database Schema (MongoDB)
Collection names and indicative fields:

### users
- _id (ObjectId)
- name (string)
- email (string, unique)
- passwordHash (string)
- createdAt (date)
- preferences (object, optional)
- alertsEnabled (boolean)

### trips
- _id (ObjectId)
- userId (ObjectId)
- title (string)
- destination (string)
- startDate (date)
- endDate (date)
- budget (number)
- travelers (number)
- hotels (array of { name, pricePerNight, nights })
- activities (array of { name, cost, day })
- notes (string)
- isFavorite (boolean)
- createdAt/updatedAt (date)

### plans (for generated plans)
- _id (ObjectId)
- userId (ObjectId)
- destination (string)
- budget (number)
- days (array of { dayNumber, summary, activities: [ { time, title, cost, location } ] })
- mapMarkers (array of { lat, lng, label })
- createdAt (date)

### searchHistory
- _id (ObjectId)
- userId (ObjectId)
- destination (string)
- budget (number)
- tripType (string)
- createdAt (date)

### testimonials
- _id (ObjectId)
- userId (ObjectId)
- userName (string)
- userEmail (string)
- destination (string)
- tripDate (string or null)
- rating (number)
- title (string or null)
- content (string)
- likes (number, default 0)
- likedBy (array of userId strings)
- approved (boolean, default false)
- createdAt/updatedAt (date)

### alerts
- _id (ObjectId)
- userId (ObjectId)
- type (string: price, weather, reminder)
- destination (string)
- threshold (number or object)
- isActive (boolean)
- createdAt (date)

### trending_destinations
- _id (ObjectId)
- name (string)
- country (string)
- imageUrl (string)
- averageCost (number)
- tags (array)
- popularityScore (number)

### seasonal_events
- _id (ObjectId)
- name (string)
- location (string)
- season (string)
- startDate/endDate (date)
- description (string)
- imageUrl (string)

### exchange_rates
- _id (ObjectId)
- base (string)
- rates (object: { currencyCode: number })
- updatedAt (date)

### city_costs (optional seed)
- _id (ObjectId)
- city (string)
- country (string)
- averageDailyCost (number)
- currency (string)
- updatedAt (date)

## 7) Deployment
- **Platform:** Netlify (build from GitHub).
- **Env Vars:** `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `OPENWEATHER_KEY`, `GOOGLE_API_KEY`, `GEMINI_KEY`, `UNSPLASH_KEY`.
- **Build:** Static HTML/JS + Netlify Functions (no bundler required).

## 8) Testing Checklist
- Auth: signup/login/logout, token refresh path.
- Planner: create plan, save, map markers render.
- Trips: CRUD, favorite toggle, PDF export (if enabled).
- Browse/compare/budget search: queries return results and handle empty states.
- Testimonials: submit (requires login), approval path, like/unlike updates counts.
- Alerts: subscribe and price/weather checks run without errors.
- Profile: search history, activity timeline, analytics cards populate.

## 9) How to Run Locally
1) Install deps: `npm install`
2) Add `.env` in root with keys above.
3) Start Netlify dev: `npx netlify dev`
4) Open the served URL (often http://localhost:8888) to test both frontend and functions.

## 10) Maintenance Notes
- Approval: testimonials default to `approved: false`; ensure an admin path or temporary auto-approve for demos.
- Image fields: trending uses `imageUrl`; ensure frontend checks both `imageUrl || image`.
- Like logic: uses `likedBy` array; prevent double-like by checking presence before push.
- Seeds: seed scripts under `netlify/functions/seed*.js` can repopulate demo data.
