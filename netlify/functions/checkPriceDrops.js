const { getDb } = require('./_mongo');

/**
 * Scheduled function to check for price drops and trigger alerts
 * This should be called daily via Netlify scheduled functions
 */
exports.handler = async function (event, context) {
    try {
        const db = await getDb();
        const alertsCollection = db.collection('alerts');
        const priceHistoryCollection = db.collection('priceHistory');

        // Get all active alerts
        const activeAlerts = await alertsCollection.find({ 
            active: true, 
            triggered: false 
        }).toArray();

        console.log(`Checking ${activeAlerts.length} active alerts...`);

        const triggeredAlerts = [];
        const checkedAlerts = [];

        for (const alert of activeAlerts) {
            // Get latest price for this destination
            const latestPrice = await priceHistoryCollection
                .findOne(
                    { 
                        destination: { $regex: new RegExp(alert.destination, 'i') },
                        days: alert.days 
                    },
                    { sort: { recordedAt: -1 } }
                );

            if (!latestPrice) {
                console.log(`No price data for ${alert.destination}`);
                continue;
            }

            // Check if price has dropped below threshold
            const priceDrop = ((alert.currentPrice - latestPrice.totalCost) / alert.currentPrice) * 100;

            // Update last checked time
            await alertsCollection.updateOne(
                { _id: alert._id },
                { $set: { lastChecked: new Date() } }
            );

            checkedAlerts.push({
                destination: alert.destination,
                currentPrice: alert.currentPrice,
                latestPrice: latestPrice.totalCost,
                priceDrop: priceDrop.toFixed(2)
            });

            // If price dropped by threshold or more, trigger alert
            if (priceDrop >= alert.alertThreshold) {
                const notification = {
                    message: `🎉 Price Alert! ${alert.destination} trip cost dropped by ${priceDrop.toFixed(1)}%`,
                    oldPrice: alert.currentPrice,
                    newPrice: latestPrice.totalCost,
                    savings: (alert.currentPrice - latestPrice.totalCost).toFixed(2),
                    triggeredAt: new Date()
                };

                // Update alert as triggered and add notification
                await alertsCollection.updateOne(
                    { _id: alert._id },
                    { 
                        $set: { 
                            triggered: true,
                            triggeredAt: new Date(),
                            latestPrice: latestPrice.totalCost,
                            priceDrop: priceDrop
                        },
                        $push: { notifications: notification }
                    }
                );

                triggeredAlerts.push({
                    alertId: alert._id,
                    userId: alert.userId,
                    email: alert.email,
                    destination: alert.destination,
                    notification: notification
                });

                console.log(`Alert triggered for ${alert.destination}: ${priceDrop.toFixed(1)}% drop`);

                // Here you would send email/SMS notification
                // For now, we just log and store in database
                if (alert.email) {
                    await sendEmailNotification(alert.email, notification);
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Price drop check completed',
                stats: {
                    totalActive: activeAlerts.length,
                    checked: checkedAlerts.length,
                    triggered: triggeredAlerts.length,
                    checkedAlerts: checkedAlerts,
                    triggeredAlerts: triggeredAlerts
                }
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };

    } catch (error) {
        console.error('Check price drops error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to check price drops', 
                details: error.message 
            }),
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        };
    }
};

/**
 * Send email notification (placeholder - integrate with SendGrid, Mailgun, etc.)
 */
async function sendEmailNotification(email, notification) {
    console.log(`Sending email to ${email}:`, notification.message);
    
    // TODO: Integrate with email service
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
        to: email,
        from: 'alerts@wanderly.com',
        subject: 'Price Drop Alert - Your Trip Just Got Cheaper!',
        text: notification.message,
        html: `
            <h2>🎉 Great News!</h2>
            <p>${notification.message}</p>
            <p><strong>Old Price:</strong> PKR ${notification.oldPrice}</p>
            <p><strong>New Price:</strong> PKR ${notification.newPrice}</p>
            <p><strong>You Save:</strong> PKR ${notification.savings}</p>
            <a href="https://wanderly.com/planner">Book Now</a>
        `
    };
    
    await sgMail.send(msg);
    */
    
    return true;
}
