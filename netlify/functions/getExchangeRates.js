// Get exchange rates from MongoDB - called by frontend
const { getDb } = require('./_mongo');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed. Use GET' })
        };
    }

    try {
        const db = await getDb();
        
        // Fetch exchange rates from database
        const exchangeRates = await db.collection('exchangeRates').findOne({ baseCurrency: 'USD' });
        
        if (!exchangeRates) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    error: 'Exchange rates not found. Run /.netlify/functions/seedExchangeRates first',
                    fallbackRates: {
                        USD: 1,
                        PKR: 278.50,
                        INR: 83.12,
                        EUR: 0.92,
                        GBP: 0.79,
                        JPY: 149.50
                    }
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                rates: exchangeRates.rates,
                baseCurrency: exchangeRates.baseCurrency,
                updatedAt: exchangeRates.updatedAt,
                source: 'database'
            })
        };

    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch exchange rates',
                details: error.message
            })
        };
    }
};
