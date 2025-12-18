/**
 * Alert System Module
 * Handles notifications for price drops and seasonal events
 */

let userAlerts = [];
let seasonalAlerts = [];
let unreadCount = 0;

/**
 * Initialize alert system
 */
async function initAlertSystem() {
    // Add notification bell to header
    addNotificationBell();
    
    // Load user's alerts
    await loadUserAlerts();
    
    // Check for seasonal alerts based on browsing
    await checkSeasonalAlerts();
    
    // Update badge count
    updateAlertBadge();
}

/**
 * Add notification bell icon to header
 */
function addNotificationBell() {
    const headerNav = document.querySelector('.header-nav');
    if (!headerNav) return;

    const bellWrapper = document.createElement('div');
    bellWrapper.className = 'alert-bell-wrapper';
    bellWrapper.innerHTML = `
        <button id="alert-bell-btn" class="alert-bell-btn" aria-label="Notifications">
            <i class="fa-solid fa-bell"></i>
            <span id="alert-badge" class="alert-badge" style="display: none;">0</span>
        </button>
        
        <div id="alert-dropdown" class="alert-dropdown" style="display: none;">
            <div class="alert-dropdown-header">
                <h3>Notifications</h3>
                <button id="mark-all-read-btn" class="text-btn">Mark all read</button>
            </div>
            <div id="alert-list" class="alert-list">
                <div class="alert-empty">
                    <i class="fa-solid fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            </div>
        </div>
    `;

    // Insert before auth nav items
    const authPlaceholder = headerNav.querySelector('.nav-link[href*="login"]');
    if (authPlaceholder) {
        headerNav.insertBefore(bellWrapper, authPlaceholder.parentElement);
    } else {
        headerNav.appendChild(bellWrapper);
    }

    // Add event listeners
    document.getElementById('alert-bell-btn').addEventListener('click', toggleAlertDropdown);
    document.getElementById('mark-all-read-btn').addEventListener('click', markAllRead);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('alert-dropdown');
        const bellBtn = document.getElementById('alert-bell-btn');
        if (dropdown && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Add styles
    addAlertStyles();
}

/**
 * Toggle alert dropdown
 */
function toggleAlertDropdown() {
    const dropdown = document.getElementById('alert-dropdown');
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        displayAlerts();
    } else {
        dropdown.style.display = 'none';
    }
}

/**
 * Load user's alert subscriptions
 */
async function loadUserAlerts() {
    try {
        // Get user ID from localStorage (if logged in)
        const userId = localStorage.getItem('userId') || 'anonymous';
        
        const response = await fetch(`/.netlify/functions/subscribeToAlerts?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            userAlerts = data.alerts.filter(a => a.triggered && !a.read);
            unreadCount = userAlerts.length;
        }
    } catch (error) {
        console.error('Failed to load alerts:', error);
    }
}

/**
 * Check for seasonal alerts based on current month and popular destinations
 */
async function checkSeasonalAlerts() {
    try {
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
        
        // Get all seasonal events for current month
        const response = await fetch(`/.netlify/functions/getSeasonalRecommendations?month=${currentMonth}`);
        const data = await response.json();
        
        if (data.success && data.events.length > 0) {
            // Filter high priority events
            seasonalAlerts = data.events.filter(e => e.priority === 'high').slice(0, 3);
            unreadCount += seasonalAlerts.length;
        }
    } catch (error) {
        console.error('Failed to load seasonal alerts:', error);
    }
}

/**
 * Display alerts in dropdown
 */
function displayAlerts() {
    const alertList = document.getElementById('alert-list');
    if (!alertList) return;

    const allAlerts = [...userAlerts, ...seasonalAlerts];

    if (allAlerts.length === 0) {
        alertList.innerHTML = `
            <div class="alert-empty">
                <i class="fa-solid fa-bell-slash"></i>
                <p>No new notifications</p>
            </div>
        `;
        return;
    }

    alertList.innerHTML = allAlerts.map(alert => {
        if (alert.notifications && alert.notifications.length > 0) {
            // Price drop alert
            const notification = alert.notifications[alert.notifications.length - 1];
            return `
                <div class="alert-item price-drop">
                    <div class="alert-icon">💰</div>
                    <div class="alert-content">
                        <div class="alert-title">Price Drop Alert!</div>
                        <div class="alert-message">${notification.message}</div>
                        <div class="alert-details">
                            <span class="old-price">PKR ${notification.oldPrice}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                            <span class="new-price">PKR ${notification.newPrice}</span>
                            <span class="savings">Save PKR ${notification.savings}</span>
                        </div>
                        <div class="alert-time">${formatTimeAgo(notification.triggeredAt)}</div>
                    </div>
                </div>
            `;
        } else if (alert.eventName) {
            // Seasonal event alert
            return `
                <div class="alert-item seasonal">
                    <div class="alert-icon">${alert.icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.eventName}</div>
                        <div class="alert-message">${alert.alertMessage}</div>
                        <div class="alert-location">
                            <i class="fa-solid fa-location-dot"></i>
                            ${alert.city}, ${alert.country}
                        </div>
                        <div class="alert-meta">
                            ${alert.eventType} • ${alert.peakMonth}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

/**
 * Update alert badge count
 */
function updateAlertBadge() {
    const badge = document.getElementById('alert-badge');
    if (!badge) return;

    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Mark all alerts as read
 */
function markAllRead() {
    unreadCount = 0;
    updateAlertBadge();
    userAlerts = [];
    seasonalAlerts = [];
    displayAlerts();
}

/**
 * Subscribe to price drop alert for a destination
 */
async function subscribeToPriceAlert(destination, currentPrice, budget, days, travelType) {
    try {
        const userId = localStorage.getItem('userId') || 'anonymous';
        const email = localStorage.getItem('userEmail') || null;

        const response = await fetch('/.netlify/functions/subscribeToAlerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                email,
                destination,
                currentPrice,
                budget,
                days,
                travelType,
                alertThreshold: 5 // 5% drop
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Alert subscribed! We\'ll notify you when prices drop.', 'success');
            return data.alertId;
        } else {
            showToast('❌ Failed to subscribe to alert', 'error');
            return null;
        }
    } catch (error) {
        console.error('Subscribe to alert error:', error);
        showToast('❌ Failed to subscribe to alert', 'error');
        return null;
    }
}

/**
 * Track price in history (called after budget search)
 */
async function trackPrice(destination, days, travelType, totalCost, breakdown) {
    try {
        await fetch('/.netlify/functions/trackPriceHistory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destination,
                days,
                travelType,
                totalCost,
                breakdown
            })
        });
    } catch (error) {
        console.error('Track price error:', error);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
}

/**
 * Add alert styles to page
 */
function addAlertStyles() {
    if (document.getElementById('alert-system-styles')) return;

    const style = document.createElement('style');
    style.id = 'alert-system-styles';
    style.textContent = `
        .alert-bell-wrapper {
            position: relative;
            display: inline-block;
        }

        .alert-bell-btn {
            position: relative;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.3);
            color: var(--text);
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.3s;
        }

        .alert-bell-btn:hover {
            background: rgba(99, 102, 241, 0.2);
            border-color: var(--primary);
        }

        .alert-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ef4444;
            color: white;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
        }

        .alert-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 400px;
            max-width: 90vw;
            background: rgba(30, 41, 59, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            overflow: hidden;
        }

        .alert-dropdown-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .alert-dropdown-header h3 {
            color: var(--text);
            margin: 0;
            font-size: 1.1rem;
        }

        .text-btn {
            background: none;
            border: none;
            color: var(--primary);
            font-size: 0.85rem;
            cursor: pointer;
            padding: 0;
        }

        .text-btn:hover {
            text-decoration: underline;
        }

        .alert-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .alert-empty {
            padding: 40px 20px;
            text-align: center;
            color: var(--text-muted);
        }

        .alert-empty i {
            font-size: 2.5rem;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        .alert-item {
            display: flex;
            gap: 15px;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: background 0.2s;
        }

        .alert-item:hover {
            background: rgba(255, 255, 255, 0.03);
        }

        .alert-icon {
            font-size: 2rem;
            flex-shrink: 0;
        }

        .alert-content {
            flex: 1;
        }

        .alert-title {
            color: var(--text);
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 0.95rem;
        }

        .alert-message {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 8px;
            line-height: 1.4;
        }

        .alert-details {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            margin-bottom: 5px;
        }

        .old-price {
            text-decoration: line-through;
            color: var(--text-muted);
        }

        .new-price {
            color: #22c55e;
            font-weight: 600;
        }

        .savings {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 600;
        }

        .alert-location, .alert-meta {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-top: 5px;
        }

        .alert-location i {
            color: var(--primary);
            margin-right: 5px;
        }

        .alert-time {
            color: var(--text-muted);
            font-size: 0.75rem;
            margin-top: 8px;
        }

        .subscribe-alert-btn {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s;
        }

        .subscribe-alert-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: rgba(30, 41, 59, 0.98);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s;
            z-index: 10000;
            max-width: 350px;
        }

        .toast.show {
            transform: translateY(0);
            opacity: 1;
        }

        .toast-success {
            border-left: 4px solid #22c55e;
        }

        .toast-error {
            border-left: 4px solid #ef4444;
        }

        .toast-info {
            border-left: 4px solid #3b82f6;
        }
    `;
    document.head.appendChild(style);
}

// Export functions
window.initAlertSystem = initAlertSystem;
window.subscribeToPriceAlert = subscribeToPriceAlert;
window.trackPrice = trackPrice;
window.showToast = showToast;
