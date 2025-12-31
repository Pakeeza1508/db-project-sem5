const { getDb } = require('./_mongo');
const { ObjectId } = require('mongodb');

/**
 * Get personalized notifications for a user
 * Generates AI-powered notifications based on user activity
 */
exports.handler = async function (event, context) {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { userId } = event.queryStringParameters || {};
        
        if (!userId || userId === 'anonymous') {
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true, 
                    notifications: [],
                    count: 0
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            };
        }

        const db = await getDb();
        const notifications = [];

        // 1. Check for saved trips without reviews
        const unratedTrips = await db.collection('plans')
            .find({ 
                userId: userId,
                rating: { $exists: false },
                createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 1 day
            })
            .limit(3)
            .toArray();

        if (unratedTrips.length > 0) {
            notifications.push({
                id: `rate-trips-${Date.now()}`,
                type: 'suggestion',
                icon: 'star',
                title: '⭐ Rate Your Trips',
                message: `You have ${unratedTrips.length} trip${unratedTrips.length > 1 ? 's' : ''} waiting for your review! Help others by sharing your experience.`,
                action: 'my-trips.html',
                actionText: 'Review Now',
                timestamp: new Date(),
                read: false,
                priority: 'medium'
            });
        }

        // 2. Check recent search patterns for recommendations
        const recentSearches = await db.collection('searchHistory')
            .find({ userId: userId })
            .sort({ searchedAt: -1 })
            .limit(10)
            .toArray();

        if (recentSearches.length >= 3) {
            const budgetSearches = recentSearches.filter(s => s.searchType === 'budget-search');
            const destinations = recentSearches
                .filter(s => s.query)
                .map(s => s.query)
                .filter((v, i, a) => a.indexOf(v) === i); // unique

            if (budgetSearches.length >= 2) {
                notifications.push({
                    id: `budget-tip-${Date.now()}`,
                    type: 'tip',
                    icon: 'lightbulb',
                    title: '💡 Budget Travel Tip',
                    message: 'Based on your searches, consider traveling during off-peak seasons to save up to 40% on accommodation!',
                    timestamp: new Date(),
                    read: false,
                    priority: 'low'
                });
            }

            if (destinations.length >= 2) {
                notifications.push({
                    id: `compare-tip-${Date.now()}`,
                    type: 'feature',
                    icon: 'balance-scale',
                    title: '🔄 Compare Your Options',
                    message: `You've searched for ${destinations.slice(0, 2).join(' and ')}. Use Compare to see them side-by-side!`,
                    action: 'compare.html',
                    actionText: 'Compare Now',
                    timestamp: new Date(),
                    read: false,
                    priority: 'medium'
                });
            }
        }

        // 3. Check for price drop opportunities (mock AI recommendation)
        const userTrips = await db.collection('plans')
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        if (userTrips.length > 0) {
            const latestTrip = userTrips[0];
            const similarDestinations = ['Barcelona', 'Rome', 'Athens', 'Lisbon', 'Prague'];
            const randomSimilar = similarDestinations[Math.floor(Math.random() * similarDestinations.length)];
            
            notifications.push({
                id: `recommendation-${Date.now()}`,
                type: 'recommendation',
                icon: 'map-location-dot',
                title: '✨ You Might Like',
                message: `Based on your trip to ${latestTrip.destination}, you might enjoy ${randomSimilar}! Similar vibe, amazing culture.`,
                action: `planner.html?destination=${randomSimilar}`,
                actionText: 'Explore',
                timestamp: new Date(),
                read: false,
                priority: 'low'
            });
        }

        // 4. Check if user hasn't created a trip recently
        const lastTripDate = userTrips[0]?.createdAt;
        const daysSinceLastTrip = lastTripDate 
            ? Math.floor((Date.now() - new Date(lastTripDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        if (daysSinceLastTrip > 7) {
            notifications.push({
                id: `plan-reminder-${Date.now()}`,
                type: 'reminder',
                icon: 'wand-magic-sparkles',
                title: '🎯 Plan Your Next Adventure',
                message: 'It\'s been a while! The world is waiting. Where will your next journey take you?',
                action: 'planner.html',
                actionText: 'Start Planning',
                timestamp: new Date(),
                read: false,
                priority: 'high'
            });
        }

        // 5. Trending destination alert
        const trendingDests = await db.collection('trending_destinations')
            .find({})
            .sort({ popularity: -1 })
            .limit(3)
            .toArray();

        if (trendingDests.length > 0 && notifications.length < 5) {
            const trending = trendingDests[0];
            notifications.push({
                id: `trending-${Date.now()}`,
                type: 'trending',
                icon: 'fire',
                title: '🔥 Trending Now',
                message: `${trending.destination} is trending! ${trending.reason || 'Perfect time to visit with great deals available.'}`,
                action: `planner.html?destination=${trending.destination}`,
                actionText: 'Check It Out',
                timestamp: new Date(),
                read: false,
                priority: 'medium'
            });
        }

        // 6. Feature discovery - show features they haven't used
        const hasUsedCompare = await db.collection('searchHistory')
            .findOne({ userId: userId, searchType: 'compare' });
        
        if (!hasUsedCompare && userTrips.length >= 2 && notifications.length < 6) {
            notifications.push({
                id: `feature-compare-${Date.now()}`,
                type: 'feature',
                icon: 'lightbulb',
                title: '🆕 Did You Know?',
                message: 'You can compare multiple trips side-by-side to find the perfect match for your budget and style!',
                action: 'compare.html',
                actionText: 'Try Compare',
                timestamp: new Date(),
                read: false,
                priority: 'low'
            });
        }

        // Sort by priority (high > medium > low) and timestamp
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        notifications.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Limit to 6 notifications
        const limitedNotifications = notifications.slice(0, 6);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                notifications: limitedNotifications,
                count: limitedNotifications.length
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };

    } catch (error) {
        console.error('Error generating notifications:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to generate notifications',
                details: error.message 
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    }
};
