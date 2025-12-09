const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
  // Only allow DELETE method
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { id } = event.queryStringParameters || {};
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Trip ID is required' })
      };
    }

    const db = await getDb();
    
    // Delete the trip
    const result = await db.collection('plans').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Trip not found' })
      };
    }

    console.log(`Trip deleted: ${id}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Trip deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting trip:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to delete trip',
        details: error.message 
      })
    };
  }
};
