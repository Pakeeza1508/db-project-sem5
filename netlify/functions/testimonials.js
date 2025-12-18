const { getCollection } = require('./_mongo');
const { ObjectId } = require('mongodb');

/**
 * Testimonials/Community Feed Management
 * Handles user testimonials displayed on main page and user profiles
 */
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const collection = await getCollection('testimonials');
        const params = event.queryStringParameters || {};

        // GET - Fetch testimonials
        if (event.httpMethod === 'GET') {
            const userId = params.userId;
            const testimonialId = params.testimonialId;
            const featured = params.featured === 'true';
            const limit = parseInt(params.limit) || 10;
            const skip = parseInt(params.skip) || 0;

            // Get single testimonial by ID
            if (testimonialId) {
                const testimonial = await collection.findOne({ 
                    _id: new ObjectId(testimonialId) 
                });
                
                if (!testimonial) {
                    return {
                        statusCode: 404,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            error: 'Testimonial not found' 
                        })
                    };
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        testimonial 
                    })
                };
            }

            // Build query
            let query = { approved: true }; // Only show approved by default
            
            if (userId) {
                query = { userId }; // User's own testimonials (all statuses)
            }
            
            if (featured) {
                query.featured = true;
            }

            // Fetch testimonials
            const testimonials = await collection
                .find(query)
                .sort({ featured: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            const total = await collection.countDocuments(query);

            // Get stats if requesting user's testimonials
            let stats = null;
            if (userId) {
                stats = {
                    total: await collection.countDocuments({ userId }),
                    approved: await collection.countDocuments({ userId, approved: true }),
                    pending: await collection.countDocuments({ userId, approved: false }),
                    featured: await collection.countDocuments({ userId, featured: true })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    testimonials,
                    total,
                    skip,
                    limit,
                    stats
                })
            };
        }

        // POST - Create new testimonial
        if (event.httpMethod === 'POST') {
            const data = JSON.parse(event.body);
            const { userId, userName, userEmail, destination, tripDate, rating, title, content, userAvatar } = data;

            // Validation
            if (!userId || !userName || !destination || !rating || !content) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Required fields: userId, userName, destination, rating, content' 
                    })
                };
            }

            if (rating < 1 || rating > 5) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Rating must be between 1 and 5' 
                    })
                };
            }

            if (content.length < 20) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Content must be at least 20 characters' 
                    })
                };
            }

            const testimonial = {
                userId,
                userName,
                userEmail: userEmail || null,
                userAvatar: userAvatar || null,
                destination,
                tripDate: tripDate || null,
                rating: parseInt(rating),
                title: title || null,
                content: content.trim(),
                approved: false, // Requires admin approval
                featured: false,
                likes: 0,
                likedBy: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await collection.insertOne(testimonial);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    testimonialId: result.insertedId,
                    message: 'Testimonial submitted successfully. Pending approval.'
                })
            };
        }

        // PUT - Update testimonial
        if (event.httpMethod === 'PUT') {
            const data = JSON.parse(event.body);
            const { testimonialId, userId, destination, tripDate, rating, title, content } = data;

            if (!testimonialId || !userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'testimonialId and userId required' 
                    })
                };
            }

            // Check ownership
            const existing = await collection.findOne({ 
                _id: new ObjectId(testimonialId),
                userId 
            });

            if (!existing) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Testimonial not found or unauthorized' 
                    })
                };
            }

            // Build update object
            const update = {
                updatedAt: new Date()
            };

            if (destination) update.destination = destination;
            if (tripDate) update.tripDate = tripDate;
            if (rating) {
                if (rating < 1 || rating > 5) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            success: false,
                            error: 'Rating must be between 1 and 5' 
                        })
                    };
                }
                update.rating = parseInt(rating);
            }
            if (title !== undefined) update.title = title;
            if (content) {
                if (content.length < 20) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            success: false,
                            error: 'Content must be at least 20 characters' 
                        })
                    };
                }
                update.content = content.trim();
                update.approved = false; // Re-submit for approval after edit
            }

            await collection.updateOne(
                { _id: new ObjectId(testimonialId) },
                { $set: update }
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Testimonial updated successfully'
                })
            };
        }

        // DELETE - Delete testimonial
        if (event.httpMethod === 'DELETE') {
            const testimonialId = params.testimonialId;
            const userId = params.userId;

            if (!testimonialId || !userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'testimonialId and userId required' 
                    })
                };
            }

            // Check ownership
            const result = await collection.deleteOne({ 
                _id: new ObjectId(testimonialId),
                userId 
            });

            if (result.deletedCount === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false,
                        error: 'Testimonial not found or unauthorized' 
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Testimonial deleted successfully'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Testimonials error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
