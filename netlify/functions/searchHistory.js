const { getDb } = require('./_mongo');

/**
 * Manage user search history
 * POST: Save a search
 * GET: Get user's search history
 * DELETE: Clear search history
 */
exports.handler = async function (event, context) {
    const method = event.httpMethod;

    try {
        const db = await getDb();
        const searchHistoryCollection = db.collection('searchHistory');

        if (method === 'POST') {
            // Save new search
            const body = JSON.parse(event.body);
            return await saveSearch(searchHistoryCollection, body);
        } else if (method === 'GET') {
            // Get user's search history
            const { userId, searchType, limit = 20 } = event.queryStringParameters || {};
            return await getSearchHistory(searchHistoryCollection, userId, searchType, parseInt(limit));
        } else if (method === 'DELETE') {
            // Clear search history
            const { userId, searchId } = event.queryStringParameters || {};
            return await deleteSearchHistory(searchHistoryCollection, userId, searchId);
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            };
        }

    } catch (error) {
        console.error('Search history error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to manage search history', details: error.message }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};

/**
 * Save a new search to history
 */
async function saveSearch(collection, data) {
    const {
        userId,
        searchType, // 'budget-search', 'planner', 'location', 'destination'
        query,
        filters,
        results,
        resultCount
    } = data;

    if (!userId || !searchType) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId and searchType are required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    const searchEntry = {
        userId: userId,
        searchType: searchType,
        query: query || null,
        filters: filters || {},
        results: results || null,
        resultCount: resultCount || 0,
        searchedAt: new Date(),
        source: 'web'
    };

    const result = await collection.insertOne(searchEntry);

    // Keep only last 100 searches per user (cleanup)
    const userSearches = await collection
        .find({ userId: userId })
        .sort({ searchedAt: -1 })
        .skip(100)
        .toArray();

    if (userSearches.length > 0) {
        const oldIds = userSearches.map(s => s._id);
        await collection.deleteMany({ _id: { $in: oldIds } });
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            message: 'Search saved to history',
            searchId: result.insertedId
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}

/**
 * Get user's search history
 */
async function getSearchHistory(collection, userId, searchType, limit) {
    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId is required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    const query = { userId: userId };
    if (searchType) {
        query.searchType = searchType;
    }

    const history = await collection
        .find(query)
        .sort({ searchedAt: -1 })
        .limit(limit)
        .toArray();

    // Group by search type
    const grouped = {
        budgetSearches: history.filter(h => h.searchType === 'budget-search'),
        plannerSearches: history.filter(h => h.searchType === 'planner'),
        locationSearches: history.filter(h => h.searchType === 'location'),
        destinationSearches: history.filter(h => h.searchType === 'destination')
    };

    // Get statistics
    const stats = {
        totalSearches: history.length,
        budgetSearchCount: grouped.budgetSearches.length,
        plannerSearchCount: grouped.plannerSearches.length,
        locationSearchCount: grouped.locationSearches.length,
        destinationSearchCount: grouped.destinationSearches.length,
        mostSearchedDestinations: await getMostSearchedDestinations(collection, userId),
        recentSearchTypes: grouped
    };

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            history: history,
            grouped: grouped,
            stats: stats
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}

/**
 * Delete search history
 */
async function deleteSearchHistory(collection, userId, searchId) {
    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId is required' }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }

    let result;
    if (searchId) {
        // Delete specific search
        const { ObjectId } = require('mongodb');
        result = await collection.deleteOne({ _id: new ObjectId(searchId), userId: userId });
    } else {
        // Clear all history for user
        result = await collection.deleteMany({ userId: userId });
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            message: searchId ? 'Search deleted' : 'Search history cleared',
            deletedCount: result.deletedCount
        }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
}

/**
 * Get most searched destinations for a user
 */
async function getMostSearchedDestinations(collection, userId) {
    const searches = await collection
        .find({ 
            userId: userId,
            $or: [
                { searchType: 'budget-search' },
                { searchType: 'planner' },
                { searchType: 'destination' }
            ]
        })
        .toArray();

    const destinationCounts = {};
    
    searches.forEach(search => {
        let destination = null;
        
        if (search.filters?.destination) {
            destination = search.filters.destination;
        } else if (search.filters?.startingCity) {
            destination = search.filters.startingCity;
        } else if (search.query) {
            destination = search.query;
        }

        if (destination) {
            destinationCounts[destination] = (destinationCounts[destination] || 0) + 1;
        }
    });

    // Sort by count and return top 5
    return Object.entries(destinationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([destination, count]) => ({ destination, count }));
}
