const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, text, avatar, rating } = body;

    if (!name || !text || !rating) {
      return { statusCode: 400, body: JSON.stringify({ error: 'name, text, and rating are required' }) };
    }

    if (rating < 1 || rating > 5) {
      return { statusCode: 400, body: JSON.stringify({ error: 'rating must be between 1 and 5' }) };
    }

    const db = await getDb();
    
    const doc = {
      name,
      text,
      avatar: avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      rating: parseInt(rating),
      createdAt: new Date()
    };

    const result = await db.collection('testimonials').insertOne(doc);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: result.insertedId })
    };
  } catch (error) {
    console.error('Error adding testimonial:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to add testimonial', details: error.message }) };
  }
};
