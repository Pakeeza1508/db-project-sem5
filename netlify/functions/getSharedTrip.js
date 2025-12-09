const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { id, password } = event.queryStringParameters || {};
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'share id is required' }) };
    }

    const db = await getDb();
    const share = await db.collection('shares').findOne({ shareId: id });
    if (!share) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Share link not found' }) };
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return { statusCode: 410, body: JSON.stringify({ error: 'Share link expired' }) };
    }

    if (share.password && share.password !== password) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Invalid password' }) };
    }

    const trip = await db.collection('plans').findOne({ _id: share.tripId });
    if (!trip) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Trip not found' }) };
    }

    // Increment views
    await db.collection('shares').updateOne({ shareId: id }, { $inc: { views: 1 } });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, share, trip })
    };
  } catch (error) {
    console.error('Error loading shared trip:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load shared trip', details: error.message }) };
  }
};
