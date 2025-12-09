// netlify/functions/getStats.js
const clientPromise = require('./utils/db');

exports.handler = async function (event) {
    try {
        const db = (await clientPromise).db('wanderly_db');
        const collection = db.collection('trips');

        // AGGREGATION PIPELINE
        const pipeline = [
            {
                $group: {
                    _id: "$travelStyle", // Group by Travel Style (e.g., Romantic, Adventure)
                    count: { $sum: 1 },  // Count how many trips
                    avgCost: { $avg: "$total_cost_numeric" }, // Calculate average cost
                    minCost: { $min: "$total_cost_numeric" },
                    maxCost: { $max: "$total_cost_numeric" }
                }
            },
            { $sort: { count: -1 } } // Sort by most popular
        ];

        const stats = await collection.aggregate(pipeline).toArray();

        return {
            statusCode: 200,
            body: JSON.stringify(stats),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};