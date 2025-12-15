let currentPage = 1;
const pageSize = 50; // Show more trips per page

window.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Browse page loaded');
    
    // Load all trips on page load
    loadAllTrips();
    loadStats();
});

// Load all trips from database
async function loadAllTrips() {
    toggleElement('results-loading', true);
    toggleElement('results-grid', false);
    toggleElement('results-empty', false);

    try {
        const res = await fetch(`/.netlify/functions/getTrips?limit=${pageSize}`);
        if (!res.ok) throw new Error('Failed to load trips');
        const data = await res.json();

        const trips = data.trips || [];
        
        if (trips.length === 0) {
            toggleElement('results-grid', false);
            toggleElement('results-empty', true);
            document.getElementById('results-meta').textContent = 'No trips available yet';
        } else {
            document.getElementById('results-meta').textContent = `Showing ${trips.length} trip${trips.length > 1 ? 's' : ''}`;
            renderResults(trips);
        }

    } catch (err) {
        console.error('Load error:', err);
        toggleElement('results-grid', false);
        toggleElement('results-empty', true);
        document.getElementById('results-meta').textContent = 'Failed to load trips';
    } finally {
        toggleElement('results-loading', false);
    }
}

// Check if database is empty and show seed button
async function checkIfEmpty() {
    try {
        const res = await fetch('/.netlify/functions/getTrips?limit=1');
        const data = await res.json();
        const seedBtn = document.getElementById('seed-btn');
        
        if (seedBtn && data.count === 0) {
            seedBtn.style.display = 'inline-block';
        }
    } catch (e) {
        console.log('Could not check if database is empty');
    }
}

// Seed database with dummy trips
async function seedDatabase() {
    const seedBtn = document.getElementById('seed-btn');
    seedBtn.disabled = true;
    seedBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading Sample Data...';

    try {
        const res = await fetch('/.netlify/functions/seedTrips', { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
            alert(`✅ Loaded ${data.message}`);
            seedBtn.style.display = 'none';
            // Reload data
            performSearch(1);
            loadPopularDestinations();
            loadStats();
            loadTopTrips();
        } else {
            alert('ℹ️ Sample data already loaded!\n\n' + data.message);
            seedBtn.style.display = 'none';
        }
    } catch (e) {
        console.error('Error seeding database:', e);
        alert('Error loading sample data: ' + e.message);
        seedBtn.disabled = false;
        seedBtn.innerHTML = '<i class="fa-solid fa-database"></i> Load Sample Data';
    }
}

async function performSearch(page) {
    currentPage = page;
    toggleElement('results-loading', true);
    toggleElement('results-grid', false);
    toggleElement('results-empty', false);

    // Validate inputs before searching
    const validation = validateSearchInputs();
    if (!validation.valid) {
        showToast(validation.message, 'error');
        toggleElement('results-loading', false);
        return;
    }

    const params = buildSearchParams(page);
    const url = `/.netlify/functions/searchTrips?${params.toString()}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        const trips = data.trips || [];
        
        if (trips.length === 0) {
            showToast('❌ No trips found matching your criteria', 'warning');
            toggleElement('results-grid', false);
            toggleElement('results-empty', true);
            document.getElementById('results-meta').textContent = '0 trips found';
        } else {
            showToast(`✅ Found ${trips.length} trip${trips.length > 1 ? 's' : ''}!`, 'success');
            renderResults(trips);
            updateResultsMeta(data.pagination);
        }

    } catch (err) {
        console.error('Search error:', err);
        showToast('❌ Search failed. Please try again.', 'error');
        toggleElement('results-grid', false);
        toggleElement('results-empty', true);
    } finally {
        toggleElement('results-loading', false);
    }
}

// Validate search inputs
function validateSearchInputs() {
    const minDays = parseInt(document.getElementById('min-days').value) || 0;
    const maxDays = parseInt(document.getElementById('max-days').value) || 30;
    const minBudget = parseInt(document.getElementById('min-budget').value) || 0;
    const maxBudget = parseInt(document.getElementById('max-budget').value) || 10000;

    // Check for negative numbers
    if (minDays < 0) {
        return { valid: false, message: '⚠️ Minimum days cannot be negative' };
    }
    if (maxDays < 0) {
        return { valid: false, message: '⚠️ Maximum days cannot be negative' };
    }
    if (minBudget < 0) {
        return { valid: false, message: '⚠️ Minimum budget cannot be negative' };
    }
    if (maxBudget < 0) {
        return { valid: false, message: '⚠️ Maximum budget cannot be negative' };
    }

    // Check for min > max
    if (minDays > maxDays) {
        return { valid: false, message: '⚠️ Minimum days cannot exceed maximum days' };
    }
    if (minBudget > maxBudget) {
        return { valid: false, message: '⚠️ Minimum budget cannot exceed maximum budget' };
    }

    // Check for max days exceeding reasonable limit
    if (maxDays > 365) {
        return { valid: false, message: '⚠️ Maximum days cannot exceed 365' };
    }

    return { valid: true, message: '' };
}

function buildSearchParams(page) {
    const params = new URLSearchParams();
    const q = document.getElementById('query').value.trim();
    const budget = document.getElementById('budget').value;
    const style = document.getElementById('style').value;
    const minDays = document.getElementById('min-days').value;
    const maxDays = document.getElementById('max-days').value;
    const minBudget = document.getElementById('min-budget').value;
    const maxBudget = document.getElementById('max-budget').value;

    if (q) params.append('query', q);
    if (budget) params.append('budget', budget);
    if (style) params.append('style', style);
    if (minDays) params.append('minDays', minDays);
    if (maxDays) params.append('maxDays', maxDays);
    if (minBudget) params.append('minBudget', minBudget);
    if (maxBudget) params.append('maxBudget', maxBudget);
    params.append('limit', pageSize.toString());
    params.append('page', page.toString());
    return params;
}

function renderResults(trips) {
    const grid = document.getElementById('results-grid');

    if (!trips.length) {
        toggleElement('results-grid', false);
        toggleElement('results-empty', true);
        grid.innerHTML = '';
        return;
    }

    grid.innerHTML = '';
    trips.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'trip-card';
        const date = trip.createdAt ? new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const emoji = getDestinationEmoji(trip.destination);
        const ratingValue = trip.rating ? parseFloat(trip.rating).toFixed(1) : 'N/A';
        const costText = trip.costs?.total ? `$${trip.costs.total.toLocaleString()}` : 'Price TBA';
        
        // Show "Save to My Trips" button if user is logged in
        const user = getUser ? getUser() : null;
        const saveButton = user ? `<button onclick="saveToMyTrips('${trip._id}', '${trip.destination}')" title="Save this trip to your collection" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"><i class="fa-solid fa-bookmark"></i> Save to My Trips</button>` : '';

        card.innerHTML = `
            <div class="trip-card-image">
                ${emoji}
            </div>
            <div class="trip-card-content">
                <h3 class="trip-destination">${trip.destination || 'Unknown Destination'}</h3>
                
                <div class="trip-meta">
                    <span class="meta-badge">
                        <i class="fa-solid fa-calendar-days"></i> ${trip.travelDays || '?'} days
                    </span>
                    <span class="meta-badge">
                        <i class="fa-solid fa-wallet"></i> ${trip.budget || 'Budget?'}
                    </span>
                    ${trip.favorite ? '<span class="meta-badge" style="background: rgba(236, 72, 153, 0.2); color: var(--accent);"><i class="fa-solid fa-heart"></i> Favorite</span>' : ''}
                </div>

                ${trip.rating ? `<div class="trip-rating"><i class="fa-solid fa-star"></i> ${ratingValue}/5</div>` : ''}
                
                <p class="trip-description">${trip.travelStyle || 'Adventure awaits'}</p>
                
                <div class="trip-cost">
                    <div class="trip-cost-label">Estimated Cost</div>
                    <div class="trip-cost-value">${costText}</div>
                </div>

                <div class="trip-actions" style="flex-direction: column; gap: 10px;">
                    <div style="display: flex; gap: 8px;">
                        <a href="manage-trip.html?id=${trip._id}" title="Manage this trip" style="flex: 1;"><i class="fa-solid fa-list-check"></i> Manage</a>
                        <a href="#" onclick="copyTripId('${trip._id}'); return false;" title="Copy trip ID" style="flex: 1;"><i class="fa-solid fa-copy"></i> Copy ID</a>
                    </div>
                    ${saveButton}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    toggleElement('results-grid', true);
    toggleElement('results-empty', false);
}

function getDestinationEmoji(destination) {
    const emojis = {
        'Paris': '🗼',
        'Tokyo': '⛩️',
        'Barcelona': '🏖️',
        'New York': '🗽',
        'Bali': '🌴',
        'Dubai': '🏜️',
        'Rome': '🏛️',
        'Sydney': '🦘',
        'Amsterdam': '🚲',
        'Bangkok': '🛕',
        'London': '☕',
        'Venice': '🚤'
    };
    
    for (const [key, emoji] of Object.entries(emojis)) {
        if (destination && destination.toLowerCase().includes(key.toLowerCase())) {
            return emoji;
        }
    }
    return '✈️';
}

function copyTripId(tripId) {
    navigator.clipboard.writeText(tripId);
    showToast('📋 Trip ID copied to clipboard!', 'info');
}

// Save trip from Browse to My Trips
async function saveToMyTrips(tripId, destination) {
    const user = getUser ? getUser() : null;
    
    if (!user) {
        alert('Please login first to save trips to your collection!');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch the complete trip data
        const response = await fetch(`/.netlify/functions/getTripById?id=${tripId}`);
        if (!response.ok) throw new Error('Failed to load trip');
        
        const { trip } = await response.json();
        
        // Get auth token
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Save trip to user's collection
        const saveResponse = await fetch('/.netlify/functions/savePlan', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(trip)
        });
        
        if (saveResponse.ok) {
            showToast(`✅ "${destination}" saved to your My Trips!`, 'success');
        } else {
            throw new Error('Failed to save trip');
        }
    } catch (error) {
        console.error('Error saving trip:', error);
        showToast('❌ Failed to save trip. Please try again.', 'error');
    }
}

function updateResultsMeta(pagination) {
    if (!pagination) {
        document.getElementById('results-meta').textContent = '';
        return;
    }
    const { total, page, pages } = pagination;
    document.getElementById('results-meta').textContent = `${total} trips • Page ${page} of ${pages}`;
}

function resetFilters() {
    ['query','budget','style','min-days','max-days','min-budget','max-budget'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    showToast('✨ Filters reset! Showing all trips.', 'success');
    performSearch(1);
}

async function loadPopularDestinations() {
    toggleElement('popular-loading', true);
    toggleElement('popular-grid', false);
    try {
        const res = await fetch('/.netlify/functions/getPopularDestinations?limit=8');
        if (!res.ok) throw new Error('Popular load failed');
        const data = await res.json();
        renderPopular(data.destinations || []);
    } catch (err) {
        console.error('Popular load error:', err);
        document.getElementById('popular-loading').textContent = 'Failed to load popular destinations.';
    } finally {
        toggleElement('popular-loading', false);
    }
}

function renderPopular(destinations) {
    const grid = document.getElementById('popular-grid');
    if (!destinations.length) {
        grid.style.display = 'none';
        return;
    }
    grid.innerHTML = '';
    destinations.forEach(dest => {
        const card = document.createElement('div');
        card.className = 'popular-card';
        const last = dest.lastVisited ? new Date(dest.lastVisited).toLocaleDateString() : '—';
        card.innerHTML = `
            <div style="font-weight:600; color: var(--text);">${dest.destination}</div>
            <div class="muted">${dest.tripCount} trip(s)</div>
            <div class="muted">Avg budget: ${formatCost(dest.avgBudget)}</div>
            <div class="muted">Popular style: ${dest.mostCommonStyle || '—'}</div>
            <div class="muted">Last visit: ${last}</div>
        `;
        grid.appendChild(card);
    });
    grid.style.display = 'grid';
}

async function loadStats() {
    try {
        const res = await fetch('/.netlify/functions/getTripStats');
        if (!res.ok) throw new Error('Stats failed');
        const data = await res.json();
        const stats = data.stats || {};
        renderStats(stats.overview || {});
        renderRecent(stats.recentTrips || []);
    } catch (err) {
        console.error('Stats error:', err);
    }
}

async function loadTopTrips() {
    toggleElement('top-loading', true);
    toggleElement('top-grid', false);
    try {
        const res = await fetch('/.netlify/functions/getTopTrips?limit=8');
        if (!res.ok) throw new Error('Top trips failed');
        const data = await res.json();
        renderTopTrips(data.trips || []);
    } catch (err) {
        console.error('Top trips error:', err);
        document.getElementById('top-loading').textContent = 'Failed to load top trips.';
    } finally {
        toggleElement('top-loading', false);
    }
}

function renderTopTrips(trips) {
    const grid = document.getElementById('top-grid');
    if (!trips.length) {
        grid.style.display = 'none';
        document.getElementById('top-loading').textContent = 'No ratings yet.';
        return;
    }

    grid.innerHTML = '';
    trips.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'result-card';
        const date = trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : '';
        card.innerHTML = `
            <div class="result-header">
                <div class="result-title">${trip.destination}</div>
                <span class="pill">${trip.favorite ? '❤️ Favorite' : '🤍'}</span>
            </div>
            <div class="result-meta">
                <span><i class="fa-solid fa-star"></i> ${Number(trip.rating || 0).toFixed(1)} (${trip.ratingCount || 0})</span>
                <span><i class="fa-solid fa-wallet"></i> ${trip.budget || 'Budget n/a'}</span>
                <span><i class="fa-solid fa-hiking"></i> ${trip.travelStyle || 'Style n/a'}</span>
                <span><i class="fa-solid fa-calendar"></i> ${trip.travelDays || '-'} days</span>
            </div>
            <div class="result-footer">
                <span class="muted">Saved: ${date}</span>
                <a class="muted" href="my-trips.html">Open</a>
            </div>
        `;
        grid.appendChild(card);
    });
    grid.style.display = 'grid';
}

function renderStats(overview) {
    document.getElementById('stat-total-trips').textContent = overview.totalTrips ?? 0;
    document.getElementById('stat-destinations').textContent = overview.uniqueDestinations ?? 0;
    document.getElementById('stat-avg-days').textContent = overview.avgDays ?? '-';
}

function renderRecent(trips) {
    const list = document.getElementById('recent-list');
    if (!trips.length) {
        list.style.display = 'none';
        document.getElementById('recent-loading').textContent = 'No recent trips yet.';
        return;
    }

    list.innerHTML = '';
    trips.forEach(trip => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        const date = trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : '';
        item.innerHTML = `
            <div>
                <div style="font-weight:600; color: var(--text);">${trip.destination}</div>
                <div class="muted">${trip.travelDays} days • ${trip.budget || 'Budget n/a'} • ${trip.travelStyle || 'Style n/a'}</div>
            </div>
            <span class="badge">${date}</span>
        `;
        list.appendChild(item);
    });

    document.getElementById('recent-loading').style.display = 'none';
    list.style.display = 'grid';
}

function toggleElement(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = show ? '' : 'none';
}

function formatCost(value) {
    if (value === undefined || value === null || value === '') return 'N/A';
    const num = Number(value);
    if (Number.isNaN(num)) return 'N/A';
    return `$${num.toLocaleString()}`;
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    const bgColor = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 14px 20px;
        border-radius: 8px;
        font-size: 0.95rem;
        z-index: 9999;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInToast 0.3s ease-out;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add toast animation styles
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideInToast {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutToast {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
