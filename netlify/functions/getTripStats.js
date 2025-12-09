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

    // MongoDB aggregation for comprehensive trip statistics
    const stats = await db.collection('plans').aggregate([
      // Normalize numeric fields up front
      {
        $addFields: {
          travelDaysInt: {
            $convert: {
              input: { $ifNull: ['$travelDays', 0] },
              to: 'int',
              onError: 0,
              onNull: 0
            }
          },
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
        $facet: {
          // Overall stats
          overview: [
            {
              $group: {
                _id: null,
                totalTrips: { $sum: 1 },
                totalDestinations: { $addToSet: '$destination' },
                totalDays: { $sum: '$travelDaysInt' },
                avgDays: { $avg: '$travelDaysInt' }
              }
            },
            {
              $project: {
                _id: 0,
                totalTrips: 1,
                uniqueDestinations: { $size: '$totalDestinations' },
                totalDays: 1,
                avgDays: { $round: ['$avgDays', 1] }
              }
            }
          ],
          
          // Budget breakdown
          budgetBreakdown: [
            {
              $group: {
                _id: '$budget',
                count: { $sum: 1 },
                avgCost: { $avg: '$costTotal' }
              }
            },
            {
              $project: {
                _id: 0,
                budget: '$_id',
                count: 1,
                avgCost: { $round: ['$avgCost', 2] }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Travel style breakdown
          styleBreakdown: [
            {
              $group: {
                _id: '$travelStyle',
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                style: '$_id',
                count: 1
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Duration distribution
          durationBreakdown: [
            {
              $bucket: {
                groupBy: '$travelDaysInt',
                boundaries: [1, 4, 8, 15, 30],
                default: '30+',
                output: {
                  count: { $sum: 1 }
                }
              }
            },
            {
              $project: {
                _id: 0,
                range: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$_id', 1] }, then: '1-3 days' },
                      { case: { $eq: ['$_id', 4] }, then: '4-7 days' },
                      { case: { $eq: ['$_id', 8] }, then: '8-14 days' },
                      { case: { $eq: ['$_id', 15] }, then: '15-29 days' }
                    ],
                    default: '30+ days'
                  }
                },
                count: 1
              }
            }
          ],
          // Top destinations by trip count
          topDestinations: [
            {
              $group: {
                _id: '$destination',
                count: { $sum: 1 },
                last: { $max: '$createdAt' }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                destination: '$_id',
                count: 1,
                last: '$last'
              }
            }
          ],
          // Monthly timeline (last 12 months)
          monthlyTimeline: [
            {
              $addFields: {
                yearMonth: {
                  $dateToString: { format: '%Y-%m', date: '$createdAt' }
                }
              }
            },
            {
              $group: {
                _id: '$yearMonth',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 12 },
            {
              $project: {
                _id: 0,
                month: '$_id',
                count: 1
              }
            }
          ],
          
          // Recent trips (last 10)
          recentTrips: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                destination: 1,
                travelDays: '$travelDaysInt',
                budget: 1,
                travelStyle: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]).toArray();

    const result = stats[0];
    
    console.log(`Trip stats calculated: ${result.overview[0]?.totalTrips || 0} total trips`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        stats: {
          overview: result.overview[0] || {},
          budgetBreakdown: result.budgetBreakdown || [],
          styleBreakdown: result.styleBreakdown || [],
          durationBreakdown: result.durationBreakdown || [],
          topDestinations: result.topDestinations || [],
          monthlyTimeline: result.monthlyTimeline || [],
          recentTrips: result.recentTrips || []
        }
      })
    };

  } catch (error) {
    console.error('Error getting trip stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to get trip stats',
        details: error.message 
      })
    };
  }
};
