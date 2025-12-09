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
    const collection = db.collection('plans');

    const {
      query,           // Search text
      budget,          // Budget filter
      style,           // Travel style filter
      minDays,         // Minimum travel days
      maxDays,         // Maximum travel days
      minBudget,       // Minimum budget amount
      maxBudget,       // Maximum budget amount
      limit = 20,
      page = 1
    } = event.queryStringParameters || {};

    // Guardrails for pagination
    const safeLimit = Math.min(parseInt(limit) || 20, 50);
    const safePage = Math.max(parseInt(page) || 1, 1);

    // Build search query with MongoDB regex search and filters
    const searchQuery = {};

    // Text search on destination, itinerary descriptions, preferences
    if (query) {
      searchQuery.$or = [
        { destination: { $regex: query, $options: 'i' } },
        { 'itinerary.description': { $regex: query, $options: 'i' } },
        { preferences: { $regex: query, $options: 'i' } }
      ];
    }

    // Budget category filter
    if (budget) {
      searchQuery.budget = budget;
    }

    // Travel style filter
    if (style) {
      searchQuery.travelStyle = style;
    }

    // Duration filter (travel days range)
    if (minDays || maxDays) {
      searchQuery.travelDays = {};
      if (minDays) searchQuery.travelDays.$gte = parseInt(minDays);
      if (maxDays) searchQuery.travelDays.$lte = parseInt(maxDays);
    }

    // Budget amount filter (from costs.total)
    if (minBudget || maxBudget) {
      searchQuery['costs.total'] = {};
      if (minBudget) searchQuery['costs.total'].$gte = parseFloat(minBudget);
      if (maxBudget) searchQuery['costs.total'].$lte = parseFloat(maxBudget);
    }

    // Calculate pagination
    const skip = (safePage - 1) * safeLimit;

    // Execute search with pagination
    const trips = await collection
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    // Get total count for pagination
    const totalCount = await collection.countDocuments(searchQuery);

    console.log(`Search executed: query="${query}", filters=${JSON.stringify(searchQuery)}, results=${trips.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        trips,
        pagination: {
          total: totalCount,
          page: safePage,
          limit: safeLimit,
          pages: Math.ceil(totalCount / safeLimit)
        }
      })
    };

  } catch (error) {
    console.error('Error searching trips:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to search trips',
        details: error.message 
      })
    };
  }
};
