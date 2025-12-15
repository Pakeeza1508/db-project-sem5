const { getDb } = require('./_mongo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderly-secret-key-change-in-production';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { name, email, password } = JSON.parse(event.body || '{}');

    // Validation
    if (!name || !email || !password) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Name, email, and password are required' }) 
      };
    }

    if (password.length < 6) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Password must be at least 6 characters' }) 
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Invalid email format' }) 
      };
    }

    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Email already registered' }) 
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      trips: []
    };

    const result = await db.collection('users').insertOne(user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId.toString(), email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: result.insertedId.toString(),
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
    console.error('Signup error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to create account', details: error.message }) 
    };
  }
};
