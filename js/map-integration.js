/**
 * Map Integration Module for Location Selection
 * Uses Leaflet + OpenStreetMap for interactive location search and selection
 */

let mapInstance = null;
let selectedMarker = null;
let locationMarkers = {};
let searchResultsLayer = null;

/**
 * Load Leaflet CSS and JS libraries from CDN
 */
async function loadLeaflet() {
    return new Promise((resolve) => {
        if (window.L) {
            resolve();
            return;
        }

        // Load Leaflet CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(cssLink);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

/**
 * Initialize map in a container
 * @param {string} containerId - ID of the map container element
 * @param {number} initialLat - Initial latitude (default: 20, world view)
 * @param {number} initialLng - Initial longitude (default: 0, world view)
 * @param {number} initialZoom - Initial zoom level (default: 2)
 * @returns {object} - Leaflet map instance
 */
async function initializeMap(containerId = 'map', initialLat = 20, initialLng = 0, initialZoom = 2) {
    await loadLeaflet();

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Map container "${containerId}" not found`);
        return null;
    }

    // Create map instance
    mapInstance = window.L.map(containerId).setView([initialLat, initialLng], initialZoom);

    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1
    }).addTo(mapInstance);

    // Handle map clicks for coordinate selection
    mapInstance.on('click', function (e) {
        const { lat, lng } = e.latlng;
        selectLocationFromCoordinates(lat, lng);
    });

    return mapInstance;
}

/**
 * Search locations by name and display on map
 * @param {string} query - Search query
 * @param {boolean} autoZoom - Auto zoom to first result
 */
async function searchLocations(query) {
    if (!query || query.trim().length < 2) {
        clearSearchResults();
        return [];
    }

    try {
        const response = await fetch(`/.netlify/functions/searchLocations?query=${encodeURIComponent(query)}&limit=10`);
        const results = await response.json();

        // Clear previous results
        clearSearchResults();

        if (!Array.isArray(results) || results.length === 0) {
            console.log('No results found');
            return [];
        }

        // Display results on map
        displayLocationResults(results);

        // Save search to history
        if (results.length > 0 && window.saveSearchToHistory) {
            saveSearchToHistory(
                'location',
                query,
                { searchType: 'map-location' },
                results.map(r => r.displayName),
                results.length
            );
        }

        return results;
    } catch (error) {
        console.error('Location search failed:', error);
        return [];
    }
}

/**
 * Display search results on map
 * @param {array} results - Array of location results
 */
function displayLocationResults(results) {
    if (!mapInstance) return;

    // Create marker cluster group
    searchResultsLayer = window.L.featureGroup();

    results.forEach((result, index) => {
        const marker = window.L.marker([result.lat, result.lng], {
            title: result.displayName,
            alt: result.displayName
        })
            .bindPopup(`
                <div style="min-width: 150px;">
                    <strong>${result.name}</strong><br>
                    ${result.state ? result.state + ', ' : ''}${result.country}<br>
                    <button onclick="selectLocationFromMarker(${result.lat}, ${result.lng}, '${result.displayName.replace(/'/g, "\\'")}')">
                        Select
                    </button>
                </div>
            `)
            .on('click', function () {
                this.openPopup();
            });

        searchResultsLayer.addLayer(marker);
        locationMarkers[result.displayName] = marker;
    });

    mapInstance.addLayer(searchResultsLayer);

    // Fit map to bounds of results
    if (results.length > 0) {
        const bounds = searchResultsLayer.getBounds();
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
}

/**
 * Clear search results from map
 */
function clearSearchResults() {
    if (searchResultsLayer && mapInstance) {
        mapInstance.removeLayer(searchResultsLayer);
        searchResultsLayer = null;
        locationMarkers = {};
    }
}

/**
 * Select a location from marker click
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Location name
 */
function selectLocationFromMarker(lat, lng, name) {
    selectLocationFromCoordinates(lat, lng, name);
}

/**
 * Select a location from map coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Location name (optional)
 */
async function selectLocationFromCoordinates(lat, lng, name = null) {
    if (!mapInstance) return;

    // Remove previous selection marker
    if (selectedMarker) {
        mapInstance.removeLayer(selectedMarker);
    }

    // Add new selection marker (red, larger)
    selectedMarker = window.L.circleMarker([lat, lng], {
        color: '#ef4444',
        fillColor: '#fca5a5',
        fillOpacity: 0.7,
        radius: 8,
        weight: 3
    }).addTo(mapInstance);

    // Zoom to selected location
    mapInstance.flyTo([lat, lng], 10);

    // If no name provided, do reverse geocoding
    let locationName = name;
    if (!locationName) {
        locationName = await reverseGeocode(lat, lng);
    }

    // Update UI with selected location
    updateSelectedLocation(lat, lng, locationName);

    // Save location to database for analytics
    saveLocationSearch(locationName, lat, lng);
}

/**
 * Reverse geocode coordinates to get location name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} - Location name
 */
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(`/.netlify/functions/searchLocations?lat=${lat}&lng=${lng}`);
        const result = await response.json();
        return result.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

/**
 * Update selected location in the UI form
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Location name
 */
function updateSelectedLocation(lat, lng, name) {
    // Update destination field if it exists
    const destinationField = document.getElementById('destination');
    if (destinationField) {
        destinationField.value = name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        destinationField.dataset.lat = lat;
        destinationField.dataset.lng = lng;
        destinationField.dispatchEvent(new Event('change'));
    }

    // Update starting city field if it exists
    const startCityField = document.getElementById('starting-city');
    if (startCityField && !startCityField.value) {
        startCityField.value = name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        startCityField.dataset.lat = lat;
        startCityField.dataset.lng = lng;
        startCityField.dispatchEvent(new Event('change'));
    }

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('locationSelected', {
        detail: { name, lat, lng }
    }));
}

/**
 * Save location search to database
 * @param {string} name - Location name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function saveLocationSearch(name, lat, lng) {
    try {
        const country = name.split(',').pop().trim();
        await fetch('/.netlify/functions/searchLocations', {
            method: 'POST',
            body: JSON.stringify({
                name: name.split(',')[0].trim(),
                country: country,
                lat: lat,
                lng: lng,
                displayName: name
            })
        });
    } catch (error) {
        console.error('Failed to save location:', error);
    }
}

/**
 * Add search input with autocomplete above map
 * @param {string} containerId - ID of the container to add search input
 */
function addLocationSearchInput(containerId = 'map-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'location-search-wrapper';
    searchWrapper.innerHTML = `
        <div style="position: relative; margin-bottom: 15px;">
            <input
                type="text"
                id="location-search-input"
                placeholder="Search for a city or location..."
                class="location-search-input"
                style="
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 2px solid rgba(99, 102, 241, 0.3);
                    border-radius: 10px;
                    font-size: 1rem;
                    font-family: inherit;
                    color: #1e293b;
                "
            />
            <div id="location-suggestions" class="location-suggestions"
                style="
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-top: none;
                    border-radius: 0 0 10px 10px;
                    max-height: 300px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                "
            ></div>
        </div>
    `;

    // Insert search wrapper at the beginning of container
    container.insertBefore(searchWrapper, container.firstChild);

    // Add search input event listener
    const searchInput = document.getElementById('location-search-input');
    const suggestionsList = document.getElementById('location-suggestions');

    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value;
        if (query.length < 2) {
            suggestionsList.style.display = 'none';
            clearSearchResults();
            return;
        }

        const results = await searchLocations(query);
        displaySuggestions(results, suggestionsList);
    }, 300));

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && !searchInput.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
    });
}

/**
 * Display suggestions in dropdown
 * @param {array} results - Search results
 * @param {element} container - Suggestions container
 */
function displaySuggestions(results, container) {
    if (!results || results.length === 0) {
        container.innerHTML = '<div style="padding: 10px; color: #94a3b8;">No results found</div>';
        container.style.display = 'block';
        return;
    }

    container.innerHTML = results
        .map(
            (result) => `
        <div onclick="selectLocationFromMarker(${result.lat}, ${result.lng}, '${result.displayName.replace(/'/g, "\\'")}'); document.getElementById('location-suggestions').style.display='none';"
             style="
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f1f5f9;
                transition: background-color 0.2s;
                color: #1e293b;
            "
             onmouseover="this.style.backgroundColor='#f1f5f9'"
             onmouseout="this.style.backgroundColor='white'">
            <strong>${result.name}</strong><br>
            <small style="color: #94a3b8">${result.state ? result.state + ', ' : ''}${result.country}</small>
        </div>
    `
        )
        .join('');

    container.style.display = 'block';
}

/**
 * Debounce helper function
 * @param {function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 */
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Get selected location data
 * @returns {object} - { name, lat, lng } or null
 */
function getSelectedLocation() {
    const destinationField = document.getElementById('destination');
    if (destinationField && destinationField.dataset.lat && destinationField.dataset.lng) {
        return {
            name: destinationField.value,
            lat: parseFloat(destinationField.dataset.lat),
            lng: parseFloat(destinationField.dataset.lng)
        };
    }
    return null;
}

/**
 * Center map on location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level
 */
function centerMapOnLocation(lat, lng, zoom = 12) {
    if (!mapInstance) return;
    mapInstance.flyTo([lat, lng], zoom);
}

// Export functions to window for global access
window.initializeMap = initializeMap;
window.searchLocations = searchLocations;
window.selectLocationFromCoordinates = selectLocationFromCoordinates;
window.selectLocationFromMarker = selectLocationFromMarker;
window.getSelectedLocation = getSelectedLocation;
window.centerMapOnLocation = centerMapOnLocation;
window.addLocationSearchInput = addLocationSearchInput;
window.loadLeaflet = loadLeaflet;
