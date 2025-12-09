const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    const { limit = 10 } = event.queryStringParameters || {};

    const topTrips = await db.collection('plans').aggregate([
      {
        $addFields: {
          ratingSafe: { $ifNull: ['$rating', 0] },
          ratingCountSafe: { $ifNull: ['$ratingCount', 0] },
          favorite: { $ifNull: ['$favorite', false] },
          costTotal: {
            $convert: {
              input: { $ifNull: ['$costs.total', 0] },
              to: 'double',
              onError: 0,
              onNull: 0
            }
          }
        }
      },
      {
        $sort: {
          favorite: -1,
          ratingSafe: -1,
          ratingCountSafe: -1,
          createdAt: -1
        }
      },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          destination: 1,
          travelDays: 1,
          budget: 1,
          travelStyle: 1,
          favorite: 1,
          rating: '$ratingSafe',
          ratingCount: '$ratingCountSafe',
          costs: 1,
          createdAt: 1
        }
      }
    ]).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, trips: topTrips })
    };

  } catch (error) {
    console.error('Error getting top trips:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get top trips', details: error.message })
    };
  }
};
