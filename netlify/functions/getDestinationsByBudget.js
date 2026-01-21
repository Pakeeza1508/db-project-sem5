// Get destinations by budget - Advanced GPS + AI hybrid algorithm
const { getDb } = require('./_mongo');

// Haversine formula to calculate distance between two GPS coordinates (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Major Pakistani cities GPS coordinates
const cityCoordinates = {
    "Lahore": { lat: 31.5497, lng: 74.3436 },
    "Islamabad": { lat: 33.6844, lng: 73.0479 },
    "Karachi": { lat: 24.8607, lng: 67.0011 },
    "Rawalpindi": { lat: 33.5651, lng: 73.0169 },
    "Faisalabad": { lat: 31.4504, lng: 73.1350 },
    "Multan": { lat: 30.1575, lng: 71.5249 },
    "Gujranwala": { lat: 32.1877, lng: 74.1945 },
    "Peshawar": { lat: 34.0151, lng: 71.5249 },
    "Quetta": { lat: 30.1798, lng: 66.9750 },
    "Sialkot": { lat: 32.4927, lng: 74.5319 },
    "Murree": { lat: 33.9070, lng: 73.3943 },
    "Naran": { lat: 34.9040, lng: 73.6533 },
    "Hunza": { lat: 36.3167, lng: 74.6500 },
    "Skardu": { lat: 35.2976, lng: 75.6333 },
    "Swat": { lat: 35.2227, lng: 72.4258 },
    "Gilgit": { lat: 35.9208, lng: 74.3080 },
    "Nathia Gali": { lat: 34.0761, lng: 73.3901 },
    "Sheikhupura": { lat: 31.7130, lng: 73.9851 },
    "Gujrat": { lat: 32.5740, lng: 74.0789 },
    "Bahawalpur": { lat: 29.3956, lng: 71.6836 }
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { budget, days, startingCity, travelType } = event.queryStringParameters || {};

        // Validation
        if (!budget || !days || !startingCity || !travelType) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Missing required parameters: budget, days, startingCity, travelType',
                    example: '?budget=50000&days=3&startingCity=Lahore&travelType=Solo'
                })
            };
        }

        const budgetAmount = parseInt(budget);
        const numDays = parseInt(days);

        if (isNaN(budgetAmount) || isNaN(numDays)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Budget and days must be numbers' })
            };
        }

        const db = await getDb();

        // Dynamic distance range based on trip duration
        let maxDistanceKm;
        if (numDays === 1) {
            maxDistanceKm = 100; // 1 day = max 100km (2-3 hours drive)
        } else if (numDays === 2) {
            maxDistanceKm = 200; // 2 days = max 200km (4-5 hours)
        } else if (numDays === 3) {
            maxDistanceKm = 400; // 3 days = max 400km (8 hours)
        } else {
            maxDistanceKm = 800; // 4+ days = anywhere in Pakistan
        }

        // Get starting city GPS coordinates
        const startCoords = cityCoordinates[startingCity];
        if (!startCoords) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Starting city "${startingCity}" not found in our database. Available cities: ${Object.keys(cityCoordinates).join(', ')}`
                })
            };
        }

        // Get all cities from database
        const cities = await db.collection('cities').find({}).toArray();

        if (cities.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'No cities found. Run /netlify/functions/seedCityCosts to seed data'
                })
            };
        }

        // Calculate distance and filter cities
        const cityScores = cities
            .map(city => {
                // Skip if this IS the starting city
                if (city.name === startingCity) {
                    return null;
                }

                // Get city GPS coordinates
                const destCoords = cityCoordinates[city.name];
                if (!destCoords) {
                    return null; // Skip cities without GPS data
                }

                // Calculate actual distance in km
                const distanceKm = calculateDistance(
                    startCoords.lat, startCoords.lng,
                    destCoords.lat, destCoords.lng
                );

                // Skip if too far for trip duration
                if (distanceKm > maxDistanceKm) {
                    return null;
                }

                // Calculate travel time (assume 60 km/h average with breaks)
                const travelHours = Math.ceil(distanceKm / 60);
                const travelDays = Math.ceil(travelHours / 8);

                // Is same-day trip possible? (<2 hours away)
                const isSameDayPossible = travelHours <= 2;
            
            // Base per-day misc costs (no hotels): local transport + activities
            const localTransportPerDay = city.localTransportPerDay || 600;
            const activitiesPerDay = city.activitiesPerDay || 800;
            
            // Calculate how many nights they can afford based on budget
            const travelCost = city.busFare * 2; // to & from
            const remainingBudget = budgetAmount - travelCost;
            
            // Calculate stay duration for different hotel types
            const calculateStayDuration = (hotelCost) => {
                if (remainingBudget <= 0) return 0;
                const dailyCost = hotelCost + city.foodAvg + localTransportPerDay + activitiesPerDay;
                return Math.floor(remainingBudget / dailyCost);
            };
            
            const cheapNights = calculateStayDuration(city.hotelCheap);
            const moderateNights = calculateStayDuration(city.hotelModerate);
            const luxuryNights = calculateStayDuration(city.hotelLuxury);

            // Three package options based on what they can actually afford
            const cheapOption = {
                name: city.name,
                packageType: 'Cheap',
                nights: cheapNights,
                hotelPerNight: city.hotelCheap,
                totalCost: travelCost + (city.hotelCheap * cheapNights) + (city.foodAvg * cheapNights) + (localTransportPerDay * cheapNights) + (activitiesPerDay * cheapNights),
                breakdown: {
                    travel: Math.round(travelCost),
                    hotel: Math.round(city.hotelCheap * cheapNights),
                    food: Math.round(city.foodAvg * cheapNights),
                    localTransport: Math.round(localTransportPerDay * cheapNights),
                    activities: Math.round(activitiesPerDay * cheapNights)
                },
                dailyAvg: Math.round((city.hotelCheap + city.foodAvg + localTransportPerDay + activitiesPerDay)),
                afffordableNights: cheapNights,
                recommendation: cheapNights > 0 ? `Stay ${cheapNights} nights with budget hotel` : 'Not affordable with this budget',
                withinBudget: (travelCost + (city.hotelCheap * cheapNights) + (city.foodAvg * cheapNights) + (localTransportPerDay * cheapNights) + (activitiesPerDay * cheapNights)) <= budgetAmount
            };

            const moderateOption = {
                name: city.name,
                packageType: 'Moderate',
                nights: moderateNights,
                hotelPerNight: city.hotelModerate,
                totalCost: travelCost + (city.hotelModerate * moderateNights) + (city.foodAvg * moderateNights) + (localTransportPerDay * moderateNights) + (activitiesPerDay * moderateNights),
                breakdown: {
                    travel: Math.round(travelCost),
                    hotel: Math.round(city.hotelModerate * moderateNights),
                    food: Math.round(city.foodAvg * moderateNights),
                    localTransport: Math.round(localTransportPerDay * moderateNights),
                    activities: Math.round(activitiesPerDay * moderateNights)
                },
                dailyAvg: Math.round((city.hotelModerate + city.foodAvg + localTransportPerDay + activitiesPerDay)),
                afffordableNights: moderateNights,
                recommendation: moderateNights > 0 ? `Stay ${moderateNights} nights with 3-star hotel` : 'Not affordable with this budget',
                withinBudget: (travelCost + (city.hotelModerate * moderateNights) + (city.foodAvg * moderateNights) + (localTransportPerDay * moderateNights) + (activitiesPerDay * moderateNights)) <= budgetAmount
            };

            const luxuryOption = {
                name: city.name,
                packageType: 'Premium',
                nights: luxuryNights,
                hotelPerNight: city.hotelLuxury,
                totalCost: travelCost + (city.hotelLuxury * luxuryNights) + (city.foodAvg * luxuryNights) + (localTransportPerDay * luxuryNights) + (activitiesPerDay * luxuryNights),
                breakdown: {
                    travel: Math.round(travelCost),
                    hotel: Math.round(city.hotelLuxury * luxuryNights),
                    food: Math.round(city.foodAvg * luxuryNights),
                    localTransport: Math.round(localTransportPerDay * luxuryNights),
                    activities: Math.round(activitiesPerDay * luxuryNights)
                },
                dailyAvg: Math.round((city.hotelLuxury + city.foodAvg + localTransportPerDay + activitiesPerDay)),
                afffordableNights: luxuryNights,
                recommendation: luxuryNights > 0 ? `Stay ${luxuryNights} nights with 5-star hotel` : 'Not affordable with this budget',
                withinBudget: (travelCost + (city.hotelLuxury * luxuryNights) + (city.foodAvg * luxuryNights) + (localTransportPerDay * luxuryNights) + (activitiesPerDay * luxuryNights)) <= budgetAmount
            };

                // Calculate budget match score (0-100)
                const budgetMatchScore = Math.max(0, 100 - Math.abs((cheapOption.totalCost - budgetAmount) / budgetAmount * 100));
                const weatherScore = city.rating * 10; // 0-50
                const ratingScore = city.rating * 10; // 0-50
                
                // Distance score: closer = higher score (0-100)
                const distanceScore = Math.max(0, 100 - (distanceKm / maxDistanceKm * 100));
                
                // Scoring weights based on distance
                let finalScore = (budgetMatchScore * 0.35) + (weatherScore * 0.15) + (ratingScore * 0.15) + (distanceScore * 0.35);
                
                // Boost for same-day trips if duration is 1 day
                if (numDays === 1 && isSameDayPossible) {
                    finalScore = finalScore * 1.2;
                }

                return {
                    city: city.name,
                    region: city.region,
                    attractions: city.attractions,
                    weather: city.weather,
                    rating: city.rating,
                    score: Math.round(finalScore),
                    distanceKm: Math.round(distanceKm),
                    distanceText: `${Math.round(distanceKm)} km away`,
                    cheap: cheapOption,
                    moderate: moderateOption,
                    luxury: luxuryOption,
                    availablePackages: {
                        cheap: cheapOption.withinBudget,
                        moderate: moderateOption.withinBudget,
                        luxury: luxuryOption.withinBudget
                    },
                    bestMonths: city.bestMonths || [],
                    avoidMonths: city.avoidMonths || [],
                    seasonalWarning: city.seasonalWarning || '',
                    travelInfo: {
                        travelHours: travelHours,
                        travelDays: travelDays,
                        busFare: city.busFare,
                        sameDayPossible: isSameDayPossible,
                        bestOption: isSameDayPossible && numDays === 1 ? 'Perfect for same-day trip' : `${travelDays} travel days needed`
                    },
                    costBreakdown: {
                        transport: Math.round(travelCost),
                        food: `Avg ${Math.round(city.foodAvg)}/day`,
                        localTransport: `Avg ${Math.round(localTransportPerDay)}/day`,
                        activities: `Avg ${Math.round(activitiesPerDay)}/day`
                    },
                    travelTimeHours: travelHours,
                    coordinates: destCoords
                };
            })
            .filter(city => city !== null); // Remove null entries (too far or same city)

        // Sort by score descending
        cityScores.sort((a, b) => b.score - a.score);

        // Get top 3 recommendations
        const topThree = cityScores.slice(0, 3);

        // Enhance with AI context and recommendations
        let aiEnhanced = topThree;
        try {
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const aiPrompt = `You are a travel expert for Pakistan. A traveler wants to visit from ${startingCity} with ${budgetAmount} PKR for ${numDays} days (${travelType} travel).

Database suggested these destinations:
${topThree.map((d, i) => `${i+1}. ${d.city} (Score: ${d.score}, Cost: ~${Math.round(d.moderate.totalCost)} PKR)`).join('\n')}

Provide:
1. Brief validation of each suggestion (1-2 sentences each)
2. Any practical tips for traveling from ${startingCity} (transport, timing, routes)
3. Any alternative destinations you'd recommend for this budget and duration

Keep response concise (max 150 words total). Format as JSON:
{
  "recommendations": [
    {"city": "CityName", "validation": "brief comment", "tip": "practical advice"}
  ],
  "alternatives": "brief alternatives if any",
  "overallAdvice": "quick summary"
}`;

            const aiResult = await model.generateContent(aiPrompt);
            const aiText = aiResult.response.text().replace(/```json|```/g, '').trim();
            const aiInsights = JSON.parse(aiText);

            // Merge AI insights with DB results
            aiEnhanced = topThree.map((dest, idx) => {
                const aiRec = aiInsights.recommendations?.[idx] || {};
                return {
                    ...dest,
                    aiValidation: aiRec.validation || null,
                    aiTip: aiRec.tip || null
                };
            });

            // Add overall AI advice
            if (aiInsights.overallAdvice || aiInsights.alternatives) {
                aiEnhanced.aiAdvice = {
                    overall: aiInsights.overallAdvice,
                    alternatives: aiInsights.alternatives
                };
            }

        } catch (aiError) {
            console.log('AI enhancement failed, using DB-only results:', aiError.message);
            // Fallback to DB-only results
        }

        console.log(`Budget: ${budgetAmount}PKR, Days: ${numDays}, Travel: ${travelType}, From: ${startingCity}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                input: {
                    budget: budgetAmount,
                    days: numDays,
                    startingCity: startingCity,
                    travelType: travelType
                },
                recommendations: aiEnhanced,
                totalCitiesAnalyzed: cities.length
            })
        };

    } catch (error) {
        console.error('Budget filter error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process budget request',
                details: error.message
            })
        };
    }
};
