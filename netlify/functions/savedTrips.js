const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT'
      },
      body: ''
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    await client.connect();
    const database = client.db('wanderlyDB');
    const savedTripsCollection = database.collection('savedTrips');

    const method = event.httpMethod;

    // GET - Fetch saved trips
    if (method === 'GET') {
      const params = event.queryStringParameters || {};
      const userId = params.userId;
      const tripId = params.tripId;
      const shareToken = params.shareToken;

      // Get single trip by shareToken (for public sharing)
      if (shareToken) {
        const trip = await savedTripsCollection.findOne({ 
          shareToken,
          isShared: true 
        });

        if (!trip) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              success: false, 
              message: 'Shared trip not found' 
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            trip 
          })
        };
      }

      // Get single trip by ID
      if (tripId) {
        if (!userId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              success: false, 
              message: 'User ID required' 
            })
          };
        }

        const trip = await savedTripsCollection.findOne({ 
          _id: new ObjectId(tripId),
          userId 
        });

        if (!trip) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              success: false, 
              message: 'Trip not found' 
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            trip 
          })
        };
      }

      // Get all trips for user
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'User ID required' 
          })
        };
      }

      const trips = await savedTripsCollection
        .find({ userId })
        .sort({ savedAt: -1 })
        .toArray();

      const stats = {
        total: trips.length,
        shared: trips.filter(t => t.isShared).length
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          trips,
          stats 
        })
      };
    }

    // POST - Save new trip
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const { 
        userId, 
        userName, 
        userEmail,
        destination, 
        days, 
        travelStyle, 
        budget,
        preferences,
        tripPlan,
        weatherInfo,
        costBreakdown,
        nearbyPlaces
      } = body;

      // Validation
      if (!userId || !destination || !days || !tripPlan) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Missing required fields: userId, destination, days, tripPlan' 
          })
        };
      }

      // Generate share token
      const shareToken = generateShareToken();

      const newTrip = {
        userId,
        userName: userName || 'Anonymous',
        userEmail: userEmail || '',
        destination,
        days: parseInt(days),
        travelStyle: travelStyle || 'Adventure',
        budget: budget || 'Moderate',
        preferences: preferences || '',
        tripPlan,
        weatherInfo: weatherInfo || null,
        costBreakdown: costBreakdown || null,
        nearbyPlaces: nearbyPlaces || [],
        isShared: false,
        shareToken,
        savedAt: new Date(),
        updatedAt: new Date()
      };

      const result = await savedTripsCollection.insertOne(newTrip);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Trip saved successfully',
          tripId: result.insertedId,
          trip: newTrip
        })
      };
    }

    // PUT - Update trip (toggle sharing, rename, etc.)
    if (method === 'PUT') {
      const body = JSON.parse(event.body);
      const { tripId, userId, updates } = body;

      if (!tripId || !userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Trip ID and User ID required' 
          })
        };
      }

      // Verify ownership
      const trip = await savedTripsCollection.findOne({ 
        _id: new ObjectId(tripId),
        userId 
      });

      if (!trip) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Trip not found or unauthorized' 
          })
        };
      }

      // Update trip
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await savedTripsCollection.updateOne(
        { _id: new ObjectId(tripId) },
        { $set: updateData }
      );

      const updatedTrip = await savedTripsCollection.findOne({ 
        _id: new ObjectId(tripId) 
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Trip updated successfully',
          trip: updatedTrip
        })
      };
    }

    // DELETE - Remove saved trip
    if (method === 'DELETE') {
      const params = event.queryStringParameters || {};
      const tripId = params.tripId;
      const userId = params.userId;

      if (!tripId || !userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Trip ID and User ID required' 
          })
        };
      }

      // Verify ownership before deletion
      const trip = await savedTripsCollection.findOne({ 
        _id: new ObjectId(tripId),
        userId 
      });

      if (!trip) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Trip not found or unauthorized' 
          })
        };
      }

      await savedTripsCollection.deleteOne({ 
        _id: new ObjectId(tripId) 
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Trip deleted successfully' 
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Method not allowed' 
      })
    };

  } catch (error) {
    console.error('Error in savedTrips function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      })
    };
  } finally {
    await client.close();
  }
};

// Generate unique share token
function generateShareToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
