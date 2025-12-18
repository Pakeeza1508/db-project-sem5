// Budget Search Frontend Logic
document.addEventListener('DOMContentLoaded', () => {
    const budgetForm = document.getElementById('budget-form');
    budgetForm.addEventListener('submit', handleBudgetSearch);

    // Initialize map toggle button
    const toggleMapBtn = document.getElementById('toggle-map-btn');
    const mapSection = document.getElementById('map-section');
    let mapInitialized = false;

    if (toggleMapBtn && mapSection) {
        toggleMapBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (mapSection.style.display === 'none') {
                mapSection.style.display = 'block';
                toggleMapBtn.innerHTML = '<i class="fa-solid fa-map"></i> Hide Map';

                // Initialize map on first show
                if (!mapInitialized) {
                    try {
                        await initializeMap('map', 30, 70, 4); // Center on South Asia
                        addLocationSearchInput('map-container');
                        mapInitialized = true;
                    } catch (error) {
                        console.error('Map initialization failed:', error);
                        mapSection.style.display = 'none';
                        toggleMapBtn.innerHTML = '<i class="fa-solid fa-map"></i> Show Map';
                        toggleMapBtn.textContent = 'Map loading failed. Please try again.';
                    }
                }
            } else {
                mapSection.style.display = 'none';
                toggleMapBtn.innerHTML = '<i class="fa-solid fa-map"></i> Show Map';
            }
        });
    }

    // Listen for location selection event
    window.addEventListener('locationSelected', (e) => {
        const { name, lat, lng } = e.detail;
        console.log('Location selected:', name, lat, lng);
    });
});

async function handleBudgetSearch(e) {
    e.preventDefault();

    const budget = document.getElementById('total-budget').value;
    const days = document.getElementById('trip-days').value;
    const startingCity = document.getElementById('starting-city').value;
    const travelType = document.getElementById('travel-type').value;

    if (!budget || !days || !startingCity || !travelType) {
        alert('Please fill in all required fields');
        return;
    }

    // Show loading, hide results
    document.getElementById('loading-state').style.display = 'block';
    document.getElementById('results-container').classList.remove('show');
    document.getElementById('error-message').style.display = 'none';

    try {
        // Call backend API
        const url = `/.netlify/functions/getDestinationsByBudget?budget=${budget}&days=${days}&startingCity=${encodeURIComponent(startingCity)}&travelType=${travelType}`;

        const response = await fetch(url);
        const data = await response.json();

        document.getElementById('loading-state').style.display = 'none';

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to find destinations');
        }

        // Save search to history
        if (window.saveSearchToHistory) {
            saveSearchToHistory(
                'budget-search',
                `${startingCity} - ${budget} PKR`,
                {
                    budget: budget,
                    days: days,
                    startingCity: startingCity,
                    travelType: travelType
                },
                data.recommendations.map(r => r.destination),
                data.recommendations.length
            );
        }

        // Display results
        displayResults(data);

    } catch (error) {
        console.error('Budget search error:', error);
        document.getElementById('loading-state').style.display = 'none';
        
        const errorDiv = document.getElementById('error-message');
        errorDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${error.message}`;
        errorDiv.style.display = 'block';
    }
}

function displayResults(data) {
    const { input, recommendations } = data;

    // Update heading
    document.getElementById('results-heading').innerHTML = 
        `Top 3 Destinations for ${input.budget.toLocaleString()} PKR`;
    document.getElementById('results-subtitle').innerHTML = 
        `${input.days} days • ${input.travelType} • From ${input.startingCity}`;

    // Render cards
    const grid = document.getElementById('results-grid');
    grid.innerHTML = '';

    recommendations.forEach((destination, index) => {
        const card = createDestinationCard(destination, index + 1, input);
        grid.appendChild(card);
        
        // Track price for this destination
        if (window.trackPrice && destination.bestPackage) {
            const pkg = destination[destination.bestPackage];
            trackPrice(destination.city, input.days, input.travelType, pkg.totalCost, destination.costBreakdown);
        }
    });

    // Show results container
    document.getElementById('results-container').classList.add('show');

    // Load seasonal alerts for displayed destinations
    loadSeasonalAlertsForDestinations(recommendations);

    // Initialize budget currency converter with exchange rates
    setTimeout(() => {
        if (window.initBudgetCurrencyConverter) {
            window.initBudgetCurrencyConverter();
        }
    }, 500);
}

/**
 * Load seasonal alerts for displayed destinations
 */
async function loadSeasonalAlertsForDestinations(destinations) {
    for (const destination of destinations) {
        try {
            const response = await fetch(`/.netlify/functions/getSeasonalRecommendations?city=${destination.city}`);
            const data = await response.json();
            
            if (data.success && data.events.length > 0) {
                // Show seasonal event badge on card
                displaySeasonalEventBadge(destination.city, data.events);
            }
        } catch (error) {
            console.error('Failed to load seasonal alerts:', error);
        }
    }
}

function createDestinationCard(destination, rank, inputData) {
    const card = document.createElement('div');
    card.className = 'destination-card';
    card.style.animation = `slideUp 0.4s ease ${rank * 0.1}s both`;
    card.dataset.city = destination.city; // Add data attribute for seasonal alerts

    const { city, region, attractions, weather, rating, score, cheap, moderate, luxury, availablePackages, bestMonths, avoidMonths, seasonalWarning, costBreakdown, travelTimeHours } = destination;

    // Determine best package recommendation
    let bestPackage = null;
    let bestPackagePrice = 0;
    if (availablePackages.cheap) {
        bestPackage = cheap;
        bestPackagePrice = cheap.totalCost;
    } else if (availablePackages.moderate) {
        bestPackage = moderate;
        bestPackagePrice = moderate.totalCost;
    } else if (availablePackages.luxury) {
        bestPackage = luxury;
        bestPackagePrice = luxury.totalCost;
    }

    // Seasonal warning HTML
    const seasonalHTML = seasonalWarning ? `
        <div style="background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #ef4444;">
            <div style="color: #fca5a5; font-size: 0.85rem; display: flex; align-items: start; gap: 8px;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-top: 2px;"></i>
                <div>
                    <strong>Seasonal Alert:</strong><br>
                    ${seasonalWarning}
                </div>
            </div>
        </div>
        ${bestMonths && bestMonths.length > 0 ? `
            <div style="background: rgba(34, 197, 94, 0.1); padding: 8px 12px; border-radius: 6px; margin-bottom: 15px; border-left: 3px solid #22c55e;">
                <div style="color: #4ade80; font-size: 0.85rem;">
                    <i class="fa-solid fa-calendar-check"></i> Best: ${bestMonths.join(', ')}
                </div>
            </div>
        ` : ''}
    ` : '';

    card.innerHTML = `
        <div class="destination-header">
            <h3 class="destination-name">
                #${rank} ${city}
                <span class="score-badge">Score: ${score}</span>
            </h3>
            <div class="destination-region">
                <i class="fa-solid fa-location-dot"></i> ${region} Pakistan
            </div>
        </div>

        <div class="destination-body">
            ${seasonalHTML}
            <div class="destination-info">
                <div class="destination-info-label">
                    <i class="fa-solid fa-star"></i> Rating & Weather
                </div>
                <div class="destination-info-value">
                    ⭐ ${rating}/5 • ${weather} • ⏱️ ~${travelTimeHours}h travel
                </div>
            </div>

            <div class="destination-info">
                <div class="destination-info-label">
                    <i class="fa-solid fa-landmark"></i> Top Attractions
                </div>
                <div class="destination-info-value">
                    ${attractions}
                </div>
            </div>

            <div class="package-options">
                <div style="font-weight: 600; margin-bottom: 12px; color: var(--text);">Options:</div>
                
                <div class="package-option ${!availablePackages.cheap ? 'unavailable' : ''}">
                    <div>
                        <div class="package-label">🟢 Cheap</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Transport+Food+Local (lean)</div>
                    </div>
                    <div class="package-cost ${!availablePackages.cheap ? 'exceed' : ''}" data-usd-cost="${(cheap.totalCost / 278.5).toFixed(2)}">
                        ₨${cheap.totalCost.toLocaleString()}
                    </div>
                </div>

                <div class="package-option ${!availablePackages.moderate ? 'unavailable' : ''}">
                    <div>
                        <div class="package-label">🔵 Balanced</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Best experience</div>
                    </div>
                    <div class="package-cost ${!availablePackages.moderate ? 'exceed' : ''}" data-usd-cost="${(moderate.totalCost / 278.5).toFixed(2)}">
                        ₨${moderate.totalCost.toLocaleString()}
                    </div>
                </div>

                <div class="package-option ${!availablePackages.luxury ? 'unavailable' : ''}">
                    <div>
                        <div class="package-label">🟣 Premium</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Max comfort within budget</div>
                    </div>
                    <div class="package-cost ${!availablePackages.luxury ? 'exceed' : ''}" data-usd-cost="${(luxury.totalCost / 278.5).toFixed(2)}">
                        ₨${luxury.totalCost.toLocaleString()}
                    </div>
                </div>
            </div>

            <div style="margin-top: 12px; color: var(--text);">
                <div style="font-weight:600; margin-bottom:6px;">Cost Breakdown</div>
                <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px;">
                    <div class="destination-info">
                        <div class="destination-info-label">🚌 Transport</div>
                        <div class="destination-info-value" data-usd-cost="${(costBreakdown.transport / 278.5).toFixed(2)}">₨${(costBreakdown.transport || 0).toLocaleString()}</div>
                    </div>
                    <div class="destination-info">
                        <div class="destination-info-label">🍽️ Food</div>
                        <div class="destination-info-value" data-usd-cost="${(costBreakdown.food / 278.5).toFixed(2)}">₨${(costBreakdown.food || 0).toLocaleString()}</div>
                    </div>
                    <div class="destination-info">
                        <div class="destination-info-label">🚕 Local Transport</div>
                        <div class="destination-info-value" data-usd-cost="${(costBreakdown.localTransport / 278.5).toFixed(2)}">₨${(costBreakdown.localTransport || 0).toLocaleString()}</div>
                    </div>
                    <div class="destination-info">
                        <div class="destination-info-label">🎟️ Activities</div>
                        <div class="destination-info-value" data-usd-cost="${(costBreakdown.activities / 278.5).toFixed(2)}">₨${(costBreakdown.activities || 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            ${bestPackage ? `
                <div style="background: rgba(99, 102, 241, 0.1); padding: 12px; border-radius: 8px; margin-top: 15px; border-left: 3px solid var(--primary);">
                    <div style="font-weight: 600; color: var(--primary); margin-bottom: 5px;">Best Match: ${bestPackage.packageType}</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">
                        ₨${bestPackage.totalCost.toLocaleString()} total (₨${bestPackage.dailyAvg.toLocaleString()}/day)
                    </div>
                </div>
            ` : `
                <div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; margin-top: 15px; border-left: 3px solid #ef4444;">
                    <div style="color: #fca5a5; font-size: 0.9rem;">
                        <i class="fa-solid fa-info-circle"></i> Slightly above budget. Consider reducing days or increasing budget.
                    </div>
                </div>
            `}

            <div class="destination-actions">
                <button class="btn-view-plan" onclick="generatePlan('${city}', ${inputData?.days || 3})">
                    <i class="fa-solid fa-map"></i> Generate Plan
                </button>
                ${bestPackagePrice > 0 ? `
                    <button class="subscribe-alert-btn" onclick="subscribeToDestinationAlert('${city}', ${bestPackagePrice}, ${inputData?.days || 3}, '${inputData?.travelType || 'Solo'}')">
                        <i class="fa-solid fa-bell"></i> Get Price Alerts
                    </button>
                ` : ''}
                <div class="seasonal-events-container" id="seasonal-events-${city.replace(/\s+/g, '-')}"></div>
            </div>
        </div>
    `;

    // Add "Explore Nearby" button after card is created
    if (window.addNearbySuggestionsButton) {
        setTimeout(() => {
            addNearbySuggestionsButton(card, city, destination.coordinates?.lat, destination.coordinates?.lng);
        }, 100);
    }

    return card;
}

function generatePlan(destination, days) {
    // Get all form data
    const budget = document.getElementById('total-budget').value;
    const startingCity = document.getElementById('starting-city').value;
    const travelType = document.getElementById('travel-type').value;
    
    // Store all trip data in session storage for planner to use
    sessionStorage.setItem('prefilledDestination', destination);
    sessionStorage.setItem('prefilledDays', days);
    sessionStorage.setItem('tripBudget', budget);
    sessionStorage.setItem('startingCity', startingCity);
    sessionStorage.setItem('travelType', travelType);
    sessionStorage.setItem('fromBudgetSearch', 'true');
    
    // Redirect to planner
    window.location.href = 'planner.html';
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

/**
 * Subscribe to price alerts for a destination
 */
async function subscribeToDestinationAlert(destination, currentPrice, days, travelType) {
    if (window.subscribeToPriceAlert) {
        const alertId = await subscribeToPriceAlert(
            destination,
            currentPrice,
            document.getElementById('total-budget')?.value || 0,
            days,
            travelType
        );
        
        if (alertId) {
            // Disable button after subscription
            event.target.disabled = true;
            event.target.innerHTML = '<i class="fa-solid fa-check"></i> Subscribed';
            event.target.style.background = 'linear-gradient(135deg, #64748b, #475569)';
        }
    }
}

/**
 * Display seasonal event badge on destination card
 */
function displaySeasonalEventBadge(city, events) {
    const containerId = `seasonal-events-${city.replace(/\s+/g, '-')}`;
    const container = document.getElementById(containerId);
    
    if (!container || events.length === 0) return;

    const highPriorityEvents = events.filter(e => e.priority === 'high').slice(0, 2);
    
    container.innerHTML = highPriorityEvents.map(event => `
        <div class="seasonal-event-badge">
            <span class="event-icon">${event.icon}</span>
            <div class="event-content">
                <div class="event-name">${event.eventName}</div>
                <div class="event-details">${event.peakMonth} • ${event.eventType}</div>
            </div>
        </div>
    `).join('');

    // Add seasonal event styles if not already added
    if (!document.getElementById('seasonal-event-styles')) {
        const seasonalStyle = document.createElement('style');
        seasonalStyle.id = 'seasonal-event-styles';
        seasonalStyle.textContent = `
            .seasonal-events-container {
                margin-top: 15px;
            }

            .seasonal-event-badge {
                display: flex;
                gap: 10px;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15));
                border: 1px solid rgba(139, 92, 246, 0.4);
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 8px;
                animation: pulse 2s infinite;
            }

            .event-icon {
                font-size: 1.8rem;
                flex-shrink: 0;
            }

            .event-content {
                flex: 1;
            }

            .event-name {
                color: var(--text);
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 3px;
            }

            .event-details {
                color: var(--text-muted);
                font-size: 0.75rem;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(seasonalStyle);
    }
}

// Make functions globally accessible
window.subscribeToDestinationAlert = subscribeToDestinationAlert;
window.displaySeasonalEventBadge = displaySeasonalEventBadge;
