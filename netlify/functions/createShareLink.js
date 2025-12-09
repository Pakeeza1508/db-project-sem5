const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { tripId, expiresInDays = 30, password = null } = body;
    if (!tripId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'tripId is required' }) };
    }

    const db = await getDb();
    const shareId = crypto.randomBytes(8).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const doc = {
      shareId,
      tripId: new ObjectId(tripId),
      createdAt: now,
      expiresAt,
      password: password || null,
      views: 0
    };

    await db.collection('shares').insertOne(doc);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        shareId,
        expiresAt,
        expiresInDays,
        url: `/share.html?id=${shareId}`
      })
    };
  } catch (error) {
    console.error('Error creating share link:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create share link', details: error.message }) };
  }
};
