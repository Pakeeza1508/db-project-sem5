// Netlify Function: Seed dummy trips into MongoDB for demo purposes
const { getDb } = require('./_mongo');

exports.handler = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const db = await getDb();
        const collection = db.collection('plans');

        // Check if we already have seed data
        const count = await collection.countDocuments({});
        if (count > 10) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: 'Database already populated',
                    message: `${count} trips already exist. Clear database first if you want to reseed.`
                })
            };
        }

        // Dummy trips data
        const dummyTrips = [
            {
                destination: 'Paris, France',
                travelDays: 5,
                travelStyle: 'Cultural and Historical',
                budget: 'Mid-range',
                estimatedCost: 2500,
                preferences: 'Art museums, cafes, romantic walks',
                weather: { temp: 12, condition: 'Partly Cloudy' },
                itinerary: [
                    { day: 1, description: 'Arrival & Eiffel Tower', activities: [{ name: 'Arrive in Paris', description: 'Check in hotel' }, { name: 'Eiffel Tower', description: 'Iconic landmark visit' }] },
                    { day: 2, description: 'Louvre Museum', activities: [{ name: 'Louvre', description: 'World\'s largest art museum' }, { name: 'Seine River Walk', description: 'Evening stroll' }] },
                    { day: 3, description: 'Notre-Dame & Marais', activities: [{ name: 'Notre-Dame', description: 'Gothic cathedral' }, { name: 'Jewish Quarter', description: 'Historic neighborhood' }] },
                    { day: 4, description: 'Versailles', activities: [{ name: 'Palace of Versailles', description: 'Royal residence' }, { name: 'Gardens Tour', description: 'Explore grounds' }] },
                    { day: 5, description: 'Shopping & Departure', activities: [{ name: 'Champs-Élysées', description: 'Shopping avenue' }, { name: 'Departure', description: 'Head to airport' }] }
                ],
                costs: { hotels: 800, food: 700, activities: 600, transport: 400, total: 2500 },
                hotels: ['Le Marais Hotel', 'Boutique Paris Hotel'],
                packing: ['Comfortable walking shoes', 'Light jacket', 'Umbrella'],
                tips: ['Buy a Paris Museum Pass for discounts', 'Learn basic French phrases'],
                rating: 4.8,
                favorite: true,
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Tokyo, Japan',
                travelDays: 7,
                travelStyle: 'Adventure and Outdoor',
                budget: 'Luxury',
                estimatedCost: 4500,
                preferences: 'Modern architecture, temples, food tours',
                weather: { temp: 18, condition: 'Clear' },
                itinerary: [
                    { day: 1, description: 'Arrival & Shibuya', activities: [{ name: 'Arrive', description: 'Settle in' }, { name: 'Shibuya Crossing', description: 'World\'s busiest crossing' }] },
                    { day: 2, description: 'Asakusa & Senso-ji', activities: [{ name: 'Senso-ji Temple', description: 'Ancient Buddhist temple' }, { name: 'Street Food', description: 'Try local snacks' }] },
                    { day: 3, description: 'Akihabara & Gaming', activities: [{ name: 'Tech District', description: 'Electronics paradise' }, { name: 'Arcades', description: 'Gaming experience' }] },
                    { day: 4, description: 'Mount Fuji Day Trip', activities: [{ name: 'Mt. Fuji', description: 'Japan\'s iconic peak' }, { name: 'Hakone', description: 'Hot springs resort' }] },
                    { day: 5, description: 'Harajuku & Meiji', activities: [{ name: 'Harajuku Fashion', description: 'Youth culture hub' }, { name: 'Meiji Shrine', description: 'Shinto shrine' }] },
                    { day: 6, description: 'Team Lab & Odaiba', activities: [{ name: 'Digital Art Museum', description: 'Immersive experience' }, { name: 'Rainbow Bridge', description: 'Night views' }] },
                    { day: 7, description: 'Departure', activities: [{ name: 'Last minute shopping', description: 'Souvenirs' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 2000, food: 1200, activities: 800, transport: 500, total: 4500 },
                hotels: ['Park Hyatt Tokyo', 'Mandarin Oriental'],
                packing: ['Comfortable shoes', 'Power adapter', 'Light clothing'],
                tips: ['Get a Suica card for easy transit', 'Respect temple etiquette'],
                rating: 4.9,
                favorite: true,
                createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Barcelona, Spain',
                travelDays: 4,
                travelStyle: 'Cultural and Historical',
                budget: 'Mid-range',
                estimatedCost: 1800,
                preferences: 'Gaudí architecture, beaches, nightlife',
                weather: { temp: 22, condition: 'Sunny' },
                itinerary: [
                    { day: 1, description: 'Sagrada Familia', activities: [{ name: 'Sagrada Familia', description: 'Iconic basilica' }, { name: 'Park Güell', description: 'Mosaic park' }] },
                    { day: 2, description: 'Gothic Quarter', activities: [{ name: 'Gothic Quarter Walk', description: 'Medieval streets' }, { name: 'Barcelona Cathedral', description: 'Gothic masterpiece' }] },
                    { day: 3, description: 'Beach & Nightlife', activities: [{ name: 'Barceloneta Beach', description: 'Mediterranean coast' }, { name: 'Las Ramblas', description: 'Tree-lined avenue' }] },
                    { day: 4, description: 'Montjuïc & Departure', activities: [{ name: 'Montjuïc Cable Car', description: 'City views' }, { name: 'Magic Fountain', description: 'Evening show' }] }
                ],
                costs: { hotels: 600, food: 500, activities: 400, transport: 300, total: 1800 },
                hotels: ['Gothic Point Hotel', 'Ohla Barcelona'],
                packing: ['Sunscreen', 'Swimwear', 'Comfortable shoes'],
                tips: ['Book Sagrada Familia in advance', 'Visit beaches at sunset'],
                rating: 4.7,
                favorite: false,
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'New York, USA',
                travelDays: 6,
                travelStyle: 'Adventure and Outdoor',
                budget: 'Luxury',
                estimatedCost: 3200,
                preferences: 'Broadway, museums, skyline views, street food',
                weather: { temp: 15, condition: 'Partly Cloudy' },
                itinerary: [
                    { day: 1, description: 'Times Square & Broadway', activities: [{ name: 'Arrive NYC', description: 'Check in' }, { name: 'Times Square', description: 'Iconic square' }, { name: 'Broadway Show', description: 'Evening theater' }] },
                    { day: 2, description: 'Statue & Ellis Island', activities: [{ name: 'Statue of Liberty', description: 'Ferry tour' }, { name: 'Ellis Island', description: 'Immigration history' }] },
                    { day: 3, description: 'Central Park & Museums', activities: [{ name: 'Central Park', description: 'Park exploration' }, { name: 'Metropolitan Museum', description: 'Art collection' }] },
                    { day: 4, description: 'Brooklyn & Williamsburg', activities: [{ name: 'Brooklyn Bridge Walk', description: 'Iconic bridge' }, { name: 'Williamsburg', description: 'Hipster neighborhood' }] },
                    { day: 5, description: 'Empire State & Shopping', activities: [{ name: 'Empire State Building', description: 'Observation deck' }, { name: '5th Avenue', description: 'Premium shopping' }] },
                    { day: 6, description: 'Departure', activities: [{ name: 'Last attractions', description: 'Final moments' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 1200, food: 800, activities: 700, transport: 500, total: 3200 },
                hotels: ['The Plaza Hotel', 'St. Regis New York'],
                packing: ['Business casual', 'Comfortable walking shoes', 'Power adapter'],
                tips: ['Get a MetroCard for subway', 'Book Broadway tickets in advance'],
                rating: 4.8,
                favorite: true,
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Bali, Indonesia',
                travelDays: 5,
                travelStyle: 'Relaxation and Leisure',
                budget: 'Budget',
                estimatedCost: 1200,
                preferences: 'Beaches, temples, yoga, rice terraces',
                weather: { temp: 28, condition: 'Tropical' },
                itinerary: [
                    { day: 1, description: 'Arrival & Ubud', activities: [{ name: 'Arrive Bali', description: 'Check in' }, { name: 'Ubud Town', description: 'Arts center' }] },
                    { day: 2, description: 'Rice Terraces & Temples', activities: [{ name: 'Tegallalang Rice', description: 'Scenic terraces' }, { name: 'Tirta Empul Temple', description: 'Water temple' }] },
                    { day: 3, description: 'Beach Day', activities: [{ name: 'Nusa Dua Beach', description: 'White sand' }, { name: 'Water Sports', description: 'Surfing or snorkeling' }] },
                    { day: 4, description: 'Spa & Relaxation', activities: [{ name: 'Traditional Massage', description: 'Balinese spa' }, { name: 'Beach Sunset', description: 'Evening walk' }] },
                    { day: 5, description: 'Departure', activities: [{ name: 'Shopping', description: 'Local crafts' }, { name: 'Airport', description: 'Fly out' }] }
                ],
                costs: { hotels: 400, food: 300, activities: 300, transport: 200, total: 1200 },
                hotels: ['Ubud Terrace Rice Field Hotel', 'Beachfront Bungalow'],
                packing: ['Swimwear', 'Sunscreen', 'Light clothing', 'Sarong'],
                tips: ['Respect temple dress codes', 'Barter at markets'],
                rating: 4.9,
                favorite: true,
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Dubai, UAE',
                travelDays: 4,
                travelStyle: 'Luxury',
                budget: 'Luxury',
                estimatedCost: 3500,
                preferences: 'Shopping, beaches, desert safari, modern architecture',
                weather: { temp: 35, condition: 'Sunny' },
                itinerary: [
                    { day: 1, description: 'Burj Khalifa & Mall', activities: [{ name: 'Burj Khalifa', description: 'World\'s tallest building' }, { name: 'Dubai Mall', description: 'Mega mall' }] },
                    { day: 2, description: 'Desert Safari', activities: [{ name: 'Desert Tour', description: 'Dune bashing' }, { name: 'Bedouin Camp', description: 'Traditional experience' }] },
                    { day: 3, description: 'Beaches & Watersports', activities: [{ name: 'Jumeirah Beach', description: 'Luxury beach' }, { name: 'Jet Ski', description: 'Water activities' }] },
                    { day: 4, description: 'Shopping & Departure', activities: [{ name: 'Gold Souk', description: 'Traditional market' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 1500, food: 900, activities: 700, transport: 400, total: 3500 },
                hotels: ['Burj Al Arab', 'Emirates Palace'],
                packing: ['Light, breathable clothes', 'Sunscreen', 'Swimwear'],
                tips: ['Dress modestly outside beaches', 'Haggle in souks'],
                rating: 4.6,
                favorite: false,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Rome, Italy',
                travelDays: 4,
                travelStyle: 'Cultural and Historical',
                budget: 'Mid-range',
                estimatedCost: 2000,
                preferences: 'Ancient ruins, art, food, history',
                weather: { temp: 18, condition: 'Clear' },
                itinerary: [
                    { day: 1, description: 'Colosseum & Forum', activities: [{ name: 'Colosseum', description: 'Ancient amphitheater' }, { name: 'Roman Forum', description: 'Ancient marketplace' }] },
                    { day: 2, description: 'Vatican', activities: [{ name: 'St. Peter\'s Basilica', description: 'Iconic church' }, { name: 'Vatican Museums', description: 'Art collection' }] },
                    { day: 3, description: 'Trevi & Pantheon', activities: [{ name: 'Trevi Fountain', description: 'Coin tossing' }, { name: 'Pantheon', description: 'Ancient temple' }] },
                    { day: 4, description: 'Food & Departure', activities: [{ name: 'Food Tour', description: 'Local cuisine' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 700, food: 600, activities: 400, transport: 300, total: 2000 },
                hotels: ['Hotel Artemide', 'Albergo del Senato'],
                packing: ['Comfortable shoes', 'Light jacket', 'Modest clothing for churches'],
                tips: ['Book Vatican in advance', 'Carry cash for small restaurants'],
                rating: 4.8,
                favorite: true,
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Sydney, Australia',
                travelDays: 6,
                travelStyle: 'Adventure and Outdoor',
                budget: 'Mid-range',
                estimatedCost: 2800,
                preferences: 'Beaches, hiking, wildlife, opera house',
                weather: { temp: 25, condition: 'Sunny' },
                itinerary: [
                    { day: 1, description: 'Opera House & Harbour', activities: [{ name: 'Sydney Opera House', description: 'Iconic venue' }, { name: 'Harbour Bridge', description: 'Bridge climb' }] },
                    { day: 2, description: 'Beaches', activities: [{ name: 'Bondi Beach', description: 'Famous beach' }, { name: 'Coastal Walk', description: 'Scenic hike' }] },
                    { day: 3, description: 'Blue Mountains', activities: [{ name: 'Blue Mountains', description: 'Mountain hiking' }, { name: 'Three Sisters', description: 'Rock formation' }] },
                    { day: 4, description: 'Wildlife', activities: [{ name: 'Taronga Zoo', description: 'Wildlife encounters' }, { name: 'Aquarium', description: 'Marine life' }] },
                    { day: 5, description: 'Manly Beach', activities: [{ name: 'Manly Beach', description: 'Coastal town' }, { name: 'Scenic Walk', description: 'Waterfront path' }] },
                    { day: 6, description: 'Departure', activities: [{ name: 'Shopping & sightseeing', description: 'Final hours' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 1000, food: 800, activities: 600, transport: 400, total: 2800 },
                hotels: ['Park Hyatt Sydney', 'Shangri-La Sydney'],
                packing: ['Swimwear', 'Sunscreen', 'Hiking boots'],
                tips: ['Book Opera House tour in advance', 'Swim only in patrolled beaches'],
                rating: 4.9,
                favorite: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Amsterdam, Netherlands',
                travelDays: 3,
                travelStyle: 'Cultural and Historical',
                budget: 'Budget',
                estimatedCost: 1400,
                preferences: 'Canal tours, museums, cycling, street food',
                weather: { temp: 12, condition: 'Cloudy' },
                itinerary: [
                    { day: 1, description: 'Canal Tour & Anne Frank', activities: [{ name: 'Canal Tour', description: 'Boat ride' }, { name: 'Anne Frank House', description: 'Historical museum' }] },
                    { day: 2, description: 'Cycling & Markets', activities: [{ name: 'Cycling Tour', description: 'Bike local' }, { name: 'Albert Cuyp Market', description: 'Street market' }] },
                    { day: 3, description: 'Museums & Departure', activities: [{ name: 'Van Gogh Museum', description: 'Art collection' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 500, food: 350, activities: 300, transport: 250, total: 1400 },
                hotels: ['Amsterdam Bicycle Hotel', 'Qbic Hotel Amsterdam'],
                packing: ['Comfortable shoes', 'Rain jacket', 'Bike-friendly clothes'],
                tips: ['Rent a bike like locals', 'Check out street vendors'],
                rating: 4.7,
                favorite: false,
                createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
            },
            {
                destination: 'Bangkok, Thailand',
                travelDays: 5,
                travelStyle: 'Relaxation and Leisure',
                budget: 'Budget',
                estimatedCost: 1100,
                preferences: 'Temples, street food, markets, nightlife',
                weather: { temp: 32, condition: 'Hot & Humid' },
                itinerary: [
                    { day: 1, description: 'Grand Palace & Temples', activities: [{ name: 'Grand Palace', description: 'Royal residence' }, { name: 'Wat Phra Kaew', description: 'Temple of the Emerald Buddha' }] },
                    { day: 2, description: 'Floating Markets', activities: [{ name: 'Damnoen Saduak', description: 'Floating market' }, { name: 'Canal Tour', description: 'Boat ride' }] },
                    { day: 3, description: 'Street Food Tour', activities: [{ name: 'Chatuchak Weekend Market', description: 'Huge market' }, { name: 'Food Trail', description: 'Street food sampling' }] },
                    { day: 4, description: 'Massage & Relaxation', activities: [{ name: 'Traditional Thai Massage', description: 'Spa treatment' }, { name: 'Rooftop Bars', description: 'Nightlife' }] },
                    { day: 5, description: 'Departure', activities: [{ name: 'Last minute shopping', description: 'Souvenirs' }, { name: 'Airport', description: 'Depart' }] }
                ],
                costs: { hotels: 350, food: 300, activities: 200, transport: 250, total: 1100 },
                hotels: ['NapPark Hostel', 'Lub Thai Boutique Hotel'],
                packing: ['Light clothing', 'Sunscreen', 'Comfortable shoes'],
                tips: ['Respect the monarchy', 'Try local street food'],
                rating: 4.8,
                favorite: true,
                createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
            }
        ];

        // Insert into MongoDB
        const result = await collection.insertMany(dummyTrips);
        console.log(`✅ Inserted ${result.insertedCount} dummy trips`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Successfully seeded ${result.insertedCount} trips`,
                insertedIds: result.insertedIds
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal Server Error', 
                details: error.message 
            })
        };
    }
};
