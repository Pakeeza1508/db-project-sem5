// netlify/functions/utils/db.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env or Netlify environment variables");
}

// Global variable check to prevent exhausting connections during hot-reload in dev
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

module.exports = clientPromise;