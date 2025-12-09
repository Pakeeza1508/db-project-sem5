const { getDb } = require('./_mongo');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    const collection = db.collection('cache');

    if (event.httpMethod === 'GET') {
      // Check cache: GET /getCachedGeocode?query=Paris
      const { query } = event.queryStringParameters || {};
      if (!query) {
        return { statusCode: 400, body: JSON.stringify({ error: 'query required' }) };
      }

      const queryHash = crypto.createHash('md5').update(query.toLowerCase()).digest('hex');
      const cached = await collection.findOne({
        type: 'geocode',
        queryHash,
        expiresAt: { $gt: new Date() } // Not expired
      });

      if (cached) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            fromCache: true,
            data: cached.data,
            cachedAt: cached.createdAt
          })
        };
      }

      return {
        statusCode: 404,
        body: JSON.stringify({ fromCache: false })
      };
    }

    // POST: Cache new geocode result
    // POST /getCachedGeocode with body: { query, data }
    const body = JSON.parse(event.body || '{}');
    const { query, data } = body;

    if (!query || !data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'query and data required' }) };
    }

    const queryHash = crypto.createHash('md5').update(query.toLowerCase()).digest('hex');
    const ttlDays = 30; // Cache geocode for 30 days
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await collection.updateOne(
      { type: 'geocode', queryHash },
      {
        $set: {
          type: 'geocode',
          queryHash,
          query,
          data,
          createdAt: new Date(),
          expiresAt
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, expiresAt })
    };
  } catch (err) {
    console.error('Cache error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
