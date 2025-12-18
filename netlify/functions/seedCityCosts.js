// Seed city costs to MongoDB - Run once via /.netlify/functions/seedCityCosts
const { getDb } = require('./_mongo');

const pakistaniCities = [
    {
        name: "Islamabad",
        avgPerDay: 4500,
        busFare: 600,
        hotelCheap: 2500,
        hotelModerate: 5000,
        hotelLuxury: 10000,
        foodAvg: 1500,
        rating: 4.5,
        attractions: "Margalla Hills, Faisal Mosque, Rawal Lake",
        weather: "Mild, pleasant",
        region: "North",
        bestMonths: ["March", "April", "October", "November"],
        avoidMonths: ["June", "July", "August"],
        seasonalWarning: "Avoid June-August: Extreme heat (40°C+). Best in spring and autumn."
    },
    {
        name: "Murree",
        avgPerDay: 5000,
        busFare: 1500,
        hotelCheap: 3000,
        hotelModerate: 6000,
        hotelLuxury: 12000,
        foodAvg: 1800,
        rating: 4.6,
        attractions: "Pine forests, Mall Road, Pindi Point",
        weather: "Cool, misty",
        region: "North",
        bestMonths: ["December", "January", "February", "March"],
        avoidMonths: ["July", "August"],
        seasonalWarning: "Avoid July-August: Heavy monsoon rain & extreme tourist rush. Roads can be dangerous."
    },
    {
        name: "Lahore",
        avgPerDay: 4000,
        busFare: 300,
        hotelCheap: 2000,
        hotelModerate: 4500,
        hotelLuxury: 9000,
        foodAvg: 1200,
        rating: 4.3,
        attractions: "Badshahi Mosque, Lahore Fort, Mall Road",
        weather: "Hot summers, mild winters",
        region: "Central",
        bestMonths: ["November", "December", "January", "February", "March"],
        avoidMonths: ["May", "June", "July"],
        seasonalWarning: "Avoid May-July: Extreme heat (45°C). Best in winter months for sightseeing."
    },
    {
        name: "Karachi",
        avgPerDay: 3800,
        busFare: 400,
        hotelCheap: 1800,
        hotelModerate: 4000,
        hotelLuxury: 8500,
        foodAvg: 1000,
        rating: 4.0,
        attractions: "Clifton Beach, Port Grand, National Museum",
        weather: "Hot, coastal breeze",
        region: "South",
        bestMonths: ["November", "December", "January", "February"],
        avoidMonths: ["May", "June"],
        seasonalWarning: "Avoid May-June: Extreme heat and humidity. Best in winter for beach visits."
    },
    {
        name: "Swat Valley",
        avgPerDay: 4200,
        busFare: 1200,
        hotelCheap: 2800,
        hotelModerate: 5500,
        hotelLuxury: 11000,
        foodAvg: 1400,
        rating: 4.7,
        attractions: "Mingora city, Kalam, Mahodand Lake",
        weather: "Cool summers, snowy winters",
        region: "North",
        bestMonths: ["April", "May", "September", "October"],
        avoidMonths: ["December", "January"],
        seasonalWarning: "Avoid Dec-Jan: Heavy snowfall, roads closed. Best in spring and autumn."
    },
    {
        name: "Gilgit",
        avgPerDay: 5500,
        busFare: 2500,
        hotelCheap: 3500,
        hotelModerate: 6500,
        hotelLuxury: 12500,
        foodAvg: 1800,
        rating: 4.8,
        attractions: "Hunza Valley, Silk Road, Fairy Meadows",
        weather: "Cold winters, mild summers",
        region: "North",
        bestMonths: ["April", "May", "June", "September"],
        avoidMonths: ["December", "January", "February"],
        seasonalWarning: "Avoid winter: Roads blocked by snow. Best Apr-Sep for mountain views."
    },
    {
        name: "Hunza",
        avgPerDay: 5200,
        busFare: 2000,
        hotelCheap: 3000,
        hotelModerate: 6000,
        hotelLuxury: 11500,
        foodAvg: 1600,
        rating: 4.9,
        attractions: "Attabad Lake, Altit Fort, Eagle's Nest",
        weather: "Cool, stunning mountain views",
        region: "North",
        bestMonths: ["March", "April", "May", "September", "October"],
        avoidMonths: ["January", "February"],
        seasonalWarning: "Avoid Jan-Feb: Extreme cold. Best in spring for apricot blossoms & autumn for colors."
    },
    
    {
        name: "Peshawar",
        avgPerDay: 3500,
        busFare: 400,
        hotelCheap: 1500,
        hotelModerate: 3500,
        hotelLuxury: 7500,
        foodAvg: 900,
        rating: 4.1,
        attractions: "Qissa Khwani Bazaar, Peshawar Museum",
        weather: "Hot summers, mild winters",
        region: "North"
    },
    {
        name: "Quetta",
        avgPerDay: 3600,
        busFare: 1500,
        hotelCheap: 1800,
        hotelModerate: 3800,
        hotelLuxury: 8000,
        foodAvg: 1000,
        rating: 3.9,
        attractions: "Balochistan geology, Hanna Lake",
        weather: "Cool mountain climate",
        region: "West"
    },
    {
        name: "Multan",
        avgPerDay: 3400,
        busFare: 600,
        hotelCheap: 1600,
        hotelModerate: 3500,
        hotelLuxury: 7500,
        foodAvg: 900,
        rating: 4.0,
        attractions: "Sufi Shrines, Tomb of Bahauddin Zakariya",
        weather: "Very hot summers",
        region: "South"
    },
    // Removed duplicate/misspelled "Sakardu" entry (use "Skardu" below)
    {
        name: "Chitral",
        avgPerDay: 4600,
        busFare: 1800,
        hotelCheap: 2800,
        hotelModerate: 5500,
        hotelLuxury: 10500,
        foodAvg: 1400,
        rating: 4.6,
        attractions: "Hindu Kush mountains, Tirich Mir",
        weather: "Cool mountain climate",
        region: "North"
    },
    {
        name: "Naran-Kaghan",
        avgPerDay: 4800,
        busFare: 1200,
        hotelCheap: 3000,
        hotelModerate: 5800,
        hotelLuxury: 11500,
        foodAvg: 1600,
        rating: 4.7,
        attractions: "Kunhar River, Lake Saif-ul-Malook",
        weather: "Cool summers, snowy winters",
        region: "North"
    },
    {
        name: "Taxila",
        avgPerDay: 3000,
        busFare: 300,
        hotelCheap: 1500,
        hotelModerate: 3000,
        hotelLuxury: 6500,
        foodAvg: 800,
        rating: 4.2,
        attractions: "Ancient ruins, Buddhist heritage",
        weather: "Mild, pleasant",
        region: "North"
    },
    {
        name: "Skardu",
        avgPerDay: 5800,
        busFare: 3500,
        hotelCheap: 4000,
        hotelModerate: 7200,
        hotelLuxury: 13500,
        foodAvg: 2000,
        rating: 4.9,
        attractions: "Deosai, Fairy Meadows, Shangrila",
        weather: "Very cold winters",
        region: "North"
    },
    {
        name: "Abbottabad",
        avgPerDay: 3800,
        busFare: 500,
        hotelCheap: 2000,
        hotelModerate: 4000,
        hotelLuxury: 8500,
        foodAvg: 1100,
        rating: 4.3,
        attractions: "Pakli Point, Ayubia National Park",
        weather: "Cool, pleasant",
        region: "North"
    },
    {
        name: "Mirpur Khas",
        avgPerDay: 3200,
        busFare: 800,
        hotelCheap: 1400,
        hotelModerate: 3000,
        hotelLuxury: 6500,
        foodAvg: 800,
        rating: 3.8,
        attractions: "Historical site, Sindhi culture",
        weather: "Hot, desert",
        region: "South"
    },
    {
        name: "Gujranwala",
        avgPerDay: 3300,
        busFare: 400,
        hotelCheap: 1600,
        hotelModerate: 3200,
        hotelLuxury: 7000,
        foodAvg: 900,
        rating: 3.9,
        attractions: "Manufacturing hub, Industrial tours",
        weather: "Hot summers",
        region: "Central"
    },
    {
        name: "Sialkot",
        avgPerDay: 3200,
        busFare: 500,
        hotelCheap: 1500,
        hotelModerate: 3000,
        hotelLuxury: 6500,
        foodAvg: 850,
        rating: 3.8,
        attractions: "Sports goods, Tanda Dam",
        weather: "Hot summers",
        region: "Central"
    }
];

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed. Use GET' })
        };
    }

    try {
        const db = await getDb();
        
        // Check if cities already exist
        const existingCount = await db.collection('cities').countDocuments();
        
        if (existingCount > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: `Cities already seeded (${existingCount} cities found)`,
                    count: existingCount
                })
            };
        }

        // Insert cities
        const result = await db.collection('cities').insertMany(pakistaniCities);
        
        console.log(`✅ Seeded ${result.insertedCount} cities to database`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Successfully seeded ${result.insertedCount} cities`,
                cities: result.insertedCount
            })
        };

    } catch (error) {
        console.error('Seed error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to seed cities',
                details: error.message
            })
        };
    }
};
