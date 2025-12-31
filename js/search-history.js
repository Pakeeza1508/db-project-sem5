/**
 * Search History Module
 * Tracks and displays user's search history
 */

let searchHistory = [];
let searchHistoryVisible = false;

/**
 * Initialize search history system
 */
async function initSearchHistory() {
    // Add search history icon to header
    addSearchHistoryIcon();
    
    // Load user's search history
    await loadSearchHistory();
}

/**
 * Add search history icon to header
 */
function addSearchHistoryIcon() {
    const headerNav = document.querySelector('.header-nav');
    if (!headerNav) return;

    // Check if already added
    if (document.getElementById('search-history-btn')) return;

    const historyWrapper = document.createElement('div');
    historyWrapper.className = 'search-history-wrapper';
    historyWrapper.innerHTML = `
        <button id="search-history-btn" class="search-history-btn" aria-label="Search History">
            <i class="fa-solid fa-clock-rotate-left"></i>
        </button>
        
        <div id="search-history-panel" class="search-history-panel" style="display: none;">
            <div class="search-history-header">
                <h3>Recent Searches</h3>
                <div class="search-history-actions">
                    <button id="clear-history-btn" class="text-btn">Clear All</button>
                    <button id="close-history-btn" class="text-btn"><i class="fa-solid fa-times"></i></button>
                </div>
            </div>
            
            <div class="search-history-tabs">
                <button class="history-tab active" data-tab="all">All</button>
                <button class="history-tab" data-tab="budget-search">Budget</button>
                <button class="history-tab" data-tab="planner">Planner</button>
                <button class="history-tab" data-tab="location">Locations</button>
            </div>
            
            <div id="search-history-list" class="search-history-list">
                <div class="history-empty">
                    <i class="fa-solid fa-clock"></i>
                    <p>No search history yet</p>
                </div>
            </div>
            
            <div class="search-history-stats" id="search-stats"></div>
        </div>
    `;

    // Insert near notification bell
    const alertBell = document.querySelector('.alert-bell-wrapper');
    if (alertBell) {
        headerNav.insertBefore(historyWrapper, alertBell);
    } else {
        const authPlaceholder = headerNav.querySelector('.nav-link[href*="login"]');
        if (authPlaceholder) {
            headerNav.insertBefore(historyWrapper, authPlaceholder.parentElement);
        } else {
            headerNav.appendChild(historyWrapper);
        }
    }

    // Add event listeners
    document.getElementById('search-history-btn').addEventListener('click', toggleSearchHistory);
    document.getElementById('clear-history-btn').addEventListener('click', clearAllHistory);
    document.getElementById('close-history-btn').addEventListener('click', () => {
        document.getElementById('search-history-panel').style.display = 'none';
    });

    // Tab switching
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            displaySearchHistory(e.target.dataset.tab);
        });
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('search-history-panel');
        const btn = document.getElementById('search-history-btn');
        if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
            panel.style.display = 'none';
        }
    });

    // Add styles
    addSearchHistoryStyles();
}

/**
 * Toggle search history panel
 */
function toggleSearchHistory() {
    const panel = document.getElementById('search-history-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        loadSearchHistory();
    } else {
        panel.style.display = 'none';
    }
}

/**
 * Load user's search history from backend
 */
async function loadSearchHistory() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || 'anonymous';
        
        const response = await fetch(`/.netlify/functions/searchHistory?userId=${userId}&limit=50`);
        const data = await response.json();
        
        if (data.success) {
            searchHistory = data.history;
            displaySearchHistory('all');
            displaySearchStats(data.stats);
        }
    } catch (error) {
        console.error('Failed to load search history:', error);
    }
}

/**
 * Display search history
 */
function displaySearchHistory(filterType = 'all') {
    const historyList = document.getElementById('search-history-list');
    if (!historyList) return;

    let filtered = searchHistory;
    if (filterType !== 'all') {
        filtered = searchHistory.filter(h => h.searchType === filterType);
    }

    if (filtered.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fa-solid fa-clock"></i>
                <p>No ${filterType === 'all' ? '' : filterType + ' '}searches yet</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = filtered.map(search => createSearchHistoryItem(search)).join('');
}

/**
 * Create search history item HTML
 */
function createSearchHistoryItem(search) {
    const timeAgo = formatTimeAgo(search.searchedAt);
    let icon, title, details, actionHtml;

    switch (search.searchType) {
        case 'budget-search':
            icon = '💰';
            title = 'Budget Search';
            details = `
                <div class="history-details">
                    ${search.filters.startingCity ? `From: ${search.filters.startingCity}` : ''}
                    ${search.filters.budget ? ` • Budget: ₨${parseInt(search.filters.budget).toLocaleString()}` : ''}
                    ${search.filters.days ? ` • ${search.filters.days} days` : ''}
                    ${search.filters.travelType ? ` • ${search.filters.travelType}` : ''}
                </div>
            `;
            actionHtml = `<button class="history-action-btn" onclick="rerunBudgetSearch('${search._id}')">Search Again</button>`;
            break;

        case 'planner':
            icon = '🗺️';
            title = 'Trip Planner';
            details = `
                <div class="history-details">
                    ${search.filters.destination || search.query || 'Unknown destination'}
                    ${search.filters.days ? ` • ${search.filters.days} days` : ''}
                    ${search.filters.style ? ` • ${search.filters.style}` : ''}
                    ${search.filters.budget ? ` • ${search.filters.budget}` : ''}
                </div>
            `;
            actionHtml = `<button class="history-action-btn" onclick="rerunPlannerSearch('${search._id}')">Plan Again</button>`;
            break;

        case 'location':
            icon = '📍';
            title = 'Location Search';
            details = `
                <div class="history-details">
                    ${search.query || 'Location search'}
                    ${search.resultCount ? ` • ${search.resultCount} results` : ''}
                </div>
            `;
            actionHtml = `<button class="history-action-btn" onclick="rerunLocationSearch('${search.query}')">Search Again</button>`;
            break;

        case 'destination':
            icon = '🌍';
            title = 'Destination Search';
            details = `
                <div class="history-details">
                    ${search.query || search.filters.destination || 'Destination'}
                </div>
            `;
            actionHtml = `<button class="history-action-btn" onclick="searchDestination('${search.query}')">Search Again</button>`;
            break;

        default:
            icon = '🔍';
            title = 'Search';
            details = `<div class="history-details">${search.query || 'Search'}</div>`;
            actionHtml = '';
    }

    return `
        <div class="history-item" data-search-id="${search._id}">
            <div class="history-icon">${icon}</div>
            <div class="history-content">
                <div class="history-title">${title}</div>
                ${details}
                <div class="history-time">${timeAgo}</div>
            </div>
            <div class="history-actions">
                ${actionHtml}
                <button class="history-delete-btn" onclick="deleteSearch('${search._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Display search statistics
 */
function displaySearchStats(stats) {
    const statsContainer = document.getElementById('search-stats');
    if (!statsContainer || !stats) return;

    const mostSearched = stats.mostSearchedDestinations || [];
    
    statsContainer.innerHTML = `
        <div class="stats-header">Your Search Patterns</div>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.totalSearches || 0}</div>
                <div class="stat-label">Total Searches</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.budgetSearchCount || 0}</div>
                <div class="stat-label">Budget Searches</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.plannerSearchCount || 0}</div>
                <div class="stat-label">Trips Planned</div>
            </div>
        </div>
        ${mostSearched.length > 0 ? `
            <div class="most-searched">
                <div class="most-searched-header">Most Searched Destinations</div>
                ${mostSearched.map(dest => `
                    <div class="most-searched-item">
                        <span class="dest-name">${dest.destination}</span>
                        <span class="dest-count">${dest.count} time${dest.count > 1 ? 's' : ''}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

/**
 * Save search to history
 */
async function saveSearchToHistory(searchType, query, filters, results = null, resultCount = 0) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || 'anonymous';

        await fetch('/.netlify/functions/searchHistory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                searchType,
                query,
                filters,
                results,
                resultCount
            })
        });

        // Reload history to update UI
        await loadSearchHistory();
    } catch (error) {
        console.error('Failed to save search history:', error);
    }
}

/**
 * Clear all search history
 */
async function clearAllHistory() {
    if (!confirm('Are you sure you want to clear all search history?')) {
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || 'anonymous';
        
        const response = await fetch(`/.netlify/functions/searchHistory?userId=${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            searchHistory = [];
            displaySearchHistory('all');
            displaySearchStats({ totalSearches: 0 });
            if (window.showToast) {
                showToast('Search history cleared', 'success');
            }
        }
    } catch (error) {
        console.error('Failed to clear history:', error);
        if (window.showToast) {
            showToast('Failed to clear history', 'error');
        }
    }
}

/**
 * Delete a single search from history
 */
async function deleteSearch(searchId) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || 'anonymous';
        
        const response = await fetch(`/.netlify/functions/searchHistory?userId=${userId}&searchId=${searchId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            // Remove from local array
            searchHistory = searchHistory.filter(s => s._id !== searchId);
            
            // Re-render current view
            const activeTab = document.querySelector('.history-tab.active');
            displaySearchHistory(activeTab ? activeTab.dataset.tab : 'all');
            
            if (window.showToast) {
                showToast('Search removed', 'success');
            }
        }
    } catch (error) {
        console.error('Failed to delete search:', error);
    }
}

/**
 * Rerun budget search from history
 */
function rerunBudgetSearch(searchId) {
    const search = searchHistory.find(s => s._id === searchId);
    if (!search || search.searchType !== 'budget-search') return;

    // Redirect to budget search with prefilled data
    const params = new URLSearchParams({
        budget: search.filters.budget || '',
        days: search.filters.days || '',
        startingCity: search.filters.startingCity || '',
        travelType: search.filters.travelType || ''
    });

    window.location.href = `budget-search.html?${params.toString()}`;
}

/**
 * Rerun planner search from history
 */
function rerunPlannerSearch(searchId) {
    const search = searchHistory.find(s => s._id === searchId);
    if (!search || search.searchType !== 'planner') return;

    // Store data and redirect
    sessionStorage.setItem('prefilledDestination', search.filters.destination || search.query || '');
    sessionStorage.setItem('prefilledDays', search.filters.days || '');
    sessionStorage.setItem('prefilledStyle', search.filters.style || '');
    sessionStorage.setItem('prefilledBudget', search.filters.budget || '');
    sessionStorage.setItem('fromHistory', 'true');

    window.location.href = 'planner.html';
}

/**
 * Rerun location search
 */
function rerunLocationSearch(query) {
    if (window.searchLocations) {
        searchLocations(query);
    }
}

/**
 * Search destination
 */
function searchDestination(query) {
    window.location.href = `planner.html?destination=${encodeURIComponent(query)}`;
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
}

/**
 * Add search history styles
 */
function addSearchHistoryStyles() {
    if (document.getElementById('search-history-styles')) return;

    const style = document.createElement('style');
    style.id = 'search-history-styles';
    style.textContent = `
        .search-history-wrapper {
            position: relative;
            display: inline-block;
            margin-right: 10px;
        }

        .search-history-btn {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: var(--text);
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.3s;
        }

        .search-history-btn:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: #3b82f6;
        }

        .search-history-panel {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            width: 450px;
            max-width: 90vw;
            max-height: 600px;
            background: rgba(30, 41, 59, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .search-history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-history-header h3 {
            color: var(--text);
            margin: 0;
            font-size: 1.1rem;
        }

        .search-history-actions {
            display: flex;
            gap: 10px;
        }

        .search-history-tabs {
            display: flex;
            gap: 5px;
            padding: 10px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            overflow-x: auto;
        }

        .history-tab {
            background: none;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .history-tab:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .history-tab.active {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .search-history-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .history-empty {
            padding: 40px 20px;
            text-align: center;
            color: var(--text-muted);
        }

        .history-empty i {
            font-size: 2.5rem;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        .history-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            transition: background 0.2s;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .history-item:hover {
            background: rgba(255, 255, 255, 0.03);
        }

        .history-icon {
            font-size: 1.8rem;
            flex-shrink: 0;
        }

        .history-content {
            flex: 1;
            min-width: 0;
        }

        .history-title {
            color: var(--text);
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 4px;
        }

        .history-details {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .history-time {
            color: var(--text-muted);
            font-size: 0.75rem;
            opacity: 0.7;
        }

        .history-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .history-action-btn {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            white-space: nowrap;
            transition: all 0.2s;
        }

        .history-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .history-delete-btn {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s;
        }

        .history-delete-btn:hover {
            background: rgba(239, 68, 68, 0.2);
        }

        .search-history-stats {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 15px;
            background: rgba(0, 0, 0, 0.1);
        }

        .stats-header {
            color: var(--text);
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 0.9rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }

        .stat-item {
            text-align: center;
            padding: 10px;
            background: rgba(99, 102, 241, 0.05);
            border-radius: 8px;
        }

        .stat-value {
            color: var(--primary);
            font-size: 1.5rem;
            font-weight: 700;
        }

        .stat-label {
            color: var(--text-muted);
            font-size: 0.75rem;
            margin-top: 4px;
        }

        .most-searched {
            margin-top: 12px;
        }

        .most-searched-header {
            color: var(--text);
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .most-searched-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.85rem;
        }

        .dest-name {
            color: var(--text);
        }

        .dest-count {
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(style);
}

// Export functions
window.initSearchHistory = initSearchHistory;
window.saveSearchToHistory = saveSearchToHistory;
window.rerunBudgetSearch = rerunBudgetSearch;
window.rerunPlannerSearch = rerunPlannerSearch;
window.rerunLocationSearch = rerunLocationSearch;
window.searchDestination = searchDestination;
window.deleteSearch = deleteSearch;
window.clearAllHistory = clearAllHistory;
