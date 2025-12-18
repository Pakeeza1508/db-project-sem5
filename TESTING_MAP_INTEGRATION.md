# Map Integration Testing Guide

## 🧪 How to Test the Map Integration

### 1. Start the Development Server

```bash
netlify dev
```

The app will run at `http://localhost:8888`

### 2. Test Budget Search Page

1. Navigate to **Budget Search** page: `http://localhost:8888/budget-search.html`
2. Scroll down to the "Starting City" field
3. Click the **"Show Map"** button
4. The map should:
   - ✅ Load with Leaflet tiles (OpenStreetMap)
   - ✅ Show a search input at the top
   - ✅ Be centered on South Asia (Pakistan/India region)

5. **Test Search**:
   - Type "Lahore" in the search box
   - Autocomplete suggestions should appear
   - Click on a suggestion
   - Map should zoom to that location
   - "Starting City" field should update with the location name

6. **Test Map Click**:
   - Click anywhere on the map
   - A red circle marker should appear
   - Location name should appear in "Starting City" field
   - Check browser console - you should see coordinates logged

7. Click **"Hide Map"** button
   - Map section should collapse

### 3. Test Planner Page

1. Navigate to **Planner** page: `http://localhost:8888/planner.html`
2. Look for the "Destination" field
3. Click the **"map selector"** link below the input
4. The map should:
   - ✅ Appear in a dashed border section
   - ✅ Show search input
   - ✅ Be centered on South Asia

5. **Test Search**:
   - Type "Paris" in the search box
   - Click on "Paris, France" in suggestions
   - Map should zoom to Paris
   - "Destination" field should update to "Paris, France"

6. **Test Map Click**:
   - Click on a different location on the map
   - Red circle marker should move
   - Destination field should update

7. Click **"Hide Map"** button
   - Map section should collapse

### 4. Test Database Storage

1. Open MongoDB Compass or your MongoDB client
2. Connect to your database (local or Atlas)
3. Look for the `locations` collection
4. After searching for cities, you should see entries like:

```json
{
  "_id": ObjectId("..."),
  "name": "Lahore",
  "country": "Pakistan",
  "lat": 31.5204,
  "lng": 74.3587,
  "displayName": "Lahore, Punjab, Pakistan",
  "searchCount": 3,
  "lastSearched": ISODate("2024-12-18T...")
}
```

5. Search for the same city multiple times
   - `searchCount` should increment
   - `lastSearched` should update

### 5. Test API Endpoints

**Search Locations**:
```bash
curl "http://localhost:8888/.netlify/functions/searchLocations?query=Karachi"
```

Expected response:
```json
[
  {
    "name": "Karachi",
    "country": "Pakistan",
    "lat": 24.8607,
    "lng": 67.0011,
    "state": "Sindh",
    "displayName": "Karachi, Sindh, Pakistan"
  }
]
```

**Reverse Geocoding**:
```bash
curl "http://localhost:8888/.netlify/functions/searchLocations?lat=31.5204&lng=74.3587"
```

Expected response:
```json
{
  "name": "Lahore",
  "country": "Pakistan",
  "lat": 31.52,
  "lng": 74.36,
  "state": "Punjab",
  "displayName": "Lahore, Punjab, Pakistan"
}
```

**Save Location** (POST):
```bash
curl -X POST http://localhost:8888/.netlify/functions/searchLocations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Islamabad",
    "country": "Pakistan",
    "lat": 33.6844,
    "lng": 73.0479,
    "displayName": "Islamabad, Pakistan"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Location saved",
  "location": {
    "name": "Islamabad",
    "lat": 33.6844,
    "lng": 73.0479,
    "country": "Pakistan",
    "displayName": "Islamabad, Pakistan"
  }
}
```

### 6. Test Error Handling

**Invalid Query**:
```bash
curl "http://localhost:8888/.netlify/functions/searchLocations?query="
```
Should return empty array: `[]`

**Missing Coordinates**:
```bash
curl -X POST http://localhost:8888/.netlify/functions/searchLocations \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```
Should return 400 error with message: `"Missing required fields: name, lat, lng"`

### 7. Browser Console Tests

Open browser DevTools (F12) and check:

**Network Tab**:
- Search for "Lahore"
- You should see request to `searchLocations?query=Lahore`
- Status: 200 OK
- Response: Array of locations

**Console Tab**:
- No JavaScript errors
- When clicking map, you should see:
  ```
  Location selected: Lahore, Punjab, Pakistan 31.5204 74.3587
  ```

**Application/Storage Tab**:
- Check `dataset` attributes on input fields
- Should see `data-lat` and `data-lng` populated

### 8. Mobile Responsive Testing

1. Open DevTools (F12)
2. Click device toolbar (phone icon)
3. Select "iPhone 12 Pro" or similar
4. Test map:
   - Should scale to screen width
   - Touch events should work for clicking
   - Search input should be accessible
   - Zoom controls should be usable

### 9. Integration with Budget Search Flow

1. Fill out Budget Search form:
   - Budget: 50000
   - Days: 3
   - Starting City: Use map to select "Lahore"
   - Travel Type: Solo
2. Click "Find Destinations"
3. Backend should receive coordinates in request
4. Results should be personalized based on exact location

### 10. Integration with Planner Flow

1. Fill out Planner form:
   - Destination: Use map to select "Skardu, Pakistan"
   - Days: 3
   - Style: Adventure
   - Budget: Mid-range
2. Click "Generate My Trip Plan"
3. AI should generate itinerary for exact selected location
4. Check if coordinates are used for weather/geocoding

## ✅ Success Criteria

All tests should pass:
- [x] Map loads without errors
- [x] Search returns relevant results
- [x] Map click selects coordinates
- [x] Form fields update correctly
- [x] Locations saved to MongoDB
- [x] API endpoints return valid JSON
- [x] No console errors
- [x] Mobile responsive
- [x] Integration with search/planner works

## 🐛 Common Issues

**Map doesn't load**:
- Check internet connection (Leaflet CDN)
- Open console for errors
- Verify `OPENWEATHER_KEY` in `.env`

**Search returns no results**:
- Check OpenWeather API key is valid
- Test API endpoint directly with curl
- Verify quota not exceeded (60 calls/min free tier)

**Database not saving**:
- Check MongoDB connection string
- Verify `MONGODB_URI` in `.env`
- Test connection with MongoDB Compass
- Check collection permissions

**Map UI issues**:
- Clear browser cache
- Check CSS loaded correctly
- Verify no conflicting styles
- Test in incognito mode

## 📞 Support

If issues persist:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify all environment variables set
4. Test API endpoints individually
5. Check MongoDB logs

---

**Happy Testing!** 🎉
