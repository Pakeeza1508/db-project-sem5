const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await getDb();
    const body = JSON.parse(event.body || '{}');
    const { id, favorite } = body;

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Trip ID is required' }) };
    }

    const result = await db.collection('plans').findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          favorite: Boolean(favorite),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Trip not found' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, trip: result.value })
    };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update favorite', details: error.message })
    };
  }
};
