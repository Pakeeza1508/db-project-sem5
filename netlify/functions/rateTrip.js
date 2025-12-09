const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    const body = JSON.parse(event.body || '{}');
    const { id, rating } = body;

    const numeric = Number(rating);
    if (!id || Number.isNaN(numeric) || numeric < 1 || numeric > 5) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Trip ID and rating (1-5) are required' }) };
    }

    // Update aggregated rating fields
    const result = await db.collection('plans').findOneAndUpdate(
      { _id: new ObjectId(id) },
      [
        {
          $set: {
            ratingCount: { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
            rating: {
              $divide: [
                { $add: [
                  { $multiply: [{ $ifNull: ['$rating', 0] }, { $ifNull: ['$ratingCount', 0] }] },
                  numeric
                ] },
                { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] }
              ]
            },
            updatedAt: new Date()
          }
        }
      ],
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Trip not found' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, trip: result.value })
    };
  } catch (error) {
    console.error('Error rating trip:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to rate trip', details: error.message })
    };
  }
};
