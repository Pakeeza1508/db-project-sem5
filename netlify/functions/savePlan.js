// Save trip plan to MongoDB
const { getDb } = require('./_mongo');

exports.handler = async function (event, context) {
    // Set serverless function timeout context
    context.callbackWaitsForEmptyEventLoop = false;

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const db = await getDb();
        const body = JSON.parse(event.body);
        
        // Validate required fields
        if (!body.destination || !body.itinerary) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: destination and itinerary' })
            };
        }

        const now = new Date();
        
        // Prepare document - store the full result directly
        const planDocument = {
            ...body,
            userId: body.userId || null,
            title: body.title || `${body.destination} Trip Plan`,
            favorite: body.favorite || false,
            rating: body.rating || 0,
            ratingCount: body.ratingCount || 0,
            createdAt: now,
            updatedAt: now
        };

        // Insert into plans collection
        const result = await db.collection('plans').insertOne(planDocument);
        
        // Log what was saved (for debugging)
        console.log('✅ Trip saved to MongoDB:', {
            id: result.insertedId,
            destination: planDocument.destination,
            days: planDocument.travelDays,
            timestamp: planDocument.createdAt
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                id: result.insertedId.toString(),
                message: 'Trip plan saved successfully'
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };

    } catch (error) {
        console.error('Error saving trip plan:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to save trip plan',
                details: error.message
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    }
};
