const { getDb } = require('./_mongo');

/**
 * Seed seasonal events, festivals, and best times to visit for destinations
 * GET: Seeds the database with seasonal events
 */
exports.handler = async function (event, context) {
    try {
        const db = await getDb();
        const eventsCollection = db.collection('seasonalEvents');

        // Check if already seeded
        const count = await eventsCollection.countDocuments();
        if (count > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Seasonal events already seeded',
                    count: count
                }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

        // Comprehensive seasonal events data for Pakistan and popular destinations
        const seasonalEvents = [
            // Lahore, Pakistan
            {
                city: 'Lahore',
                country: 'Pakistan',
                eventName: 'Dolmen Mall Winter Festivals',
                eventType: 'Shopping & Entertainment',
                description: 'End-of-year shopping festivals with discounts, food festivals, and family entertainment at Dolmen Mall Lahore',
                bestMonths: ['November', 'December'],
                peakMonth: 'December',
                alertMessage: '🎉 Dolmen Mall Lahore Winter Festival is coming! Best time for shopping and entertainment with massive discounts and events.',
                icon: '🛍️',
                priority: 'high'
            },
            {
                city: 'Lahore',
                country: 'Pakistan',
                eventName: 'Basant Festival',
                eventType: 'Cultural Festival',
                description: 'Traditional kite flying festival marking the arrival of spring',
                bestMonths: ['February', 'March'],
                peakMonth: 'February',
                alertMessage: '🪁 Basant season in Lahore! Experience the famous kite flying festival and spring celebrations.',
                icon: '🪁',
                priority: 'high'
            },
            {
                city: 'Lahore',
                country: 'Pakistan',
                eventName: 'Food Street Peak Season',
                eventType: 'Food & Dining',
                description: 'Gawalmandi Food Street and Fort Road Food Street at their best with cooler weather',
                bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
                peakMonth: 'January',
                alertMessage: '🍽️ Perfect weather for Lahore Food Streets! Enjoy outdoor dining at Gawalmandi and Fort Road.',
                icon: '🍽️',
                priority: 'medium'
            },

            // Karachi, Pakistan
            {
                city: 'Karachi',
                country: 'Pakistan',
                eventName: 'Clifton Beach Winter Season',
                eventType: 'Outdoor & Recreation',
                description: 'Cooler weather makes Clifton Beach perfect for families and tourists',
                bestMonths: ['November', 'December', 'January', 'February'],
                peakMonth: 'January',
                alertMessage: '🏖️ Best time to visit Clifton Beach! Cooler weather and pleasant evenings.',
                icon: '🏖️',
                priority: 'medium'
            },
            {
                city: 'Karachi',
                country: 'Pakistan',
                eventName: 'Karachi Eat Food Festival',
                eventType: 'Food Festival',
                description: 'Annual food festival featuring Pakistan\'s best restaurants and cuisines',
                bestMonths: ['January'],
                peakMonth: 'January',
                alertMessage: '🍕 Karachi Eat Festival! Pakistan\'s biggest food festival with 100+ stalls.',
                icon: '🍕',
                priority: 'high'
            },

            // Islamabad, Pakistan
            {
                city: 'Islamabad',
                country: 'Pakistan',
                eventName: 'Margalla Hills Hiking Season',
                eventType: 'Adventure & Outdoor',
                description: 'Best weather for hiking trails with clear skies and moderate temperatures',
                bestMonths: ['March', 'April', 'May', 'September', 'October', 'November'],
                peakMonth: 'October',
                alertMessage: '⛰️ Perfect hiking weather in Margalla Hills! Clear skies and pleasant temperatures.',
                icon: '⛰️',
                priority: 'medium'
            },
            {
                city: 'Islamabad',
                country: 'Pakistan',
                eventName: 'Spring Flower Season',
                eventType: 'Nature & Sightseeing',
                description: 'Daman-e-Koh and Shakarparian bloom with colorful flowers',
                bestMonths: ['March', 'April'],
                peakMonth: 'April',
                alertMessage: '🌸 Spring blossom season in Islamabad! Parks and viewpoints are stunning.',
                icon: '🌸',
                priority: 'medium'
            },

            // Murree, Pakistan
            {
                city: 'Murree',
                country: 'Pakistan',
                eventName: 'Snowfall Season',
                eventType: 'Winter Activities',
                description: 'Heavy snowfall attracts tourists for snow activities and scenic beauty',
                bestMonths: ['December', 'January', 'February'],
                peakMonth: 'January',
                alertMessage: '❄️ Snowfall season in Murree! Perfect for winter getaway and snow activities.',
                icon: '❄️',
                priority: 'high'
            },

            // Hunza, Pakistan
            {
                city: 'Hunza',
                country: 'Pakistan',
                eventName: 'Cherry Blossom Season',
                eventType: 'Nature & Photography',
                description: 'Valley covered in white and pink cherry blossoms - photographer\'s paradise',
                bestMonths: ['March', 'April'],
                peakMonth: 'April',
                alertMessage: '🌸 Cherry Blossom Season in Hunza! Most beautiful time to visit the valley.',
                icon: '🌸',
                priority: 'high'
            },
            {
                city: 'Hunza',
                country: 'Pakistan',
                eventName: 'Autumn Color Festival',
                eventType: 'Nature & Sightseeing',
                description: 'Golden and red foliage creates breathtaking landscapes',
                bestMonths: ['October', 'November'],
                peakMonth: 'October',
                alertMessage: '🍂 Autumn colors in Hunza! Valley transforms into golden paradise.',
                icon: '🍂',
                priority: 'high'
            },

            // Swat, Pakistan
            {
                city: 'Swat',
                country: 'Pakistan',
                eventName: 'Malam Jabba Skiing Season',
                eventType: 'Winter Sports',
                description: 'Pakistan\'s premier ski resort opens with fresh snow',
                bestMonths: ['December', 'January', 'February'],
                peakMonth: 'January',
                alertMessage: '⛷️ Skiing season at Malam Jabba! Pakistan\'s best slopes are ready.',
                icon: '⛷️',
                priority: 'high'
            },

            // Skardu, Pakistan
            {
                city: 'Skardu',
                country: 'Pakistan',
                eventName: 'Summer Trekking Season',
                eventType: 'Adventure & Trekking',
                description: 'Best time for K2 base camp trek and mountain expeditions',
                bestMonths: ['June', 'July', 'August', 'September'],
                peakMonth: 'July',
                alertMessage: '🏔️ Peak trekking season in Skardu! Clear weather for mountain adventures.',
                icon: '🏔️',
                priority: 'high'
            },

            // Naran Kaghan, Pakistan
            {
                city: 'Naran',
                country: 'Pakistan',
                eventName: 'Lake Saif ul Malook Season',
                eventType: 'Nature & Tourism',
                description: 'Lake accessible with clear weather and stunning mountain views',
                bestMonths: ['May', 'June', 'July', 'August', 'September'],
                peakMonth: 'July',
                alertMessage: '🏞️ Saif ul Malook season! Lake is accessible and breathtakingly beautiful.',
                icon: '🏞️',
                priority: 'high'
            },

            // Multan, Pakistan
            {
                city: 'Multan',
                country: 'Pakistan',
                eventName: 'Mango Festival',
                eventType: 'Food & Agriculture',
                description: 'Celebrate Multan\'s famous mangoes with food stalls and cultural events',
                bestMonths: ['June', 'July'],
                peakMonth: 'June',
                alertMessage: '🥭 Mango season in Multan! Taste Pakistan\'s best mangoes and cultural festivities.',
                icon: '🥭',
                priority: 'medium'
            },

            // International destinations
            {
                city: 'Dubai',
                country: 'UAE',
                eventName: 'Dubai Shopping Festival',
                eventType: 'Shopping & Entertainment',
                description: 'City-wide sales, raffles, and entertainment events',
                bestMonths: ['December', 'January'],
                peakMonth: 'January',
                alertMessage: '🛍️ Dubai Shopping Festival! Massive discounts across the city.',
                icon: '🛍️',
                priority: 'high'
            },
            {
                city: 'Paris',
                country: 'France',
                eventName: 'Spring in Paris',
                eventType: 'Nature & Sightseeing',
                description: 'Cherry blossoms and perfect weather for sightseeing',
                bestMonths: ['April', 'May', 'June'],
                peakMonth: 'May',
                alertMessage: '🌸 Spring in Paris! Perfect weather and blooming gardens.',
                icon: '🌸',
                priority: 'medium'
            },
            {
                city: 'Tokyo',
                country: 'Japan',
                eventName: 'Cherry Blossom Season',
                eventType: 'Nature & Culture',
                description: 'Famous Sakura season with hanami (flower viewing) parties',
                bestMonths: ['March', 'April'],
                peakMonth: 'April',
                alertMessage: '🌸 Sakura season in Tokyo! Most beautiful time to visit Japan.',
                icon: '🌸',
                priority: 'high'
            }
        ];

        // Insert all events
        const result = await eventsCollection.insertMany(seasonalEvents);

        // Create indexes for efficient queries
        await eventsCollection.createIndex({ city: 1, country: 1 });
        await eventsCollection.createIndex({ peakMonth: 1 });
        await eventsCollection.createIndex({ priority: 1 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Seasonal events seeded successfully',
                count: result.insertedCount,
                events: seasonalEvents.length
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };

    } catch (error) {
        console.error('Seed seasonal events error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to seed seasonal events', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};
