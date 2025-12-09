// Update trip details: mark activities as done, add notes, manage photos
const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'PATCH') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const db = await getDb();
        const body = JSON.parse(event.body);
        const { tripId, completed, notes, photos } = body;

        // Validate tripId
        if (!tripId || !ObjectId.isValid(tripId)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid or missing tripId' })
            };
        }

        // Build update object - only include provided fields
        const updateData = {};
        if (completed !== undefined) updateData.completed = completed; // Array of {activityId, done, notes}
        if (notes !== undefined) updateData.notes = notes; // Trip-level notes
        if (photos !== undefined) updateData.photos = photos; // Array of photo URLs
        updateData.updatedAt = new Date();

        // Update the trip in MongoDB
        const result = await db.collection('plans').findOneAndUpdate(
            { _id: new ObjectId(tripId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Trip not found' })
            };
        }

        console.log(`✅ Updated trip ${tripId}:`, {
            completed: completed ? completed.length : 0,
            hasNotes: !!notes,
            photos: photos ? photos.length : 0
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Trip updated successfully',
                trip: result.value
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    } catch (error) {
        console.error('❌ Error updating trip:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
