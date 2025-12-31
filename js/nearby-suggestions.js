/**
 * Nearby Suggestions Module
 * Shows popular nearby destinations based on location
 */

let nearbySuggestionsCache = {};

/**
 * Fetch nearby destinations from backend
 */
async function fetchNearbyDestinations(destination, lat = null, lng = null, radius = 300, limit = 5) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || 'anonymous';
        
        // Check cache first
        const cacheKey = `${destination || `${lat},${lng}`}_${radius}_${limit}`;
        if (nearbySuggestionsCache[cacheKey]) {
            console.log('📍 Nearby suggestions loaded from cache');
            return nearbySuggestionsCache[cacheKey];
        }

        let url = `/.netlify/functions/getNearbyDestinations?userId=${userId}&radius=${radius}&limit=${limit}`;
        
        if (destination) {
            url += `&destination=${encodeURIComponent(destination)}`;
        } else if (lat && lng) {
            url += `&lat=${lat}&lng=${lng}`;
        } else {
            throw new Error('Destination name or coordinates required');
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            // Cache the result
            nearbySuggestionsCache[cacheKey] = data;
            return data;
        } else {
            throw new Error(data.error || 'Failed to fetch nearby destinations');
        }
    } catch (error) {
        console.error('Nearby destinations error:', error);
        return null;
    }
}

/**
 * Display nearby suggestions in a card/sidebar
 */
function displayNearbySuggestions(data, containerId = 'nearby-suggestions') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Nearby suggestions container not found');
        return;
    }

    if (!data || !data.suggestions || data.suggestions.length === 0) {
        container.innerHTML = `
            <div class="nearby-empty">
                <i class="fa-solid fa-location-dot"></i>
                <p>No nearby destinations found</p>
            </div>
        `;
        container.style.display = 'block';
        return;
    }

    const { center, suggestions, userPreferences } = data;

    let html = `
        <div class="nearby-header">
            <h3><i class="fa-solid fa-compass"></i> Nearby Popular Places</h3>
            <p class="nearby-subtitle">Near ${center.destination}</p>
        </div>
        <div class="nearby-list">
    `;

    suggestions.forEach((city, index) => {
        const isPreferred = city.matchesPreferences;
        const popularityBadge = city.searchCount > 0 
            ? `<span class="popularity-badge" title="${city.searchCount} searches">🔥 ${city.searchCount}</span>` 
            : '';
        const preferredBadge = isPreferred 
            ? `<span class="preferred-badge" title="Matches your preferences">⭐</span>` 
            : '';

        html += `
            <div class="nearby-item ${isPreferred ? 'preferred' : ''}" data-destination="${city.destination}">
                <div class="nearby-rank">${index + 1}</div>
                <div class="nearby-content">
                    <div class="nearby-name">
                        ${city.destination}
                        ${preferredBadge}
                        ${popularityBadge}
                    </div>
                    <div class="nearby-details">
                        <span class="nearby-distance">
                            <i class="fa-solid fa-location-arrow"></i> ${city.distanceText}
                        </span>
                        ${city.country ? `<span class="nearby-country">${city.country}</span>` : ''}
                    </div>
                    <div class="nearby-cost">
                        <small>Avg cost: ₨${parseInt(city.averageDailyCost || 0).toLocaleString()}/day</small>
                    </div>
                </div>
                <div class="nearby-actions">
                    <button class="nearby-view-btn" onclick="viewDestinationDetails('${city.destination}')">
                        View
                    </button>
                </div>
            </div>
        `;
    });

    html += `
        </div>
        ${userPreferences.length > 0 ? `
            <div class="nearby-preferences">
                <small>⭐ Based on your searches: ${userPreferences.join(', ')}</small>
            </div>
        ` : ''}
    `;

    container.innerHTML = html;
    container.style.display = 'block';

    // Add nearby suggestions styles if not already added
    addNearbySuggestionsStyles();
}

/**
 * View destination details - redirect to planner
 */
function viewDestinationDetails(destination) {
    window.location.href = `planner.html?destination=${encodeURIComponent(destination)}`;
}

/**
 * Show nearby suggestions modal
 */
function showNearbySuggestionsModal(data) {
    // Remove existing modal if any
    const existingModal = document.getElementById('nearby-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'nearby-modal';
    modal.className = 'nearby-modal';
    modal.innerHTML = `
        <div class="nearby-modal-content">
            <div class="nearby-modal-header">
                <h2><i class="fa-solid fa-compass"></i> Explore Nearby</h2>
                <button class="nearby-modal-close" onclick="closeNearbySuggestionsModal()">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="nearby-modal-body">
                <div id="nearby-modal-suggestions"></div>
            </div>
        </div>
        <div class="nearby-modal-backdrop" onclick="closeNearbySuggestionsModal()"></div>
    `;

    document.body.appendChild(modal);
    
    // Display suggestions in modal
    displayNearbySuggestions(data, 'nearby-modal-suggestions');
    
    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Close nearby suggestions modal
 */
function closeNearbySuggestionsModal() {
    const modal = document.getElementById('nearby-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Add nearby suggestions button to destination cards
 */
function addNearbySuggestionsButton(cardElement, destination, lat = null, lng = null) {
    if (!cardElement) return;

    // Check if button already exists
    if (cardElement.querySelector('.nearby-suggestions-trigger')) {
        return;
    }

    const button = document.createElement('button');
    button.className = 'nearby-suggestions-trigger';
    button.innerHTML = '<i class="fa-solid fa-compass"></i> Explore Nearby';
    button.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;
        
        const data = await fetchNearbyDestinations(destination, lat, lng);
        
        button.innerHTML = '<i class="fa-solid fa-compass"></i> Explore Nearby';
        button.disabled = false;
        
        if (data) {
            showNearbySuggestionsModal(data);
        } else {
            if (window.showToast) {
                showToast('Failed to load nearby destinations', 'error');
            }
        }
    };

    // Add button to card actions or bottom
    const cardActions = cardElement.querySelector('.card-actions, .destination-actions, .trip-actions');
    if (cardActions) {
        cardActions.appendChild(button);
    } else {
        cardElement.appendChild(button);
    }
}

/**
 * Add nearby suggestions styles
 */
function addNearbySuggestionsStyles() {
    if (document.getElementById('nearby-suggestions-styles')) return;

    const style = document.createElement('style');
    style.id = 'nearby-suggestions-styles';
    style.textContent = `
        #nearby-suggestions {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
        }

        .nearby-header {
            margin-bottom: 15px;
        }

        .nearby-header h3 {
            color: var(--text);
            margin: 0 0 5px 0;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nearby-subtitle {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin: 0;
        }

        .nearby-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .nearby-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            transition: all 0.2s;
            align-items: center;
        }

        .nearby-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--primary);
            transform: translateX(4px);
        }

        .nearby-item.preferred {
            border-color: rgba(251, 191, 36, 0.3);
            background: rgba(251, 191, 36, 0.05);
        }

        .nearby-rank {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
            min-width: 30px;
            text-align: center;
        }

        .nearby-content {
            flex: 1;
        }

        .nearby-name {
            color: var(--text);
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }

        .nearby-details {
            display: flex;
            gap: 12px;
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 4px;
        }

        .nearby-distance {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .nearby-cost {
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        .nearby-actions {
            display: flex;
            gap: 8px;
        }

        .nearby-view-btn {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
        }

        .nearby-view-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .nearby-suggestions-trigger {
            background: rgba(236, 72, 153, 0.1);
            border: 1px solid rgba(236, 72, 153, 0.3);
            color: #f9a8d4;
            padding: 8px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            width: 100%;
            justify-content: center;
            margin-top: 8px;
        }

        .nearby-suggestions-trigger:hover {
            background: rgba(236, 72, 153, 0.2);
            border-color: #ec4899;
            transform: translateY(-1px);
        }

        .nearby-suggestions-trigger:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .popularity-badge {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .preferred-badge {
            font-size: 1rem;
        }

        .nearby-preferences {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--text-muted);
            font-size: 0.85rem;
            text-align: center;
        }

        .nearby-empty {
            text-align: center;
            padding: 30px;
            color: var(--text-muted);
        }

        .nearby-empty i {
            font-size: 2rem;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        /* Modal Styles */
        .nearby-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .nearby-modal.show {
            opacity: 1;
        }

        .nearby-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
        }

        .nearby-modal-content {
            position: relative;
            background: rgba(30, 41, 59, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            z-index: 1;
        }

        .nearby-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nearby-modal-header h2 {
            color: var(--text);
            margin: 0;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .nearby-modal-close {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .nearby-modal-close:hover {
            background: rgba(239, 68, 68, 0.2);
        }

        .nearby-modal-body {
            padding: 20px 25px;
            max-height: calc(80vh - 80px);
            overflow-y: auto;
        }

        .nearby-modal-body #nearby-modal-suggestions {
            background: transparent;
            padding: 0;
            margin: 0;
            border: none;
        }

        @media (max-width: 768px) {
            .nearby-modal-content {
                width: 95%;
                max-height: 90vh;
            }

            .nearby-item {
                flex-direction: column;
                align-items: flex-start;
            }

            .nearby-rank {
                position: absolute;
                top: 12px;
                right: 12px;
            }

            .nearby-actions {
                width: 100%;
            }

            .nearby-view-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export functions
window.fetchNearbyDestinations = fetchNearbyDestinations;
window.displayNearbySuggestions = displayNearbySuggestions;
window.showNearbySuggestionsModal = showNearbySuggestionsModal;
window.closeNearbySuggestionsModal = closeNearbySuggestionsModal;
window.viewDestinationDetails = viewDestinationDetails;
window.addNearbySuggestionsButton = addNearbySuggestionsButton;
