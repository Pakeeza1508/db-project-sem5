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
      // Check cache: GET /getCachedAIResponse?query=<prompt hash>
      const { queryHash } = event.queryStringParameters || {};
      if (!queryHash) {
        return { statusCode: 400, body: JSON.stringify({ error: 'queryHash required' }) };
      }

      const cached = await collection.findOne({
        type: 'ai-response',
        queryHash,
        expiresAt: { $gt: new Date() } // Not expired
      });

      if (cached) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            fromCache: true,
            data: cached.data,
            cachedAt: cached.createdAt,
            model: cached.model
          })
        };
      }

      return {
        statusCode: 404,
        body: JSON.stringify({ fromCache: false })
      };
    }

    // POST: Cache new AI response
    // POST /getCachedAIResponse with body: { prompt, data, model }
    const body = JSON.parse(event.body || '{}');
    const { prompt, data, model } = body;

    if (!prompt || !data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'prompt and data required' }) };
    }

    // Hash the prompt to create a unique key (only destination + style + budget matter)
    const queryHash = crypto.createHash('md5').update(prompt).digest('hex');
    const ttlDays = 30; // Cache AI responses for 30 days
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await collection.updateOne(
      { type: 'ai-response', queryHash },
      {
        $set: {
          type: 'ai-response',
          queryHash,
          prompt,
          data,
          model: model || 'gemini-2.0-flash',
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
