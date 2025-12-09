const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { ids } = event.queryStringParameters || {};
    if (!ids) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ids query param is required (comma-separated ObjectIds)' })
      };
    }

    // Parse and validate ObjectIds
    const rawIds = ids.split(',').map(s => s.trim()).filter(Boolean);
    if (rawIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid ids provided' })
      };
    }

    // Limit to avoid abuse
    const MAX_IDS = 10;
    if (rawIds.length > MAX_IDS) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Too many ids provided (max ${MAX_IDS})` })
      };
    }

    let objectIds = [];
    try {
      objectIds = rawIds.map(id => new ObjectId(id));
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'One or more ids are invalid ObjectIds' })
      };
    }

    const db = await getDb();
    const trips = await db.collection('plans')
      .find({ _id: { $in: objectIds } })
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, count: trips.length, trips }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (err) {
    console.error('Error fetching trips by ids:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch trips', details: err.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};
