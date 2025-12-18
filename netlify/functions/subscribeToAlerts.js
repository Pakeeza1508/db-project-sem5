const { getDb } = require('./_mongo');

/**
 * Subscribe to price drop alerts for a destination
 * POST: Create alert subscription
 * GET: Get user's alert subscriptions
 * DELETE: Unsubscribe from alert
 */
exports.handler = async function (event, context) {
    const method = event.httpMethod;

    try {
        const db = await getDb();
        const alertsCollection = db.collection('alerts');

        if (method === 'POST') {
            // Create new alert subscription
            const body = JSON.parse(event.body);
            return await createAlert(alertsCollection, body);
        } else if (method === 'GET') {
            // Get user's alerts
            const { userId, destination } = event.queryStringParameters || {};
            return await getUserAlerts(alertsCollection, userId, destination);
        } else if (method === 'DELETE') {
            // Delete alert
            const { alertId } = event.queryStringParameters || {};
            return await deleteAlert(alertsCollection, alertId);
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

    } catch (error) {
        console.error('Alert subscription error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to manage alerts', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};

/**
 * Create a new alert subscription
 */
async function createAlert(collection, data) {
    const {
        userId,
        email,
        destination,
        budget,
        days,
        travelType,
        currentPrice,
        alertThreshold = 5 // Alert when price drops by 5% or more
    } = data;

    if (!destination || !currentPrice) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Destination and current price are required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    const alert = {
        userId: userId || 'anonymous',
        email: email || null,
        destination: destination,
        budget: budget || null,
        days: days || null,
        travelType: travelType || null,
        currentPrice: parseFloat(currentPrice),
        alertThreshold: parseFloat(alertThreshold),
        targetPrice: currentPrice * (1 - alertThreshold / 100),
        active: true,
        triggered: false,
        createdAt: new Date(),
        lastChecked: new Date(),
        notifications: []
    };

    const result = await collection.insertOne(alert);

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            message: `Alert created! You'll be notified when price drops by ${alertThreshold}% or more.`,
            alertId: result.insertedId,
            alert: alert
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}

/**
 * Get user's alert subscriptions
 */
async function getUserAlerts(collection, userId, destination) {
    const query = {};
    
    if (userId) {
        query.userId = userId;
    }
    
    if (destination) {
        query.destination = { $regex: new RegExp(destination, 'i') };
    }

    const alerts = await collection.find(query).sort({ createdAt: -1 }).toArray();

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            alerts: alerts,
            count: alerts.length,
            activeAlerts: alerts.filter(a => a.active && !a.triggered).length,
            triggeredAlerts: alerts.filter(a => a.triggered).length
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}

/**
 * Delete an alert subscription
 */
async function deleteAlert(collection, alertId) {
    if (!alertId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Alert ID is required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    const { ObjectId } = require('mongodb');
    const result = await collection.deleteOne({ _id: new ObjectId(alertId) });

    if (result.deletedCount === 0) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Alert not found' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            message: 'Alert deleted successfully'
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}
