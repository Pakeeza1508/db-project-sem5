const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    
    // Fetch all trending destinations sorted by newest first
    const destinations = await db.collection('trendingDestinations')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, destinations })
    };
  } catch (error) {
    console.error('Error fetching trending destinations:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch trending destinations', details: error.message }) };
  }
};
