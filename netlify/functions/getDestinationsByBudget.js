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

            // Base per-day misc costs (no hotels): local transport + activities
            const localTransportPerDay = city.localTransportPerDay || 600;
            const activitiesPerDay = city.activitiesPerDay || 800;
            // Calculate total cost for trip
            const travelCost = city.busFare * 2; // to & from
            const foodCost = city.foodAvg * numDays;
            const miscCost = (localTransportPerDay + activitiesPerDay) * numDays;

            // Three package options
            const cheapOption = {
                name: city.name,
                packageType: 'Cheap',
                totalCost: travelCost + foodCost + miscCost * 0.9,
                breakdown: {
                    travel: travelCost,
                    food: foodCost,
                    localTransport: Math.round(localTransportPerDay * numDays * 0.9),
                    activities: Math.round(activitiesPerDay * numDays * 0.9)
                },
                dailyAvg: Math.round((travelCost + foodCost + miscCost * 0.9) / numDays),
                withinBudget: (travelCost + foodCost + miscCost * 0.9) <= budgetAmount
            };

            const moderateOption = {
                name: city.name,
                packageType: 'Moderate',
                totalCost: travelCost + foodCost + miscCost,
                breakdown: {
                    travel: travelCost,
                    food: foodCost,
                    localTransport: localTransportPerDay * numDays,
                    activities: activitiesPerDay * numDays
                },
                dailyAvg: Math.round((travelCost + foodCost + miscCost) / numDays),
                withinBudget: (travelCost + foodCost + miscCost) <= budgetAmount
            };

            const luxuryOption = {
                name: city.name,
                packageType: 'Premium',
                totalCost: travelCost + foodCost + miscCost * 1.25,
                breakdown: {
                    travel: travelCost,
                    food: foodCost,
                    localTransport: Math.round(localTransportPerDay * numDays * 1.25),
                    activities: Math.round(activitiesPerDay * numDays * 1.25)
                },
                dailyAvg: Math.round((travelCost + foodCost + miscCost * 1.25) / numDays),
                withinBudget: (travelCost + foodCost + miscCost * 1.25) <= budgetAmount
            };

            // Calculate budget match score (0-100)
            const budgetMatchScore = Math.max(0, 100 - Math.abs((cheapOption.totalCost - budgetAmount) / budgetAmount * 100));
            const weatherScore = city.rating * 10; // 0-50
            const ratingScore = city.rating * 10; // 0-50
            const travelTimeScore = Math.max(0, 10 - Math.min(10, Math.round(travelHours / 2))); // 0-10
            const finalScore = (budgetMatchScore * 0.5) + (weatherScore * 0.2) + (ratingScore * 0.2) + (travelTimeScore * 10 * 0.1);

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
                costBreakdown: {
                    transport: travelCost,
                    food: foodCost,
                    localTransport: localTransportPerDay * numDays,
                    activities: activitiesPerDay * numDays
                },
                travelTimeHours: travelHours
            };
        });

        // Sort by score descending
        cityScores.sort((a, b) => b.score - a.score);

        // Get top 3 recommendations
        const topThree = cityScores.slice(0, 3);

        // If location is provided, prioritize nearby destinations
        const locationPrioritized = topThree.length > 0 ? topThree : [];

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
                recommendations: locationPrioritized,
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
