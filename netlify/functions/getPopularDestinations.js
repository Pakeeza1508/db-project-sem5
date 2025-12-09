const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const db = await getDb();
    const { limit = 10 } = event.queryStringParameters || {};

    // MongoDB aggregation to find most popular destinations
    // Groups by destination, counts trips, calculates avg rating (if we add it later)
    const popularDestinations = await db.collection('plans').aggregate([
      // Normalize numeric fields
      {
        $addFields: {
          costTotal: {
            $convert: {
              input: { $ifNull: ['$costs.total', 0] },
              to: 'double',
              onError: 0,
              onNull: 0
            }
          },
          travelDaysInt: {
            $convert: {
              input: { $ifNull: ['$travelDays', 0] },
              to: 'int',
              onError: 0,
              onNull: 0
            }
          }
        }
      },
      // Group by destination
      {
        $group: {
          _id: '$destination',
          tripCount: { $sum: 1 },
          avgBudget: { $avg: '$costTotal' },
          travelStyles: { $push: '$travelStyle' },
          budgetCategories: { $push: '$budget' },
          totalDays: { $sum: '$travelDaysInt' },
          lastVisited: { $max: '$createdAt' }
        }
      },
      // Sort by trip count (most popular first)
      { $sort: { tripCount: -1 } },
      // Limit results
      { $limit: parseInt(limit) },
      // Project final shape - simplified without $function
      {
        $project: {
          _id: 0,
          destination: '$_id',
          tripCount: 1,
          avgBudget: { $round: ['$avgBudget', 2] },
          mostCommonStyle: { $arrayElemAt: ['$travelStyles', 0] },
          mostCommonBudget: { $arrayElemAt: ['$budgetCategories', 0] },
          totalDays: 1,
          lastVisited: 1
        }
      }
    ]).toArray();

    console.log(`Popular destinations retrieved: ${popularDestinations.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        destinations: popularDestinations
      })
    };

  } catch (error) {
    console.error('Error getting popular destinations:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to get popular destinations',
        details: error.message 
      })
    };
  }
};
