const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'wanderly';
const collectionName = 'plans';

exports.handler = async (event) => {
    // Only allow PATCH method
    if (event.httpMethod !== 'PATCH') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    let client;

    try {
        const { tripId, destination, travelDays, travelStyle, budget, preferences, itinerary, weather } = JSON.parse(event.body);

        // Validate trip ID
        if (!tripId || !ObjectId.isValid(tripId)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid trip ID' })
            };
        }

        // Validate required fields
        if (!destination || !travelDays || !travelStyle || !budget || !itinerary) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        client = await MongoClient.connect(uri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Build update object with only provided fields
        const updateFields = {
            destination,
            travelDays: parseInt(travelDays),
            travelStyle,
            budget: parseFloat(budget),
            itinerary,
            updatedAt: new Date()
        };

        // Add optional fields if provided
        if (preferences) {
            updateFields.preferences = preferences;
        }
        if (weather) {
            updateFields.weather = weather;
        }

        // Update the trip
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(tripId) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );

        if (!result) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Trip not found' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Trip updated successfully',
                trip: result
            })
        };

    } catch (error) {
        console.error('Error updating trip:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to update trip',
                details: error.message
            })
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
};
