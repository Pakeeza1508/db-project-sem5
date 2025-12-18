const { getCollection } = require('./_mongo');

/**
 * Get nearby popular destinations based on location
 * Uses Haversine formula to calculate distances
 */
exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const params = event.queryStringParameters || {};
        const destination = params.destination;
        const lat = parseFloat(params.lat);
        const lng = parseFloat(params.lng);
        const radius = parseInt(params.radius) || 300; // Default 300 km
        const limit = parseInt(params.limit) || 5;
        const userId = params.userId || 'anonymous';

        if (!destination && (!lat || !lng)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: 'Destination name or coordinates (lat, lng) required' 
                })
            };
        }

        const citiesCollection = await getCollection('cities');
        const searchHistoryCollection = await getCollection('searchHistory');

        let centerLat = lat;
        let centerLng = lng;
        let centerName = destination;

        // If only destination name provided, find coordinates
        if (!lat || !lng) {
            const city = await citiesCollection.findOne({ 
                destination: { $regex: new RegExp(destination, 'i') } 
            });
            
            if (city && city.coordinates) {
                centerLat = city.coordinates.lat;
                centerLng = city.coordinates.lng;
                centerName = city.destination;
            } else {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Destination coordinates not found' 
                    })
                };
            }
        }

        // Get all cities with coordinates
        const allCities = await citiesCollection.find({
            'coordinates.lat': { $exists: true },
            'coordinates.lng': { $exists: true }
        }).toArray();

        // Calculate distances and filter by radius
        const nearbyCities = allCities
            .map(city => {
                const distance = calculateDistance(
                    centerLat, 
                    centerLng, 
                    city.coordinates.lat, 
                    city.coordinates.lng
                );
                
                return {
                    ...city,
                    distance: Math.round(distance),
                    distanceText: formatDistance(distance)
                };
            })
            .filter(city => {
                // Exclude the center destination itself
                return city.distance > 0 && 
                       city.distance <= radius &&
                       city.destination.toLowerCase() !== centerName.toLowerCase();
            })
            .sort((a, b) => a.distance - b.distance);

        // Get search popularity data
        const popularityData = await getDestinationPopularity(searchHistoryCollection);

        // Enhance cities with popularity scores
        const enhancedCities = nearbyCities.map(city => {
            const popularity = popularityData.find(
                p => p._id.toLowerCase() === city.destination.toLowerCase()
            );
            
            return {
                ...city,
                searchCount: popularity ? popularity.count : 0,
                popularityScore: calculatePopularityScore(city, popularity)
            };
        });

        // Sort by popularity score (combines distance and search count)
        const sortedCities = enhancedCities.sort((a, b) => {
            return b.popularityScore - a.popularityScore;
        });

        // Get top N suggestions
        const suggestions = sortedCities.slice(0, limit);

        // Get user's most searched destinations for personalization
        const userTopDestinations = await searchHistoryCollection
            .aggregate([
                { $match: { userId, searchType: { $in: ['budget-search', 'planner', 'destination'] } } },
                { $unwind: '$results' },
                { $group: { _id: '$results', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 3 }
            ])
            .toArray();

        // Check if any suggestions match user preferences
        const userPreferences = userTopDestinations.map(d => d._id.toLowerCase());
        const personalizedSuggestions = suggestions.map(city => ({
            ...city,
            matchesPreferences: userPreferences.includes(city.destination.toLowerCase())
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                center: {
                    destination: centerName,
                    lat: centerLat,
                    lng: centerLng
                },
                radius: radius,
                total: nearbyCities.length,
                suggestions: personalizedSuggestions,
                userPreferences: userTopDestinations.map(d => d._id)
            })
        };

    } catch (error) {
        console.error('Nearby destinations error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to fetch nearby destinations',
                details: error.message 
            })
        };
    }
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
function formatDistance(km) {
    if (km < 1) {
        return Math.round(km * 1000) + ' m';
    } else if (km < 10) {
        return km.toFixed(1) + ' km';
    } else {
        return Math.round(km) + ' km';
    }
}

/**
 * Get destination popularity from search history
 */
async function getDestinationPopularity(collection) {
    try {
        const popularity = await collection.aggregate([
            {
                $match: {
                    searchType: { $in: ['budget-search', 'planner', 'destination'] },
                    results: { $exists: true, $ne: null }
                }
            },
            { $unwind: '$results' },
            {
                $group: {
                    _id: '$results',
                    count: { $sum: 1 },
                    lastSearched: { $max: '$searchedAt' }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        return popularity;
    } catch (error) {
        console.error('Failed to get popularity:', error);
        return [];
    }
}

/**
 * Calculate popularity score
 * Combines distance (closer = better) and search count (more = better)
 */
function calculatePopularityScore(city, popularity) {
    // Base score from search count (0-100)
    const searchScore = popularity ? Math.min(popularity.count * 10, 100) : 0;
    
    // Distance penalty (closer = higher score)
    // Max distance is typically 300km, so score decreases linearly
    const distanceScore = Math.max(100 - (city.distance / 3), 0);
    
    // Recency bonus if searched in last 7 days
    let recencyBonus = 0;
    if (popularity && popularity.lastSearched) {
        const daysSinceSearch = (Date.now() - new Date(popularity.lastSearched)) / (1000 * 60 * 60 * 24);
        if (daysSinceSearch <= 7) {
            recencyBonus = 20;
        } else if (daysSinceSearch <= 30) {
            recencyBonus = 10;
        }
    }
    
    // Weighted combination
    // 40% search popularity, 50% proximity, 10% recency
    const finalScore = (searchScore * 0.4) + (distanceScore * 0.5) + recencyBonus;
    
    return Math.round(finalScore);
}
