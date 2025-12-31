const { getCollection } = require('./_mongo');
const bcrypt = require('bcryptjs');

/**
 * Seed complete user profiles with search history, trips, and testimonials
 */
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const usersCollection = await getCollection('users');
        const searchHistoryCollection = await getCollection('searchHistory');
        const plansCollection = await getCollection('plans');
        const testimonialsCollection = await getCollection('testimonials');

        // Sample users to create
        const sampleUsers = [
            {
                name: 'Ahmed Khan',
                email: 'ahmed.khan@example.com',
                password: 'password123'
            },
            {
                name: 'Sara Ali',
                email: 'sara.ali@example.com',
                password: 'password123'
            },
            {
                name: 'Hassan Raza',
                email: 'hassan.raza@example.com',
                password: 'password123'
            },
            {
                name: 'Fatima Malik',
                email: 'fatima.malik@example.com',
                password: 'password123'
            },
            {
                name: 'Usman Sheikh',
                email: 'usman.sheikh@example.com',
                password: 'password123'
            }
        ];

        const createdUsers = [];

        // Create users
        for (const userData of sampleUsers) {
            // Check if user already exists
            const existingUser = await usersCollection.findOne({ email: userData.email });
            
            let userId;
            if (existingUser) {
                userId = existingUser._id.toString();
                console.log(`User ${userData.email} already exists`);
            } else {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const newUser = {
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
                };
                const result = await usersCollection.insertOne(newUser);
                userId = result.insertedId.toString();
                console.log(`Created user: ${userData.email}`);
            }

            createdUsers.push({ ...userData, userId });
        }

        // Sample destinations
        const destinations = [
            'Hunza Valley', 'Murree', 'Naran', 'Kaghan', 'Swat Valley',
            'Skardu', 'Fairy Meadows', 'Neelum Valley', 'Chitral', 'Kalash Valley',
            'Gilgit', 'Naltar Valley', 'Astore Valley', 'Kumrat Valley', 'Shogran',
            'Nathia Gali', 'Ayubia', 'Bhurban', 'Patriata', 'Malam Jabba'
        ];

        const travelTypes = ['Solo', 'Couple', 'Family', 'Group'];
        const activities = ['Hiking', 'Sightseeing', 'Photography', 'Camping', 'Food Tours', 'Shopping'];

        let totalSearches = 0;
        let totalTrips = 0;
        let totalTestimonials = 0;

        // Create data for each user
        for (const user of createdUsers) {
            const userId = user.userId;
            const numSearches = Math.floor(Math.random() * 15) + 5; // 5-20 searches per user
            const numTrips = Math.floor(Math.random() * 8) + 2; // 2-10 trips per user
            const numTestimonials = Math.floor(Math.random() * 5) + 1; // 1-5 testimonials per user

            // Create search history
            const searches = [];
            for (let i = 0; i < numSearches; i++) {
                const destination = destinations[Math.floor(Math.random() * destinations.length)];
                const budget = Math.floor(Math.random() * 150000) + 20000; // 20k - 170k PKR
                const days = Math.floor(Math.random() * 10) + 2; // 2-12 days
                const travelType = travelTypes[Math.floor(Math.random() * travelTypes.length)];

                searches.push({
                    userId,
                    destination,
                    budget,
                    days,
                    travelType,
                    timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // Random within last 60 days
                });
            }

            if (searches.length > 0) {
                await searchHistoryCollection.insertMany(searches);
                totalSearches += searches.length;
            }

            // Create saved trips
            const trips = [];
            for (let i = 0; i < numTrips; i++) {
                const destination = destinations[Math.floor(Math.random() * destinations.length)];
                const budget = Math.floor(Math.random() * 150000) + 30000;
                const days = Math.floor(Math.random() * 10) + 3;
                const numActivities = Math.floor(Math.random() * 5) + 2;
                const selectedActivities = [];
                
                for (let j = 0; j < numActivities; j++) {
                    selectedActivities.push(activities[Math.floor(Math.random() * activities.length)]);
                }

                trips.push({
                    userId,
                    destination,
                    days,
                    budget,
                    travelType: travelTypes[Math.floor(Math.random() * travelTypes.length)],
                    activities: [...new Set(selectedActivities)], // Remove duplicates
                    hotels: [
                        {
                            name: `${destination} Hotel`,
                            rating: Math.floor(Math.random() * 2) + 3, // 3-5 stars
                            pricePerNight: Math.floor(Math.random() * 8000) + 2000
                        }
                    ],
                    totalCost: budget,
                    weather: {
                        condition: ['Sunny', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 3)],
                        temperature: Math.floor(Math.random() * 15) + 15 // 15-30°C
                    },
                    savedAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000), // Random within last 45 days
                    favorite: Math.random() > 0.7 // 30% chance of being favorite
                });
            }

            if (trips.length > 0) {
                await plansCollection.insertMany(trips);
                totalTrips += trips.length;
            }

            // Create testimonials
            const testimonialTexts = [
                'Had an amazing time! The scenery was breathtaking and the experience was unforgettable.',
                'Perfect destination for family vacation. Kids loved every moment of the trip.',
                'Budget-friendly and beautiful. Highly recommend visiting during summer season.',
                'The hospitality was incredible. Local people were very welcoming and friendly.',
                'Best trip of my life! The mountains, the valleys, everything was picture perfect.',
                'Great for adventure seekers. Plenty of hiking trails and outdoor activities.',
                'Peaceful and serene location. Perfect for getting away from city life.',
                'Food was delicious and accommodation was comfortable. Will definitely visit again!',
                'Photography heaven! Every corner is Instagram-worthy. Don\'t forget your camera.',
                'Well organized trip. The local guides were knowledgeable and very helpful.'
            ];

            const testimonials = [];
            for (let i = 0; i < numTestimonials; i++) {
                const destination = destinations[Math.floor(Math.random() * destinations.length)];
                const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
                
                testimonials.push({
                    userId,
                    userName: user.name,
                    userEmail: user.email,
                    userAvatar: null,
                    destination,
                    tripDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random within last 6 months
                    rating,
                    title: `${['Amazing', 'Wonderful', 'Great', 'Fantastic', 'Beautiful'][Math.floor(Math.random() * 5)]} experience in ${destination}`,
                    content: testimonialTexts[Math.floor(Math.random() * testimonialTexts.length)],
                    approved: Math.random() > 0.2, // 80% approval rate
                    featured: Math.random() > 0.85, // 15% featured rate
                    likes: Math.floor(Math.random() * 50),
                    likedBy: [],
                    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random within last 90 days
                    updatedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
                });
            }

            if (testimonials.length > 0) {
                await testimonialsCollection.insertMany(testimonials);
                totalTestimonials += testimonials.length;
            }

            console.log(`Seeded data for ${user.name}: ${numSearches} searches, ${numTrips} trips, ${numTestimonials} testimonials`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'User profiles seeded successfully',
                summary: {
                    users: createdUsers.length,
                    totalSearches,
                    totalTrips,
                    totalTestimonials
                },
                users: createdUsers.map(u => ({
                    name: u.name,
                    email: u.email,
                    password: 'password123',
                    userId: u.userId
                }))
            })
        };

    } catch (error) {
        console.error('Seed error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
