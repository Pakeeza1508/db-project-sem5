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

    // Fail fast if Mongo is unreachable to avoid 30s Netlify timeouts
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000
    });

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

async function getCollection(name) {
    const db = await getDb();
    return db.collection(name);
}

module.exports = { getDb, getCollection, connectToDatabase };
