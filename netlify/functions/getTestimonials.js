const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    
    // Fetch all testimonials sorted by newest first
    const testimonials = await db.collection('testimonials')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, testimonials })
    };
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch testimonials', details: error.message }) };
  }
};
