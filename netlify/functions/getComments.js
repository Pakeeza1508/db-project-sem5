const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { shareId } = event.queryStringParameters || {};
    if (!shareId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'shareId is required' }) };
    }

    const db = await getDb();
    const comments = await db.collection('comments')
      .find({ shareId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, comments })
    };
  } catch (error) {
    console.error('Error loading comments:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load comments', details: error.message }) };
  }
};
