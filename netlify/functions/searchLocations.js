const { getDb } = require('./_mongo');

/**
 * Search for locations by name or coordinates
 * GET: Search locations by name (autocomplete)
 * POST: Save a location search to database
 */
exports.handler = async function (event, context) {
    const { query, lat, lng, limit = 10 } = event.queryStringParameters || {};
    const method = event.httpMethod;

    try {
        if (method === 'GET' && query) {
            // Search locations by name using OpenWeather Geocoding API
            return await searchLocationsByName(query, limit);
        } else if (method === 'POST') {
            // Save location search to database
            const body = JSON.parse(event.body);
            return await saveLocationSearch(body);
        } else if (method === 'GET' && lat && lng) {
            // Reverse geocoding: Get location name from coordinates
            return await reverseGeocode(lat, lng);
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid parameters. Use ?query=cityname or POST with location data' }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }
    } catch (error) {
        console.error('Location search error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to search locations', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};

/**
 * Search locations by name using OpenWeather API
 */
async function searchLocationsByName(query, limit) {
    const API_KEY = process.env.OPENWEATHER_KEY;
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!Array.isArray(data)) {
            return {
                statusCode: 200,
                body: JSON.stringify([]),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

        // Format results for map display
        const formatted = data.map(location => ({
            name: location.name,
            country: location.country,
            lat: location.lat,
            lng: location.lon,
            state: location.state || null,
            displayName: `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(formatted),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Geocoding API failed', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
}

/**
 * Save location search to MongoDB for history/analytics
 */
async function saveLocationSearch(locationData) {
    const { name, lat, lng, country, displayName } = locationData;

    if (!name || lat === undefined || lng === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required fields: name, lat, lng' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    try {
        const db = await getDb();
        const locationsCollection = db.collection('locations');

        // Upsert location (avoid duplicates)
        const result = await locationsCollection.updateOne(
            { name: name, country: country },
            {
                $set: {
                    name: name,
                    country: country,
                    lat: lat,
                    lng: lng,
                    displayName: displayName,
                    lastSearched: new Date()
                },
                $inc: { searchCount: 1 }
            },
            { upsert: true }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Location saved',
                location: { name, lat, lng, country, displayName }
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save location', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
}

/**
 * Reverse geocoding: Get location name from coordinates
 */
async function reverseGeocode(lat, lng) {
    const API_KEY = process.env.OPENWEATHER_KEY;
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Location not found' }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

        const location = data[0];
        return {
            statusCode: 200,
            body: JSON.stringify({
                name: location.name,
                country: location.country,
                lat: location.lat,
                lng: location.lon,
                state: location.state || null,
                displayName: `${location.name}${location.state ? ', ' + location.state : ''}, ${location.country}`
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Reverse geocoding failed', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
}
