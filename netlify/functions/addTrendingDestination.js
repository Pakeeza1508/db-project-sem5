const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, country, imageUrl, tripadvisorUrl } = body;

    if (!name || !country || !imageUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: 'name, country, and imageUrl are required' }) };
    }

    const db = await getDb();
    
    const doc = {
      name,
      country,
      imageUrl,
      tripadvisorUrl: tripadvisorUrl || `https://www.tripadvisor.com/`,
      createdAt: new Date()
    };

    const result = await db.collection('trendingDestinations').insertOne(doc);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: result.insertedId })
    };
  } catch (error) {
    console.error('Error adding trending destination:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to add trending destination', details: error.message }) };
  }
};
