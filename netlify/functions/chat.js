// AI Chat Assistant Endpoint
const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { message } = JSON.parse(event.body || '{}');

        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const geminiKey = process.env.GEMINI_KEY;

        if (!geminiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'GEMINI_KEY not configured',
                    reply: "I'm currently offline. Please contact support to enable the AI assistant."
                })
            };
        }

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`;
        
        const prompt = `You are Wanderly AI, a friendly and knowledgeable travel assistant. Help users with:
- Trip planning and destination recommendations
- Travel tips and advice
- Budget suggestions
- Activity recommendations
- Cultural information
- General travel questions

Keep responses concise (2-4 sentences), friendly, and helpful. Use emojis occasionally.

User: ${message}
Assistant:`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Gemini API Error:', error);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    reply: "I'm having trouble connecting right now. Please try asking in a different way!"
                })
            };
        }

        const data = await response.json();
        
        let reply = "I'm here to help! Could you rephrase your question?";
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            reply = data.candidates[0].content.parts[0].text.trim();
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                reply: reply
            })
        };

    } catch (error) {
        console.error('Chat error:', error);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                reply: "Oops! Something went wrong. Let's try that again! 🤖"
            })
        };
    }
};
