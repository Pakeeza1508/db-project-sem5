const { getCollection } = require('./_mongo');
const { ObjectId } = require('mongodb');

/**
 * Toggle like on a testimonial
 */
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { testimonialId, userId } = data;

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

        const collection = await getCollection('testimonials');

        // Check if testimonial exists
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

        // Check if user already liked
        const likedBy = testimonial.likedBy || [];
        const alreadyLiked = likedBy.includes(userId);

        let update;
        let message;

        if (alreadyLiked) {
            // Unlike
            update = {
                $inc: { likes: -1 },
                $pull: { likedBy: userId }
            };
            message = 'Like removed';
        } else {
            // Like
            update = {
                $inc: { likes: 1 },
                $addToSet: { likedBy: userId }
            };
            message = 'Liked successfully';
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(testimonialId) },
            update
        );

        // Get updated like count
        const updated = await collection.findOne({ 
            _id: new ObjectId(testimonialId) 
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message,
                liked: !alreadyLiked,
                likes: updated.likes || 0
            })
        };

    } catch (error) {
        console.error('Like testimonial error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to like testimonial',
                details: error.message 
            })
        };
    }
};
