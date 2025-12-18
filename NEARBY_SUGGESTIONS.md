# Nearby Suggestions System

## Overview

The **Nearby Suggestions** feature recommends popular destinations near a selected location, combining:
- **Geographic proximity** (Haversine distance calculation)
- **Search popularity** (from user search history)
- **User preferences** (personalized based on past searches)
- **Cost information** (daily budget estimates)

## Features

✅ **Smart Ranking Algorithm**
- 50% weight on proximity (closer = better)
- 40% weight on popularity (more searches = better)
- 10% bonus for recent searches (within 7-30 days)

✅ **Personalization**
- Highlights destinations matching user's search history
- Shows ⭐ badge for preference matches
- Displays user's top 3 searched destinations

✅ **Visual Design**
- Glassmorphism cards with smooth animations
- 🔥 Popularity badges showing search counts
- Distance indicators with km/m formatting
- Responsive modal and inline views

✅ **Integration Points**
- Budget search results → "Explore Nearby" button on each card
- Trip planner results → Automatic nearby suggestions section
- Modal popup for detailed exploration

## Architecture

### Backend: `getNearbyDestinations.js`

**Endpoint:** `GET /.netlify/functions/getNearbyDestinations`

**Query Parameters:**
- `destination` (string) - Destination name (will lookup coordinates)
- `lat` (float) - Latitude (if coordinates known)
- `lng` (float) - Longitude (if coordinates known)
- `radius` (int) - Search radius in km (default: 300)
- `limit` (int) - Max suggestions (default: 5)
- `userId` (string) - User identifier for personalization

**Response:**
```json
{
  "success": true,
  "center": {
    "destination": "Lahore",
    "lat": 31.5497,
    "lng": 74.3436
  },
  "radius": 300,
  "total": 8,
  "suggestions": [
    {
      "destination": "Islamabad",
      "country": "Pakistan",
      "region": "Federal Capital",
      "distance": 280,
      "distanceText": "280 km",
      "averageDailyCost": 5000,
      "searchCount": 15,
      "popularityScore": 87,
      "matchesPreferences": true,
      "coordinates": {
        "lat": 33.6844,
        "lng": 73.0479
      }
    }
  ],
  "userPreferences": ["Islamabad", "Murree", "Hunza"]
}
```

### Frontend: `nearby-suggestions.js`

**Key Functions:**

1. **fetchNearbyDestinations(destination, lat, lng, radius, limit)**
   - Fetches suggestions from backend
   - Caches results to avoid duplicate API calls
   - Returns data object or null on error

2. **displayNearbySuggestions(data, containerId)**
   - Renders suggestions in specified container
   - Shows rankings, distances, popularity badges
   - Includes user preference highlights

3. **showNearbySuggestionsModal(data)**
   - Opens full-screen modal with suggestions
   - Includes backdrop blur and close button
   - Responsive on mobile devices

4. **addNearbySuggestionsButton(cardElement, destination, lat, lng)**
   - Adds "Explore Nearby" button to destination cards
   - Handles loading state and error messages
   - Opens modal on click

5. **viewDestinationDetails(destination)**
   - Redirects to trip planner with selected destination
   - Preserves user context for seamless navigation

## Database Dependencies

### Collections Used

1. **cities** (Primary Data Source)
   - Fields: `destination`, `coordinates.lat`, `coordinates.lng`, `averageDailyCost`, `country`, `region`
   - Must have coordinates for distance calculations
   - Used for cost estimates and basic info

2. **searchHistory** (Popularity Data)
   - Aggregates search counts per destination
   - Tracks `lastSearched` timestamp for recency bonus
   - Filters by searchType: `budget-search`, `planner`, `destination`

## Distance Calculation

Uses **Haversine Formula** for accurate great-circle distances:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in km
}
```

**Accuracy:** Within 0.5% error for typical distances (<500km)

## Popularity Scoring Algorithm

### Formula
```
popularityScore = (searchScore × 0.4) + (distanceScore × 0.5) + recencyBonus

Where:
- searchScore = min(searchCount × 10, 100)
- distanceScore = max(100 - (distance / 3), 0)
- recencyBonus = 20 (≤7 days), 10 (≤30 days), 0 (>30 days)
```

### Examples

**Scenario 1: Close & Popular**
- Distance: 50 km
- Search count: 20
- Last searched: 3 days ago
- **Score:** (min(200, 100) × 0.4) + (max(100 - 16.67, 0) × 0.5) + 20 = **101.7** ⭐

**Scenario 2: Far but Very Popular**
- Distance: 250 km
- Search count: 50
- Last searched: 10 days ago
- **Score:** (100 × 0.4) + (max(100 - 83.33, 0) × 0.5) + 10 = **58.3**

**Scenario 3: Close but Unpopular**
- Distance: 30 km
- Search count: 2
- Last searched: Never
- **Score:** (20 × 0.4) + (max(100 - 10, 0) × 0.5) + 0 = **53.0**

## User Interface

### Inline Display (Planner Page)

```
┌─────────────────────────────────────────────┐
│ 🧭 Nearby Popular Places                   │
│    Near Lahore                              │
├─────────────────────────────────────────────┤
│ 1  Islamabad ⭐ 🔥15                        │
│    📍 280 km • Pakistan                     │
│    Avg cost: ₨5,000/day           [View]   │
├─────────────────────────────────────────────┤
│ 2  Murree 🔥8                               │
│    📍 65 km • Pakistan                      │
│    Avg cost: ₨6,500/day           [View]   │
└─────────────────────────────────────────────┘
⭐ Based on your searches: Islamabad, Murree
```

### Modal View (Budget Search)

Triggered by "Explore Nearby" button on destination cards:

```
╔═══════════════════════════════════════════╗
║ 🧭 Explore Nearby                    [×]  ║
╠═══════════════════════════════════════════╣
║                                           ║
║  [Same content as inline view]           ║
║                                           ║
╚═══════════════════════════════════════════╝
     (Click backdrop to close)
```

### Button on Destination Cards

```html
<button class="nearby-suggestions-trigger">
    <i class="fa-solid fa-compass"></i> Explore Nearby
</button>
```

**States:**
- Default: Pink gradient with compass icon
- Loading: Spinner animation, disabled
- Error: Toast notification (if available)

## Integration Guide

### 1. Budget Search Page

**HTML (budget-search.html):**
```html
<script src="js/nearby-suggestions.js"></script>
```

**JavaScript (budget-search.js):**
```javascript
// In createDestinationCard()
if (window.addNearbySuggestionsButton) {
    setTimeout(() => {
        addNearbySuggestionsButton(
            card, 
            city, 
            destination.coordinates?.lat, 
            destination.coordinates?.lng
        );
    }, 100);
}
```

### 2. Trip Planner Page

**HTML (planner.html):**
```html
<!-- In results section -->
<div class="card glass nearby-card full-width" style="display: none;">
    <div id="nearby-suggestions"></div>
</div>

<script src="js/nearby-suggestions.js"></script>
```

**JavaScript (planner-app.js):**
```javascript
// After displaying trip results
if (window.fetchNearbyDestinations && window.displayNearbySuggestions) {
    setTimeout(async () => {
        const nearbyData = await fetchNearbyDestinations(name, lat, lon);
        if (nearbyData && nearbyData.suggestions.length > 0) {
            displayNearbySuggestions(nearbyData, 'nearby-suggestions');
            document.querySelector('.nearby-card').style.display = 'block';
        }
    }, 1000);
}
```

## Customization

### Adjust Search Radius

```javascript
// Default: 300 km
const nearbyData = await fetchNearbyDestinations('Lahore', null, null, 500, 5);
//                                                                   ^^^
//                                                                   radius
```

### Change Result Limit

```javascript
// Default: 5 suggestions
const nearbyData = await fetchNearbyDestinations('Lahore', null, null, 300, 10);
//                                                                         ^^
//                                                                         limit
```

### Modify Scoring Weights

Edit `calculatePopularityScore()` in `getNearbyDestinations.js`:

```javascript
// Current: 40% search, 50% distance, 10% recency
const finalScore = (searchScore * 0.4) + (distanceScore * 0.5) + recencyBonus;

// Example: Prioritize distance over popularity
const finalScore = (searchScore * 0.3) + (distanceScore * 0.6) + recencyBonus;
```

### Customize Recency Bonus

```javascript
// Current bonuses
if (daysSinceSearch <= 7) {
    recencyBonus = 20;  // Change to adjust boost
} else if (daysSinceSearch <= 30) {
    recencyBonus = 10;
}
```

## Performance Optimization

### Caching Strategy

Frontend caches results by cache key:
```javascript
const cacheKey = `${destination || `${lat},${lng}`}_${radius}_${limit}`;
```

**Cache invalidation:** Page reload or manual clear

**Benefits:**
- Avoids duplicate API calls
- Instant display on re-open
- Reduces database load

### Database Indexes

Recommended indexes for optimal performance:

```javascript
// Cities collection
db.cities.createIndex({ "coordinates.lat": 1, "coordinates.lng": 1 });
db.cities.createIndex({ destination: 1 });

// Search history collection (already exists)
db.searchHistory.createIndex({ userId: 1, searchType: 1 });
db.searchHistory.createIndex({ searchedAt: -1 });
```

### Query Optimization

- Filters cities with missing coordinates before distance calculation
- Uses aggregation pipeline for popularity data
- Limits results early to reduce sorting overhead

## Testing

### Manual Testing

1. **Budget Search Integration:**
   - Go to Budget Search page
   - Submit a search for any destination
   - Click "Explore Nearby" on a result card
   - Verify modal opens with suggestions

2. **Trip Planner Integration:**
   - Generate a trip for any destination
   - Scroll to bottom of results
   - Verify "Nearby Popular Places" card appears
   - Check that distances and rankings are correct

3. **Personalization:**
   - Search for the same destinations multiple times
   - View nearby suggestions
   - Verify ⭐ badge appears on previously searched destinations
   - Check "Based on your searches" footer

4. **Distance Accuracy:**
   - Known distances: Lahore → Islamabad (≈280 km)
   - Verify calculated distance is within 5% error
   - Test with various city pairs

### API Testing

```bash
# Test with destination name
curl "http://localhost:8888/.netlify/functions/getNearbyDestinations?destination=Lahore&userId=test123&radius=300&limit=5"

# Test with coordinates
curl "http://localhost:8888/.netlify/functions/getNearbyDestinations?lat=31.5497&lng=74.3436&userId=test123&radius=300&limit=5"

# Test edge cases
curl "http://localhost:8888/.netlify/functions/getNearbyDestinations?destination=NonexistentCity&userId=test123"
```

## Error Handling

### Backend Errors

1. **Destination not found:**
   - Status: 404
   - Message: "Destination coordinates not found"
   - Action: Prompt user to search again

2. **Missing parameters:**
   - Status: 400
   - Message: "Destination name or coordinates required"
   - Action: Check function call arguments

3. **Database error:**
   - Status: 500
   - Message: "Failed to fetch nearby destinations"
   - Action: Check MongoDB connection

### Frontend Errors

1. **API failure:**
   - Shows empty state or toast notification
   - Console logs error details
   - Gracefully degrades (doesn't break page)

2. **Container not found:**
   - Logs warning to console
   - Skips rendering (no UI impact)

3. **Cache corruption:**
   - Clears cache on error
   - Retries API call
   - Falls back to empty state

## Future Enhancements

### Planned Features

1. **Map Visualization**
   - Show nearby destinations on interactive map
   - Draw radius circle around center
   - Click markers to view details

2. **Filters & Sorting**
   - Filter by budget range
   - Sort by distance/popularity/cost
   - Filter by region or travel style

3. **Route Planning**
   - Multi-city trip builder
   - Optimize route order
   - Estimate total travel time

4. **Weather Integration**
   - Show current weather for nearby cities
   - Highlight cities with good weather
   - Seasonal recommendations

5. **User Reviews**
   - Show ratings/reviews for suggestions
   - Community-driven popularity scores
   - Photo galleries from users

### Performance Improvements

- **Lazy loading:** Load suggestions on scroll
- **Pagination:** Support 10+ suggestions with pages
- **Prefetching:** Load suggestions before user clicks
- **Service Worker:** Offline caching for repeat visits

## Troubleshooting

### "No nearby destinations found"

**Possible causes:**
1. Search radius too small (increase to 500+ km)
2. Destination has no coordinates in database
3. No cities within radius with coordinates

**Solutions:**
- Check `cities` collection for coordinate data
- Increase radius parameter
- Seed more cities with lat/lng

### Suggestions don't match preferences

**Possible causes:**
1. User has no search history
2. Preferred destinations are outside radius
3. Scoring weights favor distance over popularity

**Solutions:**
- Perform more searches to build history
- Increase radius
- Adjust scoring weights in backend

### Distance calculations seem wrong

**Possible causes:**
1. Incorrect coordinate data in database
2. Lat/lng swapped (common mistake)
3. Coordinates in degrees vs radians

**Solutions:**
- Verify coordinates: Latitude (-90 to 90), Longitude (-180 to 180)
- Check database entries for accuracy
- Use online distance calculator to verify

## Files Created/Modified

### Created:
- `netlify/functions/getNearbyDestinations.js` - Backend API (~260 lines)
- `js/nearby-suggestions.js` - Frontend module (~520 lines)
- `NEARBY_SUGGESTIONS.md` - This documentation

### Modified:
- `budget-search.html` - Added script reference
- `planner.html` - Added script and nearby card container
- `js/budget-search.js` - Added "Explore Nearby" button to cards
- `js/planner-app.js` - Auto-load nearby suggestions after trip generation

## Support & Maintenance

**Common Tasks:**

1. **Add new cities:** Ensure `coordinates` field is populated
2. **Adjust radius:** Change default in backend (300 km)
3. **Modify ranking:** Edit scoring algorithm weights
4. **Update styles:** Edit CSS in `addNearbySuggestionsStyles()`

**Monitoring:**

- Track API response times (should be <500ms)
- Monitor cache hit rates (>80% ideal)
- Check error logs for 404s (missing coordinates)

---

**Last Updated:** December 18, 2024  
**Version:** 1.0.0  
**Author:** Wanderly Trip Planner Team
