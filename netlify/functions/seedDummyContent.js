const { getDb } = require('./_mongo');

// Seed dummy testimonials, saved trips, and trending destinations for homepage demo
exports.handler = async () => {
  try {
    const db = await getDb();

    const testimonials = db.collection('testimonials');
    const savedTrips = db.collection('savedTrips');
    const trendingDestinations = db.collection('trendingDestinations');

    // --- Seed Testimonials ---
    const testimonialDocs = [
      {
        userId: 'demo-user@example.com',
        userName: 'Ayesha Khan',
        userEmail: 'demo-user@example.com',
        userAvatar: 'https://ui-avatars.com/api/?name=Ayesha+Khan&background=3b82f6&color=fff&size=200',
        destination: 'Hunza Valley, Pakistan',
        tripDate: '2024-07',
        rating: 5,
        title: 'Breathtaking views and friendly locals',
        content: 'Hunza blew my mind. The people are kind, the food is fresh, and every corner is photo-worthy. Take the Eagle Nest hike for sunrise!',
        approved: true,
        featured: true,
        likes: 12,
        likedBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
      },
      {
        userId: 'demo-user@example.com',
        userName: 'Bilal Ahmad',
        userEmail: 'demo-user@example.com',
        userAvatar: 'https://ui-avatars.com/api/?name=Bilal+Ahmad&background=22c55e&color=fff&size=200',
        destination: 'Murree, Pakistan',
        tripDate: '2024-12',
        rating: 4,
        title: 'Great winter escape',
        content: 'Snowfall made it magical. Book early for decent room rates. Mall Road gets crowded; hit Patriata for quieter views.',
        approved: true,
        featured: false,
        likes: 6,
        likedBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      },
      {
        userId: 'demo-user@example.com',
        userName: 'Sara Malik',
        userEmail: 'demo-user@example.com',
        userAvatar: 'https://ui-avatars.com/api/?name=Sara+Malik&background=f97316&color=fff&size=200',
        destination: 'Skardu, Pakistan',
        tripDate: '2024-09',
        rating: 5,
        title: 'Heaven for trekkers',
        content: 'Deosai plains were unreal. Budget 2 extra days for weather swings. Pack layers and rent a 4x4 for rough roads.',
        approved: true,
        featured: true,
        likes: 18,
        likedBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18)
      },
      {
        userId: 'demo2@example.com',
        userName: 'Zainab Hussain',
        userEmail: 'demo2@example.com',
        userAvatar: 'https://ui-avatars.com/api/?name=Zainab+Hussain&background=a855f7&color=fff&size=200',
        destination: 'Naran Kaghan',
        tripDate: '2024-08',
        rating: 5,
        title: 'Best summer getaway',
        content: 'Lake Saif ul Malook is mesmerizing! Go early morning to avoid crowds. The jeep ride is bumpy but totally worth it.',
        approved: true,
        featured: false,
        likes: 9,
        likedBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
      },
      {
        userId: 'demo3@example.com',
        userName: 'Ahmed Raza',
        userEmail: 'demo3@example.com',
        userAvatar: 'https://ui-avatars.com/api/?name=Ahmed+Raza&background=ec4899&color=fff&size=200',
        destination: 'Fairy Meadows',
        tripDate: '2024-06',
        rating: 5,
        title: 'Nanga Parbat view was incredible',
        content: 'Trek is moderate but stunning views. Camp overnight for sunrise over Nanga Parbat. Pack warm clothes even in summer!',
        approved: true,
        featured: true,
        likes: 21,
        likedBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22)
      },
      {
        userId: 'demo4@example.com',
        userName: 'Fatima Ali',
        userEmail: 'demo4@example.com',
        userAvatar: 'https://ui-avatars.com/api/?name=Fatima+Ali&background=14b8a6&color=fff&size=200',
        destination: 'Swat Valley',
        tripDate: '2024-05',
        rating: 4,
        title: 'Switzerland of Pakistan',
        content: 'Lush green valleys and crystal clear streams. Visit Malam Jabba for skiing. Try the local honey and walnuts!',
        approved: true,
        featured: false,
        likes: 14,
        likedBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
      }
    ];

    for (const t of testimonialDocs) {
      await testimonials.updateOne(
        { userId: t.userId, title: t.title, destination: t.destination },
        { $set: t },
        { upsert: true }
      );
    }

    // --- Seed Saved Trips ---
    const tripDocs = [
      {
        userId: 'demo-user@example.com',
        userName: 'Demo User',
        userEmail: 'demo-user@example.com',
        destination: 'Hunza Valley',
        days: 5,
        travelStyle: 'Adventure',
        budget: 'Moderate',
        preferences: 'Hiking, local food, photography',
        tripPlan: '### Day 1: Arrival in Karimabad\nCheck-in, sunset at Eagle Nest\n\n### Day 2: Baltit & Altit Forts\nGuided tour, evening chai at Cafe de Hunza\n\n### Day 3: Attabad Lake & Gulmit\nBoating, Passu Cones viewpoint\n\n### Day 4: Hoper Glacier\nLight trek, picnic lunch, apricot soup\n\n### Day 5: Shopping & Departure\nDry fruits, handmade caps, departure',
        weatherInfo: { temperature: 18, description: 'Partly cloudy' },
        costBreakdown: { accommodation: 32000, transportation: 18000, food: 12000, activities: 8000, total: 70000 },
        nearbyPlaces: [
          { name: 'Naltar Valley', distance: 85, distanceText: '85 km', popularityScore: 92 },
          { name: 'Khunjerab Pass', distance: 110, distanceText: '110 km', popularityScore: 88 }
        ],
        isShared: true,
        shareToken: 'DEMOHUNZA1234',
        savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      },
      {
        userId: 'demo-user@example.com',
        userName: 'Demo User',
        userEmail: 'demo-user@example.com',
        destination: 'Murree & Patriata',
        days: 3,
        travelStyle: 'Relaxation',
        budget: 'Budget',
        preferences: 'Cozy stays, short walks',
        tripPlan: '### Day 1: Mall Road & Kashmir Point\nCafe stop, chairlift ride\n\n### Day 2: Patriata (New Murree)\nCable car, forest walk\n\n### Day 3: Ayubia Track\nShort trail, lunch, return',
        weatherInfo: { temperature: 6, description: 'Snow showers' },
        costBreakdown: { accommodation: 12000, transportation: 8000, food: 6000, activities: 4000, total: 30000 },
        nearbyPlaces: [
          { name: 'Ayubia', distance: 35, distanceText: '35 km', popularityScore: 74 },
          { name: 'Nathia Gali', distance: 40, distanceText: '40 km', popularityScore: 78 }
        ],
        isShared: false,
        shareToken: 'DEMOMURREE12',
        savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      }
    ];

    for (const trip of tripDocs) {
      await savedTrips.updateOne(
        { userId: trip.userId, destination: trip.destination, days: trip.days },
        { $set: trip },
        { upsert: true }
      );
    }

    // --- Seed Trending Destinations ---
    const trendingDocs = [
      {
        name: 'Hunza Valley',
        region: 'Gilgit-Baltistan',
        image: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=800',
        description: 'Majestic mountain valley with stunning landscapes',
        popularity: 95,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      },
      {
        name: 'Skardu',
        region: 'Gilgit-Baltistan',
        image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
        description: 'Gateway to K2 and home to stunning lakes',
        popularity: 92,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
      },
      {
        name: 'Fairy Meadows',
        region: 'Gilgit-Baltistan',
        image: 'https://images.unsplash.com/photo-1571172964548-7cfcc72d0d2d?w=800',
        description: 'Alpine meadow with views of Nanga Parbat',
        popularity: 88,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8)
      },
      {
        name: 'Naran Kaghan',
        region: 'Khyber Pakhtunkhwa',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        description: 'Scenic valley with Lake Saif ul Malook',
        popularity: 90,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6)
      },
      {
        name: 'Swat Valley',
        region: 'Khyber Pakhtunkhwa',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        description: 'The Switzerland of Pakistan',
        popularity: 85,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)
      },
      {
        name: 'Murree',
        region: 'Punjab',
        image: 'https://images.unsplash.com/photo-1483086431886-3590a88317fe?w=800',
        description: 'Popular hill station near Islamabad',
        popularity: 82,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
      }
    ];

    for (const dest of trendingDocs) {
      await trendingDestinations.updateOne(
        { name: dest.name, region: dest.region },
        { $set: dest },
        { upsert: true }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Dummy data seeded: 6 testimonials, 2 saved trips, 6 trending destinations.' 
      })
    };
  } catch (error) {
    console.error('Seed dummy content failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
