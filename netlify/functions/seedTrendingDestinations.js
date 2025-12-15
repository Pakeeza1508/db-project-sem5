const { getDb } = require('./_mongo');

exports.handler = async (event) => {
  try {
    const db = await getDb();
    
    // Check if trending destinations already exist
    const count = await db.collection('trendingDestinations').countDocuments();
    
    if (count > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Trending destinations already seeded', count })
      };
    }

    const trendingDestinations = [
      {
        name: 'Paris',
        country: 'France',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g187147-Paris_Ile_de_France-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'Tokyo',
        country: 'Japan',
        imageUrl: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g298184-Tokyo_Tokyo_Prefecture_Kanto-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'New York',
        country: 'USA',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1661954654458-c673671d4a08?fm=jpg&q=60&w=3000',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g60763-New_York_City_New_York-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'Dubai',
        country: 'UAE',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1697729914552-368899dc4757?fm=jpg&q=60&w=3000',
        tripadvisorUrl: 'https://www.tripadvisor.com/Attractions-g295424-Activities-Dubai_Emirate_of_Dubai.html',
        createdAt: new Date()
      },
      {
        name: 'Bali',
        country: 'Indonesia',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1661955632358-85564b2810b2?fm=jpg&q=60&w=3000',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g294226-Bali-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'London',
        country: 'UK',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsiZdKRc2vMZAr_S5C_zXVmpiKTRBURQq2ww&s',
        tripadvisorUrl: 'https://www.tripadvisor.com/Attractions-g186338-Activities-London_England.html',
        createdAt: new Date()
      },
      {
        name: 'Barcelona',
        country: 'Spain',
        imageUrl: 'https://images.unsplash.com/photo-1578912996078-305d92249aa6?fm=jpg&q=60&w=3000',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g187497-Barcelona_Catalonia-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'Istanbul',
        country: 'Turkey',
        imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?fm=jpg&q=60&w=3000',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g293974-Istanbul-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'Rome',
        country: 'Italy',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSEGU0dziDhooaTJthNzNiQ_Rp9k9FZK2whQ&s',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g187791-Rome_Lazio-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'Sydney',
        country: 'Australia',
        imageUrl: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?fm=jpg&q=60&w=3000',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g255060-Sydney_New_South_Wales-Vacations.html',
        createdAt: new Date()
      },
      {
        name: 'Singapore',
        country: 'Singapore',
        imageUrl: 'https://images.unsplash.com/photo-1600664356348-10686526af4f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2luZ2Fwb3JlfGVufDB8fDB8fHww',
        tripadvisorUrl: 'https://www.tripadvisor.com/Tourism-g294265-Singapore-Vacations.html',
        createdAt: new Date()
      }
    ];

    const result = await db.collection('trendingDestinations').insertMany(trendingDestinations);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Trending destinations seeded successfully', 
        insertedCount: result.insertedCount 
      })
    };
  } catch (error) {
    console.error('Error seeding trending destinations:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to seed trending destinations', details: error.message }) };
  }
};
