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

        // Get all cities
        const cities = await db.collection('cities').find({}).toArray();

        if (cities.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: 'No cities found. Run /netlify/functions/seedCityCosts to seed data'
                })
            };
        }

        // Calculate cost for each city and create score
        const cityScores = cities.map(city => {
            // Simple region-based travel time estimate (hours)
            const regionTimeMap = { North: 10, Central: 4, South: 6, West: 8 };
            const travelHours = regionTimeMap[city.region] || 6;
            const travelDays = Math.ceil(travelHours / 6); // Assume 6 hours driving = 1 travel day

            // For 1-day trips, only recommend Lahore & nearby cities (Central region)
            const isSameDayPossible = city.region === "Central" || city.name === "Lahore";
            
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
            const travelTimeScore = Math.max(0, 10 - Math.min(10, Math.round(travelHours / 2))); // 0-10
            
            // Boost score for same-day trips if only 1 day
            let finalScore = (budgetMatchScore * 0.5) + (weatherScore * 0.2) + (ratingScore * 0.2) + (travelTimeScore * 10 * 0.1);
            if (numDays === 1 && isSameDayPossible) {
                finalScore = finalScore * 1.5; // 50% boost for doable same-day trips
            } else if (numDays === 1 && !isSameDayPossible) {
                finalScore = finalScore * 0.5; // Reduce score for distant places on 1-day trips
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
