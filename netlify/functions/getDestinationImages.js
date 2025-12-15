const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { destination, count = 4 } = event.queryStringParameters || {};

    if (!destination) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'destination query parameter is required' })
        };
    }

    const unsplashKey = process.env.UNSPLASH_KEY;

    if (!unsplashKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'UNSPLASH_KEY environment variable is required' })
        };
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=${count}&order_by=relevant`,
            {
                headers: { Authorization: `Client-ID ${unsplashKey}` }
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.statusText}`);
        }

        const data = await response.json();

        const images = data.results.map(photo => ({
            url: photo.urls.regular,
            thumb: photo.urls.thumb,
            alt: photo.alt_description || destination,
            photographer: photo.user.name,
            link: photo.links.html
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                destination,
                images,
                total: images.length
            })
        };

    } catch (error) {
        console.error('Error fetching destination images:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch destination images',
                details: error.message
            })
        };
    }
};
