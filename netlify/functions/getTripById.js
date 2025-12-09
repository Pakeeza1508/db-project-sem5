// Get a single trip by ID
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
        const { id } = event.queryStringParameters || {};

        if (!id || !ObjectId.isValid(id)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid or missing trip ID' })
            };
        }

        const trip = await db.collection('plans').findOne({ _id: new ObjectId(id) });

        if (!trip) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Trip not found' })
            };
        }

        console.log(`✅ Retrieved trip ${id}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                trip: trip
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    } catch (error) {
        console.error('❌ Error fetching trip:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
