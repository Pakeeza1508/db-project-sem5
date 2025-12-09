// Get all saved trip plans from MongoDB
const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const db = await getDb();
        const { userId, destination, budget, style, limit, sort } = event.queryStringParameters || {};

        // Build query filter
        let filter = {};
        if (userId) filter.userId = userId;
        if (destination) filter.destination = new RegExp(destination, 'i'); // Case-insensitive search
        if (budget) filter.budget = budget;
        if (style) filter.travelStyle = style;

        // Build sort
        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'destination') sortOption = { destination: 1 };

        // Query with optional limit
        const limitNum = limit ? parseInt(limit) : 50;
        const trips = await db.collection('plans')
            .find(filter)
            .sort(sortOption)
            .limit(limitNum)
            .toArray();

        console.log(`✅ Retrieved ${trips.length} trips from MongoDB`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                count: trips.length,
                trips: trips
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };

    } catch (error) {
        console.error('Error fetching trips:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch trips',
                details: error.message
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    }
};