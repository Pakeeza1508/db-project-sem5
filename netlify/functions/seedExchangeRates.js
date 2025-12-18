// Seed exchange rates to MongoDB - Run once via /.netlify/functions/seedExchangeRates
const { getDb } = require('./_mongo');

const exchangeRatesData = {
    baseCurrency: 'USD',
    rates: {
        USD: 1,
        PKR: 278.50,
        INR: 83.12,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        AUD: 1.53,
        CAD: 1.36,
        CHF: 0.88,
        CNY: 7.24,
        AED: 3.67,
        SAR: 3.75,
        QAR: 3.64,
        BDT: 110.50,
        SGD: 1.35,
        MYR: 4.70,
        THB: 36.20,
        IDR: 16200,
        VND: 25000,
        PHP: 58.50,
        KWD: 0.31,
        OMR: 0.38,
        ARS: 1000
    },
    updatedAt: new Date(),
    source: 'Manual entry - can be updated via /updateExchangeRates'
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed. Use GET' })
        };
    }

    try {
        const db = await getDb();
        
        // Check if exchange rates already exist
        const existing = await db.collection('exchangeRates').findOne({ baseCurrency: 'USD' });
        
        if (existing) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Exchange rates already seeded',
                    rates: existing.rates,
                    updatedAt: existing.updatedAt
                })
            };
        }

        // Insert exchange rates
        const result = await db.collection('exchangeRates').insertOne(exchangeRatesData);
        
        console.log(`✅ Seeded exchange rates to database`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Exchange rates seeded successfully',
                rates: exchangeRatesData.rates,
                count: Object.keys(exchangeRatesData.rates).length,
                baseCurrency: exchangeRatesData.baseCurrency
            })
        };

    } catch (error) {
        console.error('Seed error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to seed exchange rates',
                details: error.message
            })
        };
    }
};
