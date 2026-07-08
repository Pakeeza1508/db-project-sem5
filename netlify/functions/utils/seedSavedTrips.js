const { getDb } = require('../_mongo');

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
        // Write directly into the plans collection used by My Trips
        const collection = db.collection('plans');

        // Target the account you are logged in with
        const testUserEmail = 'abc@gmail.com';
        const testUserId = 'test-user-123';

        // Skip seeding if this user already has plans
        const count = await collection.countDocuments({ userId: testUserEmail });
        if (count > 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Saved trips already seeded for this user',
                    message: `${count} trips already exist. Delete them first if you want to reseed.`,
                    userEmail: testUserEmail
                })
            };
        }

        // Dummy saved trips data
        const now = new Date();

        const dummySavedTrips = [
            {
            userId: testUserEmail,
            userName: 'ABC User',
            userEmail: testUserEmail,
                destination: 'Paris, France',
                destinationCode: 'CDG',
                country: 'France',
                travelStyle: 'Cultural and Historical',
                budget: 'Mid-range',
                estimatedCost: 2500,
                currency: 'USD',
                days: 5,
                startDate: '2025-06-15',
                endDate: '2025-06-20',
                preferences: 'Art museums, cafes, romantic walks, Eiffel Tower',
                weather: { temp: 18, condition: 'Partly Cloudy', humidity: 65 },
                activities: [
                    { name: 'Louvre Museum', category: 'Art & Culture', duration: '3 hours' },
                    { name: 'Eiffel Tower', category: 'Landmarks', duration: '2 hours' },
                    { name: 'Seine River Cruise', category: 'Tours', duration: '1.5 hours' },
                    { name: 'Versailles Palace', category: 'Historical Sites', duration: '4 hours' }
                ],
                itinerary: [
                    { day: 1, title: 'Arrival & Eiffel Tower', description: 'Arrive in Paris, check-in, visit Eiffel Tower at sunset' },
                    { day: 2, title: 'Louvre & Seine', description: 'Spend day at Louvre Museum, evening Seine cruise' },
                    { day: 3, title: 'Notre-Dame & Marais', description: 'Gothic Quarter tour, Jewish Quarter exploration' },
                    { day: 4, title: 'Versailles Day Trip', description: 'Palace of Versailles and gardens' },
                    { day: 5, title: 'Shopping & Departure', description: 'Champs-Élysées, farewell lunch' }
                ],
                accommodation: { name: 'Le Marais Boutique Hotel', type: 'Hotel', pricePerNight: 120, totalNights: 5 },
                transportation: { mode: 'Flight + Metro', estimatedCost: 800 },
                costs: {
                    accommodation: 600,
                    food: 700,
                    activities: 600,
                    transport: 400,
                    shopping: 200,
                    total: 2500
                },
                hotels: ['Le Marais Hotel', 'Boutique Paris Hotel', 'Latin Quarter Suites'],
                restaurants: ['Café de Flore', 'Les Deux Magots', 'L\'Ami Jean'],
                packing: ['Comfortable walking shoes', 'Light jacket', 'Umbrella', 'Dress clothes for dinner'],
                tips: ['Buy a Paris Museum Pass for discounts', 'Learn basic French phrases', 'Visit museums early to avoid crowds'],
                images: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500', 'https://images.unsplash.com/photo-1502600090657-1c67dfc35abb?w=500'],
                rating: 4.8,
                favorite: true,
                isShared: false,
                shareToken: null,
                comments: 0,
                likes: 5,
                travelDays: 5,
                createdAt: now,
                savedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                notes: 'Dream vacation! Must visit again in spring.'
            },
            {
                userId: testUserEmail,
                userName: 'ABC User',
                userEmail: testUserEmail,
                destination: 'Tokyo, Japan',
                destinationCode: 'NRT',
                country: 'Japan',
                travelStyle: 'Adventure and Outdoor',
                budget: 'Luxury',
                estimatedCost: 4500,
                currency: 'USD',
                days: 7,
                startDate: '2025-03-20',
                endDate: '2025-03-27',
                preferences: 'Modern architecture, temples, food tours, anime culture',
                weather: { temp: 12, condition: 'Clear', humidity: 55 },
                activities: [
                    { name: 'Senso-ji Temple', category: 'Temples', duration: '2 hours' },
                    { name: 'Shibuya Crossing', category: 'Landmarks', duration: '1 hour' },
                    { name: 'Mount Fuji', category: 'Nature', duration: 'Full day' },
                    { name: 'Robot Restaurant Show', category: 'Entertainment', duration: '1.5 hours' },
                    { name: 'Sushi Cooking Class', category: 'Food & Drinks', duration: '3 hours' }
                ],
                itinerary: [
                    { day: 1, title: 'Arrival & Shibuya', description: 'Land at Narita, settle in hotel, explore Shibuya at night' },
                    { day: 2, title: 'Asakusa & Temples', description: 'Visit Senso-ji Temple, street food exploration' },
                    { day: 3, title: 'Akihabara & Gaming', description: 'Tech district, anime shops, arcades' },
                    { day: 4, title: 'Mount Fuji Day Trip', description: 'Take bullet train to Mount Fuji, hot springs experience' },
                    { day: 5, title: 'Harajuku & Meiji', description: 'Meiji Shrine, Harajuku shopping, youth culture' },
                    { day: 6, title: 'Team Lab & Odaiba', description: 'Digital art museum, Rainbow Bridge views' },
                    { day: 7, title: 'Last Day & Departure', description: 'Last-minute shopping, head to airport' }
                ],
                accommodation: { name: 'Park Hyatt Tokyo', type: 'Hotel', pricePerNight: 500, totalNights: 7 },
                transportation: { mode: 'Flight + JR Pass', estimatedCost: 800 },
                costs: {
                    accommodation: 3500,
                    food: 1200,
                    activities: 800,
                    transport: 500,
                    shopping: 300,
                    total: 4500
                },
                hotels: ['Park Hyatt Tokyo', 'Mandarin Oriental Tokyo', 'The Ritz-Carlton'],
                restaurants: ['Nabezo', 'Sukiyabashi Jiro', 'Gonpachi'],
                packing: ['Comfortable shoes', 'Power adapter', 'Light clothing', 'Respectful temple attire'],
                tips: ['Get a Suica card for easy transit', 'Respect temple etiquette', 'Try the 100 yen shops'],
                images: ['https://images.unsplash.com/photo-1540959375944-7049f642e9cc?w=500', 'https://images.unsplash.com/photo-1549144611-11a3a7537cbf?w=500'],
                rating: 4.9,
                favorite: true,
                isShared: false,
                shareToken: null,
                comments: 0,
                likes: 8,
                travelDays: 7,
                createdAt: now,
                savedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                notes: 'Booked! Most excited trip ever!'
            },
            {
                userId: testUserEmail,
                userName: 'ABC User',
                userEmail: testUserEmail,
                destination: 'Barcelona, Spain',
                destinationCode: 'BCN',
                country: 'Spain',
                travelStyle: 'Cultural and Historical',
                budget: 'Mid-range',
                estimatedCost: 1800,
                currency: 'USD',
                days: 4,
                startDate: '2025-05-10',
                endDate: '2025-05-14',
                preferences: 'Gaudí architecture, beaches, nightlife, Mediterranean food',
                weather: { temp: 22, condition: 'Sunny', humidity: 60 },
                activities: [
                    { name: 'Sagrada Familia', category: 'Architecture', duration: '2 hours' },
                    { name: 'Park Güell', category: 'Parks & Gardens', duration: '2.5 hours' },
                    { name: 'Barceloneta Beach', category: 'Beaches', duration: '4 hours' },
                    { name: 'Gothic Quarter Walk', category: 'Historical Tours', duration: '2 hours' }
                ],
                itinerary: [
                    { day: 1, title: 'Sagrada Familia & Park Güell', description: 'Gaudí masterpieces morning to evening' },
                    { day: 2, title: 'Gothic Quarter', description: 'Medieval streets, Barcelona Cathedral, local tapas' },
                    { day: 3, title: 'Beach & Nightlife', description: 'Relaxation at Barceloneta Beach, evening at Las Ramblas' },
                    { day: 4, title: 'Montjuïc & Departure', description: 'Cable car views, Magic Fountain show' }
                ],
                accommodation: { name: 'Gothic Point Hotel', type: 'Hotel', pricePerNight: 100, totalNights: 4 },
                transportation: { mode: 'Flight + Metro', estimatedCost: 400 },
                costs: {
                    accommodation: 400,
                    food: 500,
                    activities: 400,
                    transport: 300,
                    shopping: 200,
                    total: 1800
                },
                hotels: ['Gothic Point Hotel', 'Ohla Barcelona', 'Condes Barcelona'],
                restaurants: ['Cal Pep', 'Cervecería Catalana', 'Tickets Bar'],
                packing: ['Sunscreen', 'Swimwear', 'Comfortable walking shoes', 'Light summer clothes'],
                tips: ['Book Sagrada Familia online in advance', 'Visit beaches at sunset', 'Try local vermouth'],
                images: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=500', 'https://images.unsplash.com/photo-1587649452203-e50a5f1ff0e0?w=500'],
                rating: 4.7,
                favorite: true,
                isShared: false,
                shareToken: null,
                comments: 0,
                likes: 6,
                travelDays: 4,
                createdAt: now,
                savedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                notes: 'Planning for spring break! Love architecture.'
            },
            {
                userId: testUserEmail,
                userName: 'ABC User',
                userEmail: testUserEmail,
                destination: 'Bali, Indonesia',
                destinationCode: 'DPS',
                country: 'Indonesia',
                travelStyle: 'Relaxation and Leisure',
                budget: 'Budget',
                estimatedCost: 1200,
                currency: 'USD',
                days: 5,
                startDate: '2025-07-01',
                endDate: '2025-07-06',
                preferences: 'Beaches, temples, yoga, rice terraces, wellness',
                weather: { temp: 28, condition: 'Tropical', humidity: 80 },
                activities: [
                    { name: 'Tegallalang Rice Terraces', category: 'Nature', duration: '2 hours' },
                    { name: 'Tirta Empul Temple', category: 'Temples', duration: '2 hours' },
                    { name: 'Nusa Dua Beach', category: 'Beaches', duration: '4 hours' },
                    { name: 'Spa & Massage', category: 'Wellness', duration: '3 hours' },
                    { name: 'Yoga Class', category: 'Wellness', duration: '1.5 hours' }
                ],
                itinerary: [
                    { day: 1, title: 'Arrival & Ubud', description: 'Arrive at Denpasar, transfer to Ubud, explore town' },
                    { day: 2, title: 'Rice Terraces & Temples', description: 'Tegallalang rice fields, Tirta Empul water temple' },
                    { day: 3, title: 'Beach Day', description: 'Nusa Dua white sand beach, snorkeling or surfing' },
                    { day: 4, title: 'Spa & Yoga', description: 'Traditional Balinese massage, sunset yoga class' },
                    { day: 5, title: 'Shopping & Relaxation', description: 'Local crafts market, return to airport' }
                ],
                accommodation: { name: 'Ubud Terrace Hotel', type: 'Guesthouse', pricePerNight: 50, totalNights: 5 },
                transportation: { mode: 'Flight + Local Transport', estimatedCost: 300 },
                costs: {
                    accommodation: 250,
                    food: 300,
                    activities: 300,
                    transport: 200,
                    shopping: 150,
                    total: 1200
                },
                hotels: ['Ubud Terrace Rice Field Hotel', 'Beachfront Bungalow', 'The Kayon Resort'],
                restaurants: ['Bridges Bali', 'Mozaic Beach Club', 'Karsa Kafe'],
                packing: ['Swimwear', 'Sunscreen', 'Light clothing', 'Sarong', 'Yoga mat'],
                tips: ['Respect temple dress codes', 'Barter at markets', 'Hire a scooter for exploring'],
                images: ['https://images.unsplash.com/photo-1537225228614-b19960eaeb4f?w=500', 'https://images.unsplash.com/photo-1513161455079-7ef1a827b212?w=500'],
                rating: 4.9,
                favorite: true,
                isShared: false,
                shareToken: null,
                comments: 0,
                likes: 12,
                travelDays: 5,
                createdAt: now,
                savedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                notes: 'Perfect getaway for relaxation. Best value for money!'
            },
            {
                userId: testUserEmail,
                userName: 'ABC User',
                userEmail: testUserEmail,
                destination: 'New York, USA',
                destinationCode: 'JFK',
                country: 'United States',
                travelStyle: 'Adventure and Outdoor',
                budget: 'Luxury',
                estimatedCost: 3200,
                currency: 'USD',
                days: 6,
                startDate: '2025-09-15',
                endDate: '2025-09-21',
                preferences: 'Broadway, museums, skyline views, street food, shopping',
                weather: { temp: 20, condition: 'Clear', humidity: 65 },
                activities: [
                    { name: 'Broadway Show', category: 'Entertainment', duration: '3 hours' },
                    { name: 'Statue of Liberty', category: 'Landmarks', duration: '4 hours' },
                    { name: 'Central Park', category: 'Parks', duration: '3 hours' },
                    { name: 'Metropolitan Museum', category: 'Museums', duration: '4 hours' },
                    { name: 'Brooklyn Bridge Walk', category: 'Walking Tours', duration: '2 hours' }
                ],
                itinerary: [
                    { day: 1, title: 'Times Square & Broadway', description: 'Arrive, check-in, Broadway show in evening' },
                    { day: 2, title: 'Statue & Ellis Island', description: 'Statue of Liberty ferry, immigration museum' },
                    { day: 3, title: 'Central Park & Museums', description: 'Park exploration, Metropolitan Museum of Art' },
                    { day: 4, title: 'Brooklyn & Williamsburg', description: 'Brooklyn Bridge walk, Williamsburg neighborhood' },
                    { day: 5, title: 'Empire State & Shopping', description: 'Empire State Building, 5th Avenue shopping' },
                    { day: 6, title: 'Departure', description: 'Final moments, last attractions, head to airport' }
                ],
                accommodation: { name: 'The Plaza Hotel', type: 'Hotel', pricePerNight: 400, totalNights: 6 },
                transportation: { mode: 'Flight + Subway', estimatedCost: 600 },
                costs: {
                    accommodation: 2400,
                    food: 800,
                    activities: 700,
                    transport: 300,
                    shopping: 500,
                    total: 3200
                },
                hotels: ['The Plaza Hotel', 'St. Regis New York', 'Four Seasons NYC'],
                restaurants: ['Eleven Madison Park', 'Per Se', 'Balthazar'],
                packing: ['Business casual', 'Comfortable walking shoes', 'Power adapter', 'Camera'],
                tips: ['Get a MetroCard for subway', 'Book Broadway tickets in advance', 'Visit TKTS for discounts'],
                images: ['https://images.unsplash.com/photo-1513581578314-e0e0a53ce0c3?w=500', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500'],
                rating: 4.8,
                favorite: true,
                isShared: false,
                shareToken: null,
                comments: 0,
                likes: 10,
                travelDays: 6,
                createdAt: now,
                savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                notes: 'Dream trip! Cant wait for fall season in NYC.'
            },
            {
                userId: testUserEmail,
                userName: 'ABC User',
                userEmail: testUserEmail,
                destination: 'Dubai, UAE',
                destinationCode: 'DXB',
                country: 'United Arab Emirates',
                travelStyle: 'Luxury and Shopping',
                budget: 'Luxury',
                estimatedCost: 3500,
                currency: 'USD',
                days: 5,
                startDate: '2025-11-15',
                endDate: '2025-11-20',
                preferences: 'Shopping, luxury, desert safari, beach clubs',
                weather: { temp: 28, condition: 'Sunny', humidity: 40 },
                activities: [
                    { name: 'Shopping Mall Tour', category: 'Shopping', duration: '4 hours' },
                    { name: 'Desert Safari', category: 'Adventure', duration: '6 hours' },
                    { name: 'Burj Khalifa', category: 'Landmarks', duration: '2 hours' },
                    { name: 'Palm Jumeirah', category: 'Luxury', duration: '3 hours' },
                    { name: 'Beach Club Experience', category: 'Leisure', duration: '4 hours' }
                ],
                itinerary: [
                    { day: 1, title: 'Arrival & Shopping', description: 'Arrive, check into 5-star hotel, mall exploration' },
                    { day: 2, title: 'Desert Safari', description: 'Evening desert safari with dune bashing, BBQ dinner' },
                    { day: 3, title: 'Burj Khalifa & Downtown', description: 'World tallest building, fountain show' },
                    { day: 4, title: 'Palm Jumeirah & Beach', description: 'Luxurious island tour, beach club' },
                    { day: 5, title: 'Last Shopping & Departure', description: 'Final shopping, duty-free, head to airport' }
                ],
                accommodation: { name: 'Burj Al Arab Jumeirah', type: 'Hotel', pricePerNight: 600, totalNights: 5 },
                transportation: { mode: 'Flight + Luxury Car Service', estimatedCost: 800 },
                costs: {
                    accommodation: 3000,
                    food: 1000,
                    activities: 600,
                    transport: 300,
                    shopping: 800,
                    total: 3500
                },
                hotels: ['Burj Al Arab Jumeirah', 'Atlantis the Palm', 'Emirates Palace'],
                restaurants: ['Nobu', 'Étoile', 'Zuma'],
                packing: ['Sunscreen', 'Designer clothes', 'Light summer wear', 'Evening wear for clubs'],
                tips: ['Book desert safari in advance', 'Shop in malls for tax-free items', 'Best time is November to March'],
                images: ['https://images.unsplash.com/photo-1512453475868-bada826cbf27?w=500', 'https://images.unsplash.com/photo-1518972776772-3054fe9b84a8?w=500'],
                rating: 4.6,
                favorite: true,
                isShared: false,
                shareToken: null,
                comments: 0,
                likes: 4,
                travelDays: 5,
                createdAt: now,
                savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                notes: 'Ultimate luxury experience. Shopping paradise!'
            }
        ];

        // Insert the dummy trips
        const result = await collection.insertMany(dummySavedTrips);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Successfully seeded ${result.insertedIds.length} saved trips`,
                userEmail: testUserEmail,
                tripsCount: result.insertedIds.length,
                tripIds: result.insertedIds
            })
        };

    } catch (error) {
        console.error('Error seeding saved trips:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to seed saved trips',
                message: error.message
            })
        };
    }
};