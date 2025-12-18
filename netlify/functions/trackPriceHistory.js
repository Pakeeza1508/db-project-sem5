const { getDb } = require('./_mongo');

/**
 * Track price history for destinations
 * POST: Record new price data point
 * GET: Get price history for a destination
 */
exports.handler = async function (event, context) {
    const method = event.httpMethod;

    try {
        const db = await getDb();
        const priceHistoryCollection = db.collection('priceHistory');

        if (method === 'POST') {
            // Record new price
            const body = JSON.parse(event.body);
            return await recordPrice(priceHistoryCollection, body);
        } else if (method === 'GET') {
            // Get price history
            const { destination, days, limit = 30 } = event.queryStringParameters || {};
            return await getPriceHistory(priceHistoryCollection, destination, days, parseInt(limit));
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

    } catch (error) {
        console.error('Price history error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to manage price history', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};

/**
 * Record a new price data point
 */
async function recordPrice(collection, data) {
    const {
        destination,
        days,
        travelType,
        totalCost,
        breakdown // { accommodation, transport, food, activities }
    } = data;

    if (!destination || !totalCost) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Destination and total cost are required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    const priceEntry = {
        destination: destination,
        days: days || null,
        travelType: travelType || null,
        totalCost: parseFloat(totalCost),
        breakdown: breakdown || {},
        recordedAt: new Date(),
        source: 'budget-search'
    };

    await collection.insertOne(priceEntry);

    // Calculate price trend (compare with last 7 days average)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPrices = await collection
        .find({
            destination: destination,
            days: days,
            recordedAt: { $gte: sevenDaysAgo }
        })
        .toArray();

    let trend = 'stable';
    let percentageChange = 0;

    if (recentPrices.length > 1) {
        const avgPrice = recentPrices.reduce((sum, p) => sum + p.totalCost, 0) / recentPrices.length;
        percentageChange = ((totalCost - avgPrice) / avgPrice) * 100;
        
        if (percentageChange > 5) trend = 'increasing';
        else if (percentageChange < -5) trend = 'decreasing';
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            message: 'Price recorded successfully',
            trend: trend,
            percentageChange: percentageChange.toFixed(2),
            currentPrice: totalCost,
            avgRecentPrice: recentPrices.length > 0 
                ? (recentPrices.reduce((sum, p) => sum + p.totalCost, 0) / recentPrices.length).toFixed(2)
                : null
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}

/**
 * Get price history for a destination
 */
async function getPriceHistory(collection, destination, days, limit) {
    if (!destination) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Destination is required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    const query = { destination: { $regex: new RegExp(destination, 'i') } };
    if (days) {
        query.days = parseInt(days);
    }

    const history = await collection
        .find(query)
        .sort({ recordedAt: -1 })
        .limit(limit)
        .toArray();

    // Calculate statistics
    let stats = null;
    if (history.length > 0) {
        const prices = history.map(h => h.totalCost);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const currentPrice = prices[0];
        const savingsFromMax = ((maxPrice - currentPrice) / maxPrice) * 100;

        stats = {
            minPrice: minPrice,
            maxPrice: maxPrice,
            avgPrice: avgPrice.toFixed(2),
            currentPrice: currentPrice,
            savingsFromMax: savingsFromMax.toFixed(2),
            dataPoints: history.length,
            firstRecorded: history[history.length - 1].recordedAt,
            lastRecorded: history[0].recordedAt
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            destination: destination,
            days: days || 'all',
            history: history,
            stats: stats
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}
