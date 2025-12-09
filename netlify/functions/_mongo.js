// MongoDB connection helper with connection reuse for serverless
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'wanderly';

if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri);

    await client.connect();
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

async function getDb() {
    const { db } = await connectToDatabase();
    return db;
}

module.exports = { getDb, connectToDatabase };
