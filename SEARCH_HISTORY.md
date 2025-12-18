# Search History System

## Overview

The Search History system tracks all user searches across the Wanderly Trip Planner application, providing:
- **Persistent search history** stored in MongoDB
- **Quick access** to previous searches via dropdown panel
- **Search statistics** showing patterns and preferences
- **One-click re-run** of previous searches
- **Most searched destinations** for personalized recommendations

## Architecture

### Backend: `searchHistory.js`
Netlify Function handling all search history operations:
- **POST** - Save new search
- **GET** - Retrieve user's search history
- **DELETE** - Clear specific search or all history
- Auto-cleanup (keeps last 100 searches per user)
- Statistics generation (totals, counts, top destinations)

### Frontend: `search-history.js`
Client-side module providing:
- History icon in header (clock-rotate-left icon)
- Dropdown panel with tabs (All/Budget/Planner/Locations)
- Search item cards with details
- Statistics dashboard
- Re-run and delete actions

### Database Schema

```javascript
{
  userId: String,           // User identifier
  searchType: String,       // 'budget-search' | 'planner' | 'location' | 'destination'
  query: String,            // Main search query
  filters: Object,          // Search parameters
  results: Array,           // Search results (optional)
  resultCount: Number,      // Number of results returned
  searchedAt: Date,         // Timestamp
  source: String            // 'web' | 'mobile' (future)
}
```

### Search Types

1. **Budget Search** (`budget-search`)
   - Filters: budget, days, startingCity, travelType
   - Query: "${startingCity} - ${budget} PKR"
   - Results: Destination names

2. **Trip Planner** (`planner`)
   - Filters: destination, days, style, budget, preferences
   - Query: Destination name
   - Results: Trip plan (count=1)

3. **Location Search** (`location`)
   - Filters: searchType='map-location'
   - Query: Location search term
   - Results: Location display names

4. **Destination Search** (`destination`)
   - Query: Destination name
   - Filters: Custom parameters

## API Endpoints

### Save Search
```http
POST /.netlify/functions/searchHistory
Content-Type: application/json

{
  "userId": "user123",
  "searchType": "budget-search",
  "query": "Lahore - 50000 PKR",
  "filters": {
    "budget": "50000",
    "days": "5",
    "startingCity": "Lahore",
    "travelType": "budget"
  },
  "results": ["Murree", "Naran", "Hunza"],
  "resultCount": 3
}
```

**Response:**
```json
{
  "success": true,
  "searchId": "64f7a2b3c4d5e6f7a8b9c0d1",
  "message": "Search saved successfully"
}
```

### Get Search History
```http
GET /.netlify/functions/searchHistory?userId=user123&limit=50
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "_id": "64f7a2b3c4d5e6f7a8b9c0d1",
      "userId": "user123",
      "searchType": "budget-search",
      "query": "Lahore - 50000 PKR",
      "filters": {
        "budget": "50000",
        "days": "5",
        "startingCity": "Lahore",
        "travelType": "budget"
      },
      "results": ["Murree", "Naran", "Hunza"],
      "resultCount": 3,
      "searchedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "grouped": {
    "budgetSearches": [...],
    "plannerSearches": [...],
    "locationSearches": [...],
    "destinationSearches": [...]
  },
  "stats": {
    "totalSearches": 42,
    "budgetSearchCount": 15,
    "plannerSearchCount": 20,
    "locationSearchCount": 5,
    "destinationSearchCount": 2,
    "mostSearchedDestinations": [
      { "destination": "Hunza", "count": 8 },
      { "destination": "Murree", "count": 6 },
      { "destination": "Naran", "count": 5 }
    ]
  }
}
```

### Delete Search(es)
```http
# Delete specific search
DELETE /.netlify/functions/searchHistory?userId=user123&searchId=64f7a2b3c4d5e6f7a8b9c0d1

# Delete all history
DELETE /.netlify/functions/searchHistory?userId=user123
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 1
}
```

## Frontend Integration

### Initialization
```javascript
// Automatically initialized on page load (budget-search.html, planner.html)
document.addEventListener('DOMContentLoaded', () => {
    initSearchHistory();
});
```

### Save Search
```javascript
// Budget search example
saveSearchToHistory(
    'budget-search',
    'Lahore - 50000 PKR',
    {
        budget: '50000',
        days: '5',
        startingCity: 'Lahore',
        travelType: 'budget'
    },
    ['Murree', 'Naran', 'Hunza'],
    3
);

// Trip planner example
saveSearchToHistory(
    'planner',
    'Hunza Valley',
    {
        destination: 'Hunza Valley',
        days: '7',
        style: 'adventure',
        budget: 'moderate'
    },
    null,
    1
);

// Location search example
saveSearchToHistory(
    'location',
    'Dolmen Mall Lahore',
    { searchType: 'map-location' },
    ['Dolmen Mall Clifton, Karachi', 'Dolmen Mall Tariq Road'],
    2
);
```

### Re-run Searches

**Budget Search:**
```javascript
function rerunBudgetSearch(searchId) {
    const search = searchHistory.find(s => s._id === searchId);
    // Redirects to budget-search.html with prefilled parameters
    const params = new URLSearchParams({
        budget: search.filters.budget,
        days: search.filters.days,
        startingCity: search.filters.startingCity,
        travelType: search.filters.travelType
    });
    window.location.href = `budget-search.html?${params.toString()}`;
}
```

**Trip Planner:**
```javascript
function rerunPlannerSearch(searchId) {
    const search = searchHistory.find(s => s._id === searchId);
    // Store in sessionStorage and redirect
    sessionStorage.setItem('prefilledDestination', search.filters.destination);
    sessionStorage.setItem('prefilledDays', search.filters.days);
    sessionStorage.setItem('prefilledStyle', search.filters.style);
    sessionStorage.setItem('prefilledBudget', search.filters.budget);
    sessionStorage.setItem('fromHistory', 'true');
    window.location.href = 'planner.html';
}
```

## UI Components

### History Icon
- **Location:** Header navigation (near notification bell)
- **Icon:** Clock-rotate-left (Font Awesome)
- **Badge:** Optional count badge (future enhancement)

### History Panel
- **Width:** 450px (90vw max)
- **Max Height:** 600px
- **Position:** Dropdown from icon (top-right)
- **Tabs:** All, Budget, Planner, Locations
- **Sections:**
  - Header with "Clear All" button
  - Tab filters
  - Scrollable search list
  - Statistics footer

### Search Item Card
```
┌─────────────────────────────────────────┐
│ 💰  Budget Search               [Search Again] [🗑️] │
│     From: Lahore • Budget: ₨50,000      │
│     • 5 days • budget                   │
│     2 hours ago                         │
└─────────────────────────────────────────┘
```

### Statistics Section
```
Your Search Patterns
┌─────────┬─────────┬─────────┐
│   42    │   15    │   20    │
│ Total   │ Budget  │  Trips  │
│Searches │Searches │ Planned │
└─────────┴─────────┴─────────┘

Most Searched Destinations
• Hunza         8 times
• Murree        6 times
• Naran         5 times
```

## Auto-Cleanup

To prevent database bloat, the system automatically:
- Keeps only the **last 100 searches** per user
- Deletes oldest searches when limit exceeded
- Runs on each POST (save) operation

```javascript
// Auto-cleanup logic
if (userSearchCount > 100) {
    const excessCount = userSearchCount - 100;
    const oldestSearches = await collection
        .find({ userId })
        .sort({ searchedAt: 1 })
        .limit(excessCount)
        .toArray();
    
    const idsToDelete = oldestSearches.map(s => s._id);
    await collection.deleteMany({ _id: { $in: idsToDelete } });
}
```

## Statistics & Analytics

### Tracked Metrics
1. **Total Searches** - All-time count
2. **Search by Type** - Budget, Planner, Location, Destination
3. **Most Searched Destinations** - Top 5 with counts
4. **Recent Activity** - Chronological list

### Future Enhancements
- Search frequency trends (daily/weekly)
- Popular times for searching
- Budget range analysis
- Destination clustering
- Seasonal search patterns

## Testing

### Manual Testing

1. **Save Budget Search:**
   - Go to Budget Search page
   - Submit a search
   - Click history icon → Verify search appears

2. **Save Trip Plan:**
   - Go to Trip Planner
   - Generate a trip
   - Click history icon → Verify in "Planner" tab

3. **Re-run Search:**
   - Click "Search Again" on any history item
   - Verify form is prefilled correctly

4. **Delete Search:**
   - Click trash icon on a search item
   - Verify item removed from list

5. **Clear All:**
   - Click "Clear All" button
   - Confirm dialog → Verify all history cleared

6. **Statistics:**
   - Perform multiple searches
   - Verify counts update correctly
   - Check "Most Searched Destinations" list

### API Testing

```bash
# Save search
curl -X POST http://localhost:8888/.netlify/functions/searchHistory \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "searchType": "budget-search",
    "query": "Lahore - 50000 PKR",
    "filters": {"budget": "50000", "days": "5"},
    "results": ["Murree", "Naran"],
    "resultCount": 2
  }'

# Get history
curl "http://localhost:8888/.netlify/functions/searchHistory?userId=test123&limit=10"

# Delete specific search
curl -X DELETE "http://localhost:8888/.netlify/functions/searchHistory?userId=test123&searchId=<searchId>"

# Clear all history
curl -X DELETE "http://localhost:8888/.netlify/functions/searchHistory?userId=test123"
```

## Database Indexes

For optimal performance, create these indexes:

```javascript
// MongoDB indexes
db.searchHistory.createIndex({ userId: 1, searchedAt: -1 });
db.searchHistory.createIndex({ userId: 1, searchType: 1 });
db.searchHistory.createIndex({ searchedAt: -1 });
```

## Performance Considerations

1. **Limit Results:** Default 50 searches, max 100
2. **Auto-cleanup:** Prevents unbounded growth
3. **Indexed Queries:** Fast lookups by userId
4. **Grouped Results:** Pre-grouped by type in single query
5. **Aggregation Pipeline:** Efficient statistics calculation

## Privacy & Security

1. **User Isolation:** Each user sees only their own history
2. **Anonymous Mode:** Falls back to 'anonymous' userId
3. **No Sensitive Data:** Passwords/tokens never stored
4. **Opt-out:** Users can clear history anytime
5. **Auto-expire:** Consider TTL index (future: 90 days)

## Integration Points

### Current Pages
- ✅ budget-search.html - Saves budget searches
- ✅ planner.html - Saves trip planner searches
- ✅ map-integration.js - Saves location searches

### Future Integration
- ❌ Community feed - Save post searches
- ❌ User profile - Display history timeline
- ❌ Recommendation engine - Use history for personalization

## Files Modified/Created

### Created:
- `netlify/functions/searchHistory.js` - Backend API
- `js/search-history.js` - Frontend module
- `SEARCH_HISTORY.md` - This documentation

### Modified:
- `budget-search.html` - Added script and initialization
- `planner.html` - Added script
- `js/budget-search.js` - Save searches on form submit
- `js/planner-app.js` - Save searches and handle prefilled data
- `js/map-integration.js` - Save location searches

## Next Steps

After search history implementation, complete remaining features:

1. **Nearby Suggestions** - Use most searched destinations for recommendations
2. **Community Feed** - Track search-to-share conversions
3. **User Profiling** - Build comprehensive profile from search patterns

## Support

For issues or questions:
- Check browser console for errors
- Verify MongoDB connection in Netlify dashboard
- Test API endpoints directly with curl
- Review Network tab in DevTools

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Author:** Wanderly Trip Planner Team
