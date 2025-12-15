const { getDb } = require('./_mongo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderly-secret-key-change-in-production';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Email and password are required' }) 
      };
    }

    const db = await getDb();

    // Find user
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Invalid email or password' }) 
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Invalid email or password' }) 
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    console.error('Login error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Login failed', details: error.message }) 
    };
  }
};
