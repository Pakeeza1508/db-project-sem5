const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { shareId, name = 'Anonymous', message } = body;
    if (!shareId || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'shareId and message are required' }) };
    }

    const db = await getDb();
    const share = await db.collection('shares').findOne({ shareId });
    if (!share) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Share not found' }) };
    }

    const doc = {
      shareId,
      tripId: share.tripId,
      name,
      message,
      createdAt: new Date()
    };

    await db.collection('comments').insertOne(doc);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to add comment', details: error.message }) };
  }
};
