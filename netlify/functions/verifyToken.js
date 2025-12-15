const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderly-secret-key-change-in-production';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');

    if (!token) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'No token provided' }) 
      };
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    return { 
      statusCode: 401, 
      body: JSON.stringify({ 
        success: false, 
        valid: false, 
        error: 'Invalid or expired token' 
      }) 
    };
  }
};
