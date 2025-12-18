const { getDb } = require('./_mongo');

/**
 * Get seasonal recommendations and alerts for a specific destination
 * GET: ?city=Lahore&month=December
 */
exports.handler = async function (event, context) {
    const { city, month, country } = event.queryStringParameters || {};

    try {
        const db = await getDb();
        const eventsCollection = db.collection('seasonalEvents');

        // If no parameters, return all events
        if (!city && !month) {
            const allEvents = await eventsCollection.find({}).toArray();
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    events: allEvents,
                    count: allEvents.length
                }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

        // Get current month if not provided
        const targetMonth = month || getCurrentMonth();

        // Build query
        const query = {};
        if (city) {
            query.city = { $regex: new RegExp(city, 'i') }; // Case-insensitive
        }
        if (country) {
            query.country = { $regex: new RegExp(country, 'i') };
        }

        // Find matching events
        let events = await eventsCollection.find(query).toArray();

        // Filter by month if provided
        if (targetMonth) {
            events = events.filter(event => 
                event.bestMonths.includes(targetMonth) || event.peakMonth === targetMonth
            );
        }

        // Sort by priority (high first)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        events.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                city: city || 'All cities',
                month: targetMonth,
                events: events,
                count: events.length,
                hasAlerts: events.length > 0
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };

    } catch (error) {
        console.error('Get seasonal recommendations error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to get seasonal recommendations', 
                details: error.message 
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};

function getCurrentMonth() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
}
