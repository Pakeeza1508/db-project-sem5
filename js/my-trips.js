// My Trips Page - Load and display saved trips
let allTrips = [];
let filteredTrips = [];
let compareSelected = new Set(JSON.parse(sessionStorage.getItem('compareSelectedIds') || '[]'));
let compareBtnEl;

document.addEventListener('DOMContentLoaded', () => {
    loadTrips();
    
    // Search and filter event listeners
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('budget-filter').addEventListener('change', applyFilters);
    document.getElementById('style-filter').addEventListener('change', applyFilters);
    document.getElementById('sort-select').addEventListener('change', applyFilters);

    compareBtnEl = document.getElementById('compare-open-btn');
    if (compareBtnEl) {
        compareBtnEl.addEventListener('click', openComparePage);
        updateCompareButton();
    }

    // Add toast animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});

async function loadTrips() {
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add myTrips=true parameter to filter by authenticated user
        const response = await fetch('/.netlify/functions/getTrips?myTrips=true', {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error('Failed to load trips');
        }

        const data = await response.json();
        allTrips = data.trips || [];
        filteredTrips = [...allTrips];
        
        updateStats();
        renderTrips();
        
    } catch (error) {
        console.error('Error loading trips:', error);
        document.getElementById('loading-state').innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="color: #ef4444;"></i>
            <p>Failed to load trips. Please try again.</p>
        `;
    }
}

function updateStats() {
    const totalTrips = allTrips.length;
    const uniqueDestinations = new Set(allTrips.map(t => t.destination)).size;
    const totalDays = allTrips.reduce((sum, trip) => sum + parseInt(trip.travelDays || 0), 0);

    document.getElementById('total-trips').textContent = totalTrips;
    document.getElementById('total-destinations').textContent = uniqueDestinations;
    document.getElementById('total-days').textContent = totalDays;
}

function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const budgetFilter = document.getElementById('budget-filter').value;
    const styleFilter = document.getElementById('style-filter').value;
    const sortOption = document.getElementById('sort-select').value;

    // Filter trips
    filteredTrips = allTrips.filter(trip => {
        const matchesSearch = trip.destination.toLowerCase().includes(searchQuery);
        const matchesBudget = !budgetFilter || trip.budget === budgetFilter;
        const matchesStyle = !styleFilter || trip.travelStyle === styleFilter;
        
        return matchesSearch && matchesBudget && matchesStyle;
    });

    // Sort trips
    if (sortOption === 'newest') {
        filteredTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === 'oldest') {
        filteredTrips.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortOption === 'destination') {
        filteredTrips.sort((a, b) => a.destination.localeCompare(b.destination));
    } else if (sortOption === 'rating') {
        filteredTrips.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    renderTrips();
}

function renderTrips() {
    const grid = document.getElementById('trips-grid');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');

    loadingState.style.display = 'none';

    if (filteredTrips.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';

    filteredTrips.forEach(trip => {
        const card = createTripCard(trip);
        grid.appendChild(card);
    });
}

function createTripCard(trip) {
    const card = document.createElement('div');
    card.className = 'trip-card';

    // Get first letter of destination for icon
    const icon = trip.destination.charAt(0).toUpperCase();
    
    // Format date
    const date = new Date(trip.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="trip-card-image">
            <i class="fa-solid fa-location-dot"></i>
        </div>
        <div class="trip-card-content">
            <div class="trip-card-title">${trip.destination}</div>
            <div class="trip-card-meta">
                <span class="meta-tag"><i class="fa-solid fa-calendar"></i> ${trip.travelDays} day(s)</span>
                <span class="meta-tag"><i class="fa-solid fa-wallet"></i> ${trip.budget}</span>
                <span class="meta-tag"><i class="fa-solid fa-hiking"></i> ${trip.travelStyle}</span>
                <span class="meta-tag">${renderRating(trip)}</span>
                <span class="meta-tag">${trip.favorite ? '❤️ Favorite' : '🤍 Not favorite'}</span>
            </div>
            <div class="trip-card-date">
                <i class="fa-solid fa-clock"></i> Saved on ${date}
            </div>
            <div class="trip-card-meta" style="gap:6px;">
                ${renderStars(trip._id, trip.rating)}
            </div>
            <div class="trip-card-meta" style="margin-top: 8px;">
                <label class="meta-tag" style="display:flex; align-items:center; gap:8px; background: rgba(255,255,255,0.08);">
                    <input type="checkbox" data-compare="${trip._id}" ${compareSelected.has(trip._id) ? 'checked' : ''} /> Compare
                </label>
            </div>
                <div class="trip-actions">
                    <button class="btn-view" onclick='viewTrip(${JSON.stringify(trip._id)})'>
                        <i class="fa-solid fa-eye"></i> View Details
                    </button>
                    <button class="btn-view" onclick='editTrip(${JSON.stringify(trip._id)})'>
                        <i class="fa-solid fa-edit"></i> Edit
                    </button>
                    <button class="btn-view" onclick='manageTrip(${JSON.stringify(trip._id)})'>
                        <i class="fa-solid fa-list-check"></i> Manage
                    </button>
                    <button class="btn-view" onclick='toggleFavorite(${JSON.stringify(trip._id)}, ${trip.favorite ? 'false' : 'true'})'>
                        <i class="fa-solid fa-heart"></i> ${trip.favorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button class="btn-view" onclick='shareTrip(${JSON.stringify(trip._id)}, "${trip.destination}")'>
                        <i class="fa-solid fa-share"></i> Share
                    </button>
                    <button class="btn-delete" onclick='deleteTrip(${JSON.stringify(trip._id)}, "${trip.destination}")'>
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
        </div>
    `;

    const compareCheckbox = card.querySelector('input[data-compare]');
    if (compareCheckbox) {
        compareCheckbox.addEventListener('change', (e) => {
            const ok = toggleCompareSelection(trip._id, e.target.checked);
            if (!ok) {
                e.target.checked = false;
            }
        });
    }

    return card;
}

async function viewTrip(tripId) {
    // Store trip ID in sessionStorage and redirect to view page
    sessionStorage.setItem('viewTripId', tripId);
    window.location.href = 'view-trip.html?id=' + tripId;
}

async function manageTrip(tripId) {
    // Redirect to manage trip page
    window.location.href = 'manage-trip.html?id=' + tripId;
}

async function editTrip(tripId) {
    // Redirect to planner page with trip data pre-filled for editing
    window.location.href = 'planner.html?edit=' + tripId;
}

async function deleteTrip(tripId, destination) {
    if (!confirm(`Are you sure you want to delete the trip to ${destination}?`)) {
        return;
    }

    try {
        const response = await fetch(`/.netlify/functions/deleteTrip?id=${tripId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Trip deleted successfully!');
            // Remove from local array and re-render
            allTrips = allTrips.filter(t => t._id !== tripId);
            applyFilters();
            updateStats();
        } else {
            throw new Error('Failed to delete trip');
        }
    } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip. Please try again.');
    }
}

function toggleCompareSelection(tripId, checked) {
    if (checked) {
        if (compareSelected.size >= 3) {
            showToast('Select up to 3 trips to compare.', true);
            return false;
        }
        compareSelected.add(tripId);
    } else {
        compareSelected.delete(tripId);
    }
    sessionStorage.setItem('compareSelectedIds', JSON.stringify(Array.from(compareSelected)));
    updateCompareButton();
    return true;
}

function updateCompareButton() {
    if (!compareBtnEl) return;
    const count = compareSelected.size;
    compareBtnEl.textContent = `Compare Selected (${count})`;
    compareBtnEl.disabled = count < 2;
}

function openComparePage() {
    if (compareSelected.size < 2) {
        showToast('Select at least 2 trips to compare.', true);
        return;
    }
    const idsParam = Array.from(compareSelected).join(',');
    window.location.href = `compare.html?ids=${idsParam}`;
}

function renderRating(trip) {
    const rating = Number(trip.rating || 0).toFixed(1);
    const count = trip.ratingCount || 0;
    return `⭐ ${rating} (${count})`;
}

function renderStars(tripId, ratingValue = 0) {
    const rounded = Math.round(Number(ratingValue) || 0);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const active = i <= rounded ? 'color: #fbbf24;' : 'color: rgba(255,255,255,0.4);';
        stars += `<button class="star-btn" aria-label="Rate ${i} star" onclick="rateTrip('${tripId}', ${i})" style="background: transparent; border: none; cursor: pointer; padding: 0 4px; ${active}"><i class="fa-solid fa-star"></i></button>`;
    }
    return stars;
}

async function toggleFavorite(tripId, favorite) {
    try {
        const res = await fetch('/.netlify/functions/toggleFavorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: tripId, favorite })
        });
        if (!res.ok) throw new Error('Favorite update failed');
        const data = await res.json();
        const updated = data.trip;
        allTrips = allTrips.map(t => t._id === tripId ? updated : t);
        applyFilters();
    } catch (err) {
        console.error('Favorite error:', err);
        alert('Could not update favorite.');
    }
}

async function rateTrip(tripId, value) {
    const numeric = Number(value);
    if (!value) return;
    if (Number.isNaN(numeric) || numeric < 1 || numeric > 5) {
        alert('Please choose a rating between 1 and 5.');
        return;
    }
    try {
        const res = await fetch('/.netlify/functions/rateTrip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: tripId, rating: numeric })
        });
        if (!res.ok) throw new Error('Rating failed');
        const data = await res.json();
        const updated = data.trip;
        allTrips = allTrips.map(t => t._id === tripId ? updated : t);
        applyFilters();
    } catch (err) {
        console.error('Rating error:', err);
        alert('Could not submit rating.');
    }
}

async function shareTrip(tripId, destination) {
    const days = prompt('Share duration (days, default 30):');
    const expiresInDays = Math.min(Math.max(parseInt(days) || 30, 1), 365);
    const password = prompt('Optional password (leave blank for none):');

    try {
        const res = await fetch('/.netlify/functions/createShareLink', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId, expiresInDays, password: password || null })
        });
        if (!res.ok) throw new Error('Share link failed');
        const data = await res.json();
        const shareUrl = `${window.location.origin}${data.url}`;
        await navigator.clipboard.writeText(shareUrl);
        showToast(`✅ Share link copied!\nExpires in ${data.expiresInDays} days${password ? ' (password protected)' : ''}`);
    } catch (err) {
        console.error('Share error:', err);
        showToast('❌ Could not create share link.', true);
    }
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${isError ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 0.9rem;
        z-index: 9999;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
