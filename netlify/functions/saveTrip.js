// netlify/functions/saveTrip.js
const clientPromise = require('./utils/db');

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const db = (await clientPromise).db('wanderly_db');
        const collection = db.collection('trips');
        const tripData = JSON.parse(event.body);

        // Add server-side timestamp
        tripData.createdAt = new Date();
        
        // CLEANUP: Ensure numeric values are numbers, not strings (important for analytics)
        tripData.duration = parseInt(tripData.travelDays) || 3;
        // Parse the total cost from string "$2,500" to number 2500
        const costString = tripData.costs?.total || "0";
        tripData.total_cost_numeric = parseFloat(costString.replace(/[^0-9.]/g, ''));

        // INSERT
        const result = await collection.insertOne(tripData);

        // ADVANCED: Ensure indexes exist (Run this once, or in a separate setup script)
        // Index on destination for search, and total_cost for budget filtering
        await collection.createIndex({ destination: "text" }); 
        await collection.createIndex({ total_cost_numeric: 1 });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Trip saved", id: result.insertedId }),
        };
    } catch (error) {
        console.error('DB Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};