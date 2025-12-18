// Update exchange rates in MongoDB - for admin/scheduled updates
// Can be called manually or via cron job
const { getDb } = require('./_mongo');

exports.handler = async (event) => {
    // Allow GET for fetching latest, POST for updating
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed. Use GET or POST' })
        };
    }

    try {
        const db = await getDb();

        if (event.httpMethod === 'GET') {
            // Return current rates
            const current = await db.collection('exchangeRates').findOne({ baseCurrency: 'USD' });
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    currentRates: current ? current.rates : {},
                    updatedAt: current ? current.updatedAt : null
                })
            };
        }

        // POST - Update rates
        const body = JSON.parse(event.body);
        const { rates, source = 'Manual update' } = body;

        if (!rates || typeof rates !== 'object') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'rates object is required' })
            };
        }

        // Update or insert exchange rates
        const result = await db.collection('exchangeRates').updateOne(
            { baseCurrency: 'USD' },
            {
                $set: {
                    rates: rates,
                    updatedAt: new Date(),
                    source: source,
                    lastModified: new Date()
                }
            },
            { upsert: true }
        );

        console.log(`✅ Updated exchange rates - Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Exchange rates updated successfully',
                rates: rates,
                updatedAt: new Date(),
                source: source
            })
        };

    } catch (error) {
        console.error('Error updating exchange rates:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to update exchange rates',
                details: error.message
            })
        };
    }
};
