// Get destinations by budget - Backend filtering algorithm
const { getDb } = require('./_mongo');

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

        // Get all cities EXCEPT the starting city
        const cities = await db.collection('cities').find({
            name: { $ne: startingCity } // Exclude starting city
        }).toArray();

        if (cities.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'No cities found. Run /netlify/functions/seedCityCosts to seed data'
                })
            };
        }

        // Get starting city info for distance calculation
        const startCity = await db.collection('cities').findOne({ name: startingCity });
        const startRegion = startCity?.region || 'Central';

        // Calculate cost for each city and create score
        const cityScores = cities.map(city => {
            // Calculate travel time based on region proximity
            let travelHours = 6; // default
            
            // Same region = shorter travel
            if (city.region === startRegion) {
                travelHours = 2; // 2 hours within same region
            } else {
                // Different regions - estimate based on regions
                const regionDistances = {
                    'Central-North': 5,
                    'Central-South': 18,
                    'Central-West': 7,
                    'North-South': 20,
                    'North-West': 12,
                    'South-West': 8
                };
                const key = [startRegion, city.region].sort().join('-');
                travelHours = regionDistances[key] || 8;
            }
            
            const travelDays = Math.ceil(travelHours / 8); // 8 hours driving = 1 travel day

            // For 1-day trips, same region OR <3 hours away
            const isSameDayPossible = travelHours <= 3;
            
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
            
            // Travel time score: closer = higher score (0-100)
            const travelTimeScore = Math.max(0, 100 - (travelHours * 5));
            
            // Scoring weights - travel time is MORE important now
            let finalScore = (budgetMatchScore * 0.3) + (weatherScore * 0.15) + (ratingScore * 0.15) + (travelTimeScore * 0.4);
            
            // For 1-day trips: ONLY show same-day possible cities
            if (numDays === 1) {
                if (isSameDayPossible) {
                    finalScore = finalScore * 1.3; // Boost for feasible 1-day trips
                } else {
                    finalScore = finalScore * 0.1; // Heavily penalize distant cities for 1-day trips
                }
            }
            
            // For multi-day trips: slightly prefer closer destinations
            if (numDays >= 2 && numDays <= 3 && travelHours > 10) {
                finalScore = finalScore * 0.7; // Reduce score for very distant places on short trips
            }

            return {
                city: city.name,
                region: city.region,
                attractions: city.attractions,
                weather: city.weather,
                rating: city.rating,
                score: Math.round(finalScore),
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
                travelTimeHours: travelHours
            };
        });

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
