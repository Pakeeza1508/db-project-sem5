const { getCollection } = require('./_mongo');

// Hardcoded GPS coordinates for Pakistani cities as fallback
const cityCoordinates = {
    'Lahore': { lat: 31.5497, lng: 74.3436 },
    'Islamabad': { lat: 33.6844, lng: 73.0479 },
    'Karachi': { lat: 24.8607, lng: 67.0011 },
    'Rawalpindi': { lat: 33.5651, lng: 73.0169 },
    'Faisalabad': { lat: 31.4180, lng: 73.0790 },
    'Multan': { lat: 30.1575, lng: 71.5249 },
    'Peshawar': { lat: 34.0151, lng: 71.5249 },
    'Quetta': { lat: 30.1798, lng: 66.9750 },
    'Sialkot': { lat: 32.4927, lng: 74.5319 },
    'Gujranwala': { lat: 32.1877, lng: 74.1945 },
    'Murree': { lat: 33.9070, lng: 73.3903 },
    'Nathia Gali': { lat: 34.0778, lng: 73.3914 },
    'Hunza': { lat: 36.3167, lng: 74.6500 },
    'Skardu': { lat: 35.2978, lng: 75.6339 },
    'Naran': { lat: 34.9089, lng: 73.6556 },
    'Kaghan': { lat: 34.7904, lng: 73.4892 },
    'Swat': { lat: 35.2227, lng: 72.4258 },
    'Abbottabad': { lat: 34.1495, lng: 73.2167 },
    'Gilgit': { lat: 35.9208, lng: 74.3144 },
    'Chitral': { lat: 35.8513, lng: 71.7864 }
};

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
                name: { $regex: new RegExp(destination, 'i') } 
            });
            
            if (city && city.coordinates) {
                centerLat = city.coordinates.lat;
                centerLng = city.coordinates.lng;
                centerName = city.name;
            } else if (cityCoordinates[destination]) {
                // Fallback to hardcoded coordinates
                centerLat = cityCoordinates[destination].lat;
                centerLng = cityCoordinates[destination].lng;
                centerName = destination;
                console.log(`Using fallback coordinates for ${destination}`);
            } else {
                // If not found, try to find partial match in hardcoded list
                const matchingCity = Object.keys(cityCoordinates).find(city => 
                    city.toLowerCase().includes(destination.toLowerCase()) ||
                    destination.toLowerCase().includes(city.toLowerCase())
                );
                if (matchingCity) {
                    centerLat = cityCoordinates[matchingCity].lat;
                    centerLng = cityCoordinates[matchingCity].lng;
                    centerName = matchingCity;
                    console.log(`Using partial match coordinates for ${matchingCity}`);
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
                       city.name.toLowerCase() !== centerName.toLowerCase();
            })
            .sort((a, b) => a.distance - b.distance);

        // Get search popularity data
        const popularityData = await getDestinationPopularity(searchHistoryCollection);

        // Enhance cities with popularity scores
        const enhancedCities = nearbyCities.map(city => {
            const popularity = popularityData.find(
                p => p._id.toLowerCase() === city.name.toLowerCase()
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
            destination: city.name, // ensure destination field for frontend
            matchesPreferences: userPreferences.includes(city.name.toLowerCase())
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
