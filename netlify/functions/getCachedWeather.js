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
      // Check cache: GET /getCachedWeather?lat=48.8566&lon=2.3522
      const { lat, lon } = event.queryStringParameters || {};
      if (!lat || !lon) {
        return { statusCode: 400, body: JSON.stringify({ error: 'lat and lon required' }) };
      }

      // Create key from rounded coords (within ~1km)
      const locKey = `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
      const cached = await collection.findOne({
        type: 'weather',
        locKey,
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

    // POST: Cache new weather result
    // POST /getCachedWeather with body: { lat, lon, data }
    const body = JSON.parse(event.body || '{}');
    const { lat, lon, data } = body;

    if (!lat || !lon || !data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'lat, lon, and data required' }) };
    }

    const locKey = `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
    const ttlHours = 12; // Cache weather for 12 hours
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await collection.updateOne(
      { type: 'weather', locKey },
      {
        $set: {
          type: 'weather',
          locKey,
          lat,
          lon,
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
