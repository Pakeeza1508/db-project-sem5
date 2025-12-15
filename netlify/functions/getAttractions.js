const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { destination, type = 'tourist_attraction' } = event.queryStringParameters || {};

    if (!destination) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'destination query parameter is required' })
        };
    }

    const googleKey = process.env.GOOGLE_API_KEY;

    if (!googleKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'GOOGLE_API_KEY environment variable is required' })
        };
    }

    try {
        // First, get the coordinates of the destination
        const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${googleKey}`
        );

        if (!geocodeResponse.ok) {
            throw new Error('Geocoding failed');
        }

        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.results || geocodeData.results.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Destination not found' })
            };
        }

        const location = geocodeData.results[0].geometry.location;
        const lat = location.lat;
        const lng = location.lng;

        // Now search for attractions near this location
        const placesResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${googleKey}`
        );

        if (!placesResponse.ok) {
            throw new Error('Places search failed');
        }

        const placesData = await placesResponse.json();

        const attractions = (placesData.results || []).slice(0, 10).map(place => ({
            name: place.name,
            address: place.vicinity,
            rating: place.rating || 'N/A',
            reviews: place.user_ratings_total || 0,
            type: place.types[0] || 'attraction',
            placeId: place.place_id,
            photo: place.photos && place.photos[0] 
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleKey}`
                : null,
            openNow: place.opening_hours ? place.opening_hours.open_now : null
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                destination,
                coordinates: { lat, lng },
                attractions,
                total: attractions.length
            })
        };

    } catch (error) {
        console.error('Error fetching attractions:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch attractions',
                details: error.message
            })
        };
    }
};
