// Trip Planner App - Full AI-Powered
let currentTripData = null;
let fullTripResult = null;
let editMode = false;
let editTripId = null;
window.cacheSource = { geocode: false, weather: false, ai: false };

document.addEventListener('DOMContentLoaded', () => {
    const tripForm = document.getElementById('trip-form');
    const destinationInput = document.getElementById('destination');
    const backBtn = document.getElementById('back-btn');
    const saveTripBtn = document.getElementById('save-trip-btn');

    // Initialize alert system
    if (window.initAlertSystem) {
        initAlertSystem();
    }

    // Initialize search history
    if (window.initSearchHistory) {
        initSearchHistory();
    }

    // Initialize destination map
    let destinationMapInitialized = false;
    const showDestinationMapBtn = document.getElementById('show-destination-map-btn');
    const closeDestinationMapBtn = document.getElementById('close-destination-map-btn');
    const destinationMapSection = document.getElementById('destination-map-section');

    if (showDestinationMapBtn && closeDestinationMapBtn && destinationMapSection) {
        showDestinationMapBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            destinationMapSection.classList.add('show');
            
            // Initialize map on first show
            if (!destinationMapInitialized) {
                try {
                    await initializeMap('destination-map', 30, 70, 4); // Center on South Asia
                    addLocationSearchInput('destination-map-container');
                    destinationMapInitialized = true;
                } catch (error) {
                    console.error('Destination map initialization failed:', error);
                    destinationMapSection.classList.remove('show');
                }
            }
        });

        closeDestinationMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            destinationMapSection.classList.remove('show');
        });
    }

    // Check for prefilled data from budget search
    if (sessionStorage.getItem('fromBudgetSearch') === 'true') {
        const destination = sessionStorage.getItem('prefilledDestination');
        const days = sessionStorage.getItem('prefilledDays');
        
        if (destination) document.getElementById('destination').value = destination;
        if (days) document.getElementById('days').value = days;
        
        // Clear flag
        sessionStorage.removeItem('fromBudgetSearch');
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Check for prefilled data from search history
    if (sessionStorage.getItem('fromHistory') === 'true') {
        const destination = sessionStorage.getItem('prefilledDestination');
        const days = sessionStorage.getItem('prefilledDays');
        const style = sessionStorage.getItem('prefilledStyle');
        const budget = sessionStorage.getItem('prefilledBudget');
        
        if (destination) document.getElementById('destination').value = destination;
        if (days) document.getElementById('travel-days').value = days;
        if (style) document.getElementById('travel-style').value = style;
        if (budget) document.getElementById('budget').value = budget;
        
        // Clear flags
        sessionStorage.removeItem('fromHistory');
        sessionStorage.removeItem('prefilledDestination');
        sessionStorage.removeItem('prefilledDays');
        sessionStorage.removeItem('prefilledStyle');
        sessionStorage.removeItem('prefilledBudget');
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Check for edit mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('edit')) {
        editTripId = urlParams.get('edit');
        editMode = true;
        loadTripForEditing(editTripId);
    }

    // Form submission
    tripForm.addEventListener('submit', handleFormSubmit);

    // Back button
    backBtn.addEventListener('click', () => {
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('form-section').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Clear cache badges when going back
        document.getElementById('cache-geocode').style.display = 'none';
        document.getElementById('cache-weather').style.display = 'none';
        document.getElementById('cache-ai').style.display = 'none';
    });

    // Save Trip button
    if (saveTripBtn) {
        saveTripBtn.addEventListener('click', handleSaveTrip);
    }

    // Map View Toggle
    const toggleMapViewBtn = document.getElementById('toggle-map-view-btn');
    const closeMapViewBtn = document.getElementById('close-map-view-btn');
    const mapViewCard = document.getElementById('map-view-card');
    let tripMapInitialized = false;

    if (toggleMapViewBtn && closeMapViewBtn && mapViewCard) {
        toggleMapViewBtn.addEventListener('click', async () => {
            mapViewCard.style.display = 'block';
            
            // Scroll to map view
            mapViewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Initialize and display trip on map
            if (!tripMapInitialized && currentTripData) {
                try {
                    await initializeTripMap();
                    tripMapInitialized = true;
                } catch (error) {
                    console.error('Trip map initialization failed:', error);
                    alert('Failed to load map. Please try again.');
                    mapViewCard.style.display = 'none';
                }
            }
        });

        closeMapViewBtn.addEventListener('click', () => {
            mapViewCard.style.display = 'none';
        });
    }

    // Destination autocomplete
    let debounceTimer;
    destinationInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value;
        if (query.length < 3) {
            document.getElementById('destination-suggestions').style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(() => fetchDestinationSuggestions(query), 300);
    });

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-wrapper')) {
            document.getElementById('destination-suggestions').style.display = 'none';
        }
    });
});

async function fetchDestinationSuggestions(query) {
    const suggestionsBox = document.getElementById('destination-suggestions');

    // Show loading state
    suggestionsBox.style.display = 'block';
    suggestionsBox.innerHTML = '<div class="suggestion-item" style="cursor: default;"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1&featuretype=city`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        suggestionsBox.innerHTML = '';

        if (data.length > 0) {
            suggestionsBox.style.display = 'block';
            const seenNames = new Set();

            data.forEach(place => {
                // Format display name: City, Country
                let displayName = place.display_name;
                if (place.address) {
                    const city = place.address.city || place.address.town || place.address.village || place.name;
                    const country = place.address.country;
                    if (city && country) {
                        displayName = `${city}, ${country}`;
                    }
                }

                // Skip duplicates
                if (seenNames.has(displayName)) return;
                seenNames.add(displayName);

                const div = document.createElement('div');
                div.className = 'suggestion-item';

                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i>
                        <div>
                            <div style="font-weight: 600; color: var(--text);">${displayName.split(',')[0]}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${displayName}</div>
                        </div>
                    </div>
                `;

                div.addEventListener('click', () => {
                    document.getElementById('destination').value = displayName.split(',')[0]; // Just the city name
                    suggestionsBox.style.display = 'none';
                });
                suggestionsBox.appendChild(div);
            });
        } else {
            suggestionsBox.innerHTML = '<div class="suggestion-item" style="cursor: default; color: var(--text-muted);">No results found</div>';
        }
    } catch (e) {
        console.error('Autocomplete Error:', e);
        suggestionsBox.style.display = 'none';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    let destination = document.getElementById('destination').value.trim();
    const travelDays = document.getElementById('travel-days').value;
    const travelStyle = document.getElementById('travel-style').value;
    const budget = document.getElementById('budget').value;
    const preferences = document.getElementById('preferences').value.trim();

    if (!travelDays || !travelStyle || !budget) {
        alert('Please fill in all required fields');
        return;
    }

    // Show loader
    document.getElementById('trip-form').style.display = 'none';
    document.getElementById('form-loader').style.display = 'flex';

    try {
        let geoData;
        
        // If no destination provided, use current location and suggest destinations
        if (!destination) {
            // Get user's current location
            const userLocation = await getUserCurrentLocation();
            
            if (!userLocation) {
                throw new Error('Could not determine your location. Please enter a destination or enable location services.');
            }

            // Get nearby destinations based on budget
            const nearbyDestinations = await getNearbyDestinationsForBudget(
                userLocation.lat, 
                userLocation.lon, 
                budget, 
                travelDays
            );

            if (nearbyDestinations && nearbyDestinations.length > 0) {
                // Pick the best matching destination
                destination = nearbyDestinations[0].destination;
                geoData = await getCoordinates(destination);
            } else {
                throw new Error('No destinations found within your budget. Please try a different budget or enter a specific destination.');
            }
        } else {
            // Get coordinates for the specified destination
            geoData = await getCoordinates(destination);
        }

        if (!geoData) {
            throw new Error('Location not found');
        }

        const { lat, lon, name, country } = geoData;

        // Store trip data
        currentTripData = {
            destination: name || destination,
            travelDays,
            travelStyle,
            budget,
            preferences
        };

        // Fetch weather
        const weatherData = await fetchWeather(lat, lon);

        // Generate AI trip plan
        await generateTripPlan(name, country, travelDays, travelStyle, budget, preferences, weatherData);

        // Update overview
        updateOverview(name, travelDays, travelStyle, budget);

        // Update weather display
        updateWeatherDisplay(weatherData);

        // Save search to history
        if (window.saveSearchToHistory) {
            saveSearchToHistory(
                'planner',
                name || destination,
                {
                    destination: name || destination,
                    days: travelDays,
                    style: travelStyle,
                    budget: budget,
                    preferences: preferences
                },
                null,
                1
            );
        }

        // Show results
        document.getElementById('form-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show cache status badges
        updateCacheBadges();

        // Load nearby suggestions
        if (window.fetchNearbyDestinations && window.displayNearbySuggestions) {
            setTimeout(async () => {
                try {
                    const nearbyData = await fetchNearbyDestinations(name || destination, lat, lon);
                    if (nearbyData && nearbyData.suggestions.length > 0) {
                        displayNearbySuggestions(nearbyData, 'nearby-suggestions');
                        // Show the nearby card
                        const nearbyCard = document.querySelector('.nearby-card');
                        if (nearbyCard) {
                            nearbyCard.style.display = 'block';
                        }
                    }
                } catch (error) {
                    console.error('Failed to load nearby suggestions:', error);
                }
            }, 1000); // Load after main content
        }

    } catch (error) {
        console.error('Error generating trip:', error);
        alert(`Failed to generate trip plan: ${error.message}`);
        document.getElementById('trip-form').style.display = 'block';
        document.getElementById('form-loader').style.display = 'none';
    }
}

// Get user's current location using browser geolocation
async function getUserCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                try {
                    // Reverse geocode to get location name
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await response.json();
                    
                    resolve({
                        lat: lat,
                        lon: lon,
                        name: data.address?.city || data.address?.town || data.address?.state || 'Your Location',
                        country: data.address?.country || ''
                    });
                } catch (error) {
                    resolve({ lat, lon, name: 'Your Location', country: '' });
                }
            },
            (error) => {
                console.warn('Geolocation error:', error);
                resolve(null); // Don't reject, just return null
            },
            { timeout: 5000, enableHighAccuracy: false }
        );
    });
}

// Get nearby destinations that match the budget
async function getNearbyDestinationsForBudget(lat, lon, budget, days) {
    try {
        // Get user's location name first
        const reverseGeo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const locationData = await reverseGeo.json();
        const startingCity = locationData.address?.city || locationData.address?.town || locationData.address?.state || 'Your Location';

        // Convert budget range to numeric value
        let budgetValue;
        if (budget === 'Budget') budgetValue = 75 * days; // $75/day average
        else if (budget === 'Mid-range') budgetValue = 175 * days; // $175/day average
        else budgetValue = 300 * days; // $300/day average for luxury

        // Call the budget search API
        const response = await fetch(
            `/.netlify/functions/getDestinationsByBudget?budget=${budgetValue}&days=${days}&startingCity=${encodeURIComponent(startingCity)}&travelType=flight`
        );
        
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.recommendations || [];
    } catch (error) {
        console.error('Error fetching nearby destinations:', error);
        return null;
    }
}

async function getCoordinates(city) {
    try {
        // Check cache first
        const cacheRes = await fetch(`/.netlify/functions/getCachedGeocode?query=${encodeURIComponent(city)}`);
        if (cacheRes.ok) {
            const cacheData = await cacheRes.json();
            if (cacheData.fromCache) {
                console.log('✅ Geocode loaded from cache');
                window.cacheSource = { ...window.cacheSource, geocode: true };
                return cacheData.data.length > 0 ? cacheData.data[0] : null;
            }
        }
    } catch (e) {
        console.log('Cache check failed, fetching from API');
    }

    // Fetch from API if not in cache
    const url = `/.netlify/functions/geocode?city=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch coordinates');
    const data = await res.json();

    // Store in cache for future use
    if (data.length > 0) {
        fetch(`/.netlify/functions/getCachedGeocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: city, data })
        }).catch(e => console.log('Cache save failed:', e));
        window.cacheSource = { ...window.cacheSource, geocode: false };
    }

    return data.length > 0 ? data[0] : null;
}

async function fetchWeather(lat, lon) {
    try {
        // Check cache first
        const cacheRes = await fetch(`/.netlify/functions/getCachedWeather?lat=${lat}&lon=${lon}`);
        if (cacheRes.ok) {
            const cacheData = await cacheRes.json();
            if (cacheData.fromCache) {
                console.log('✅ Weather loaded from cache');
                window.cacheSource = { ...window.cacheSource, weather: true };
                return cacheData.data;
            }
        }
    } catch (e) {
        console.log('Cache check failed, fetching from API');
    }

    // Fetch from API if not in cache
    const url = `/.netlify/functions/weather?lat=${lat}&lon=${lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();

    // Store in cache for future use
    fetch(`/.netlify/functions/getCachedWeather`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, data })
    }).catch(e => console.log('Cache save failed:', e));
    window.cacheSource = { ...window.cacheSource, weather: false };

    return data;
}

function updateCacheBadges() {
    if (window.cacheSource.geocode) {
        document.getElementById('cache-geocode').style.display = 'inline-flex';
    }
    if (window.cacheSource.weather) {
        document.getElementById('cache-weather').style.display = 'inline-flex';
    }
    if (window.cacheSource.ai) {
        document.getElementById('cache-ai').style.display = 'inline-flex';
    }
}

function updateCacheBadges() {
    // Show green badges for cached data sources
    if (window.cacheSource.geocode) {
        document.getElementById('cache-geocode').style.display = 'inline-flex';
    }
    if (window.cacheSource.weather) {
        document.getElementById('cache-weather').style.display = 'inline-flex';
    }
    if (window.cacheSource.ai) {
        document.getElementById('cache-ai').style.display = 'inline-flex';
    }
}

function updateWeatherDisplay(data) {
    document.getElementById('weather-temp').innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weather-description').innerText = data.weather[0].description;
    document.getElementById('weather-humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('weather-wind').innerText = `${data.wind.speed} m/s`;

    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weather-icon-display').innerHTML = `<img src="${iconUrl}" alt="Weather Icon" style="width: 80px; height: 80px;">`;
}

function updateOverview(destination, days, style, budget) {
    document.getElementById('overview-destination').innerText = destination;
    document.getElementById('overview-duration').innerText = `${days} ${days == 1 ? 'day' : 'days'}`;
    document.getElementById('overview-style').innerText = style;
    document.getElementById('overview-budget').innerText = budget;
}

async function generateTripPlan(city, country, days, style, budget, preferences, weather) {
    // Get budget search context if available
    const startingCity = sessionStorage.getItem('startingCity') || '';
    const travelType = sessionStorage.getItem('travelType') || '';
    const tripBudget = sessionStorage.getItem('tripBudget') || budget;
    const budgetContext = startingCity ? `\n- Starting from: ${startingCity}\n- Travel Type: ${travelType}\n- Total Budget: ${tripBudget} PKR` : '';
    
    const prompt = `You are an expert travel planner. Create a comprehensive ${days}-day trip plan for ${city}, ${country}.

Trip Details:
- Duration: ${days} days
- Travel Style: ${style}
- Budget: ${budget}${budgetContext}
- Additional Preferences: ${preferences || 'None'}
- Current Weather: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°C

IMPORTANT SEASONAL GUIDANCE:
- Check the current month and provide seasonal warnings if applicable
- Mention best months to visit ${city}
- Warn about monsoon season, extreme heat, or winter closures if relevant

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.

Provide this exact JSON structure:
{
    "seasonalInfo": {
        "currentMonth": "Current month",
        "bestMonths": ["Month1", "Month2"],
        "warning": "Any seasonal warnings or recommendations"
    },
  "itinerary": [
    {
      "day": "Day 1",
      "theme": "Theme for the day",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "location": "Specific location",
          "description": "Brief description",
          "cost": "$XX"
        }
      ]
    }
  ],
  "hotels": [
    {
      "name": "Hotel Name",
      "rating": "4.5",
      "pricePerNight": "$150",
      "amenities": ["WiFi", "Breakfast", "Pool"],
      "description": "Brief description",
      "bookingLink": "https://www.booking.com/searchresults.html?ss=Hotel+Name"
    }
  ],
  "costs": {
    "accommodation": "$XXX",
    "transportation": "$XXX",
    "food": "$XXX",
    "activities": "$XXX",
    "total": "$XXX"
  },
  "packing": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6", "Item 7", "Item 8"],
  "tips": [
    "Tip 1 about the destination",
    "Tip 2 about local customs",
    "Tip 3 about transportation",
    "Tip 4 about safety",
    "Tip 5 about best times to visit attractions"
  ]
}

Make sure:
1. Activities match the ${style} travel style
2. Costs align with ${budget} budget
3. Include specific restaurant recommendations for meals
4. Provide realistic timing (8 AM - 10 PM daily)
5. Include ${days} complete days in the itinerary
6. Hotels should have real-sounding names appropriate for ${city}
7. All costs should be in USD`;

    try {
        // Check cache first
        const crypto = await import('crypto').catch(() => null);
        let queryHash;
        
        try {
            const hashInput = `${city}-${days}-${style}-${budget}`;
            queryHash = Array.from(new TextEncoder().encode(hashInput))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .slice(0, 32);
        } catch (e) {
            queryHash = btoa(`${city}-${days}-${style}-${budget}`).slice(0, 32);
        }

        const cacheRes = await fetch(`/.netlify/functions/getCachedAIResponse?queryHash=${queryHash}`);
        if (cacheRes.ok) {
            const cacheData = await cacheRes.json();
            if (cacheData.fromCache) {
                console.log('✅ AI response loaded from cache');
                window.cacheSource = { ...window.cacheSource, ai: true };
                renderAllSections(cacheData.data);
                fullTripResult = {
                    destination: `${city}, ${country}`,
                    travelDays: days,
                    travelStyle: style,
                    budget: budget,
                    preferences: preferences,
                    weather: weather,
                    ...cacheData.data
                };
                
                // Reset save button for new trip
                const saveBtn = document.getElementById('save-trip-btn');
                if (saveBtn) {
                    saveBtn.dataset.saved = 'false';
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fa-solid fa-database"></i> Save to Database';
                    saveBtn.style.opacity = '1';
                    saveBtn.style.cursor = 'pointer';
                }
                
                return;
            }
        }
    } catch (e) {
        console.log('Cache check failed, fetching from API');
    }

    const generate = async (model) => {
        const url = `/.netlify/functions/gemini`;
        console.log(`Calling Gemini Function with model: ${model}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                model: model
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return response;
    };

    try {
        let response;
        try {
            response = await generate('gemini-2.0-flash');
        } catch (err) {
            console.warn('Gemini 2.0 Flash failed, trying gemini-flash-latest...', err);
            response = await generate('gemini-flash-latest');
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response structure');
        }

        const text = data.candidates[0].content.parts[0].text;
        console.log('Raw AI Response:', text);

        // Clean up the response
        let jsonStr = text.trim();
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        jsonStr = jsonStr.trim();

        console.log('Cleaned JSON:', jsonStr);

        const result = JSON.parse(jsonStr);
        console.log('Parsed result:', result);

        // Store in cache for future use
        const hashInput = `${city}-${days}-${style}-${budget}`;
        const queryHash = Array.from(new TextEncoder().encode(hashInput))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .slice(0, 32);

        fetch(`/.netlify/functions/getCachedAIResponse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, data: result, model: 'gemini-2.0-flash' })
        }).catch(e => console.log('Cache save failed:', e));

        window.cacheSource = { ...window.cacheSource, ai: false };

        // Combine form data with AI result for the DB
        fullTripResult = {
            destination: `${city}, ${country}`,
            travelDays: days,
            travelStyle: style,
            budget: budget,
            preferences: preferences,
            weather: weather,
            ...result // spreads itinerary, costs, hotels, packing, tips
        };

        // Reset save button for new trip
        const saveBtn = document.getElementById('save-trip-btn');
        if (saveBtn) {
            saveBtn.dataset.saved = 'false';
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-database"></i> Save to Database';
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }

        // Render all sections
        renderAllSections(result);

    } catch (e) {
        console.error('AI Generation Error:', e);

        document.getElementById('daily-itinerary').innerHTML = `
            <div style="color: #ff6b6b; padding: 20px; background: rgba(255,0,0,0.1); border-radius: 12px; text-align: center;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p><strong>Unable to generate trip plan</strong></p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Error: ${e.message}</p>
                <p style="font-size: 0.85rem; margin-top: 5px; opacity: 0.8;">Please check the browser console (F12) for more details.</p>
            </div>
        `;
        throw e;
    }
}

function renderAllSections(result) {
    renderItinerary(result.itinerary);
    renderHotels(result.hotels);
    updateCosts(result.costs);
    renderPackingList(result.packing);
    renderTravelTips(result.tips);
    
    // Fetch and display real destination images and attractions
    const destination = fullTripResult.destination.split(',')[0].trim();
    fetchDestinationImages(destination);
    fetchAndDisplayAttractions(destination);
    
    // NOTE: Removed auto-save - users now manually save trips with full authentication
}

// Auto-save trip to database (for Browse tab display)
async function autoSaveTripToDatabase() {
    if (!fullTripResult || editMode) return; // Don't auto-save in edit mode
    
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/.netlify/functions/savePlan', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(fullTripResult)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Trip auto-saved to database for browsing:', result.id);
            
            // Mark as saved so user can't duplicate save
            const saveBtn = document.getElementById('save-trip-btn');
            if (saveBtn) {
                saveBtn.dataset.saved = 'true';
                saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
                saveBtn.style.opacity = '0.6';
                saveBtn.style.cursor = 'not-allowed';
                saveBtn.disabled = true;
            }
        }
    } catch (error) {
        console.log('Auto-save to database failed (non-critical):', error);
    }
}

function renderItinerary(itinerary) {
    const container = document.getElementById('daily-itinerary');
    container.innerHTML = '';

    itinerary.forEach((day, index) => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';

        let activitiesHTML = day.activities.map(activity => `
            <div class="activity-card">
                <div class="activity-time">
                    <i class="fa-solid fa-clock"></i>
                    ${activity.time}
                </div>
                <div class="activity-content">
                    <h4 class="activity-title">${activity.activity}</h4>
                    <p class="activity-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${activity.location}
                    </p>
                    <p class="activity-description">${activity.description}</p>
                    ${activity.cost ? `<span class="activity-cost">${activity.cost}</span>` : ''}
                </div>
            </div>
        `).join('');

        dayCard.innerHTML = `
            <div class="day-header">
                <div class="day-number">${index + 1}</div>
                <div class="day-info">
                    <h3 class="day-title">${day.day}</h3>
                    <p class="day-theme">${day.theme}</p>
                </div>
            </div>
            <div class="day-activities">
                ${activitiesHTML}
            </div>
        `;

        container.appendChild(dayCard);
    });
}

function renderHotels(hotels) {
    const container = document.getElementById('hotels-grid');
    container.innerHTML = '';

    const hotelImages = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1000&auto=format&fit=crop'
    ];

    hotels.forEach((hotel, index) => {
        const hotelCard = document.createElement('div');
        hotelCard.className = 'hotel-card';

        const amenitiesHTML = hotel.amenities.slice(0, 3).map(amenity =>
            `<span class="amenity-tag"><i class="fa-solid fa-check"></i> ${amenity}</span>`
        ).join('');

        // Pick an image based on index to ensure they are different
        const imageUrl = hotelImages[index % hotelImages.length];

        hotelCard.innerHTML = `
            <div class="hotel-image">
                <img src="${imageUrl}" alt="${hotel.name}">
                <div class="hotel-rating">
                    <i class="fa-solid fa-star"></i> ${hotel.rating}
                </div>
            </div>
            <div class="hotel-info">
                <h4 class="hotel-name">${hotel.name}</h4>
                <p class="hotel-description">${hotel.description}</p>
                <div class="hotel-amenities">
                    ${amenitiesHTML}
                </div>
                <div class="hotel-footer">
                    <span class="hotel-price hotel-price-tag" data-original-price="${hotel.pricePerNight}">${hotel.pricePerNight}/night</span>
                    <a href="${hotel.bookingLink}" target="_blank" class="btn-small btn-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i> Book Now</a>
                </div>
            </div>
        `;

        container.appendChild(hotelCard);
    });
}

function updateCosts(costs) {
    document.getElementById('cost-accommodation').innerText = costs.accommodation;
    document.getElementById('cost-transportation').innerText = costs.transportation;
    document.getElementById('cost-food').innerText = costs.food;
    document.getElementById('cost-activities').innerText = costs.activities;
    document.getElementById('cost-total').innerText = costs.total;
}

function renderPackingList(items) {
    const container = document.getElementById('packing-list');
    container.innerHTML = '';

    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'packing-item';
        itemEl.innerHTML = `
            <i class="fa-solid fa-check-circle"></i>
            <span>${item}</span>
        `;
        container.appendChild(itemEl);
    });
}

function renderTravelTips(tips) {
    const container = document.getElementById('travel-tips');
    container.innerHTML = '';

    tips.forEach(tip => {
        const tipEl = document.createElement('div');
        tipEl.className = 'tip-item';
        tipEl.innerHTML = `
            <i class="fa-solid fa-lightbulb"></i>
            <span>${tip}</span>
        `;
        container.appendChild(tipEl);
    });
}

async function handleSaveTrip() {
    // If in edit mode, update the existing trip instead
    if (editMode && editTripId) {
        await updateExistingTrip();
        return;
    }

    if (!fullTripResult) {
        alert('No trip to save! Please generate a trip first.');
        return;
    }

    const btn = document.getElementById('save-trip-btn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        // Use new SavedTrips module
        if (window.SavedTrips) {
            const tripData = {
                destination: fullTripResult.destination,
                days: fullTripResult.travelDays || fullTripResult.days,
                travelStyle: fullTripResult.travelStyle,
                budget: fullTripResult.budget,
                preferences: fullTripResult.preferences || '',
                tripPlan: fullTripResult.itinerary ? formatItineraryText(fullTripResult.itinerary) : fullTripResult.rawText || '',
                weatherInfo: fullTripResult.weather ? {
                    temperature: fullTripResult.weather.temperature,
                    description: fullTripResult.weather.description
                } : null,
                costBreakdown: fullTripResult.cost || null,
                nearbyPlaces: fullTripResult.nearby || []
            };

            const savedTrip = await SavedTrips.saveTrip(tripData);
            
            if (savedTrip) {
                // Update button to show saved state
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
                btn.style.background = '#10b981';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Trip';
                    btn.style.background = '';
                    btn.disabled = false;
                }, 2000);
            } else {
                throw new Error('Failed to save trip');
            }
        } else {
            throw new Error('SavedTrips module not loaded');
        }
    } catch (e) {
        console.error('Error saving trip:', e);
        alert('Error saving trip: ' + e.message);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// Helper function to format itinerary as text
function formatItineraryText(itinerary) {
    if (!itinerary || !Array.isArray(itinerary)) return '';
    
    return itinerary.map((day, index) => {
        let text = `### Day ${day.day || (index + 1)}: ${day.title || 'Activities'}\n\n`;
        
        if (day.activities && Array.isArray(day.activities)) {
            day.activities.forEach(activity => {
                text += `${activity.time || ''} - ${activity.title || activity.name || ''}\n`;
                if (activity.description) {
                    text += `${activity.description}\n`;
                }
                text += '\n';
            });
        }
        
        return text;
    }).join('\n');
}

// Load trip data for editing
async function loadTripForEditing(tripId) {
    try {
        const response = await fetch(`/.netlify/functions/getTripById?id=${tripId}`);
        if (!response.ok) throw new Error('Trip not found');
        const data = await response.json();
        const trip = data.trip;

        // Pre-fill form with existing trip data
        document.getElementById('destination').value = trip.destination || '';
        document.getElementById('days').value = trip.travelDays || trip.days || 5;
        document.getElementById('style').value = trip.travelStyle || '';
        document.getElementById('budget').value = trip.budget || '';
        document.getElementById('preferences').value = trip.preferences || '';

        // Change page title and button text to indicate edit mode
        const pageTitle = document.querySelector('.form-title');
        if (pageTitle) {
            pageTitle.innerHTML = '<i class="fa-solid fa-edit"></i> Edit Your Trip';
        }

        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-sync"></i> Update Trip Plan';
        }

        const saveBtn = document.getElementById('save-trip-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
        }

        console.log('✅ Loaded trip for editing:', trip);
    } catch (error) {
        console.error('❌ Error loading trip:', error);
        alert('Failed to load trip for editing. Redirecting to My Trips.');
        window.location.href = 'my-trips.html';
    }
}

// Update existing trip instead of creating new one
async function updateExistingTrip() {
    if (!editTripId || !fullTripResult) {
        alert('No trip data to update!');
        return;
    }

    const btn = document.getElementById('save-trip-btn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    try {
        // Add the trip ID to the update payload
        const updateData = {
            ...fullTripResult,
            _id: editTripId
        };

        const response = await fetch(`/.netlify/functions/updateTripData`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const result = await response.json();
            alert(`✅ Trip updated successfully!\n\nYou can view your updated trip in My Trips.`);
            
            // Redirect to My Trips after successful update
            setTimeout(() => {
                window.location.href = 'my-trips.html';
            }, 1000);
        } else {
            throw new Error('Failed to update trip');
        }
    } catch (e) {
        console.error('Error updating trip:', error);
        alert('Error updating trip: ' + e.message);
    }
}

// Fetch and display destination images from Unsplash
async function fetchDestinationImages(destination) {
    try {
        const response = await fetch(`/.netlify/functions/getDestinationImages?destination=${encodeURIComponent(destination)}&count=3`);
        if (!response.ok) throw new Error('Failed to fetch images');
        
        const data = await response.json();
        if (data.images && data.images.length > 0) {
            displayDestinationImages(data.images);
        }
    } catch (error) {
        console.error('Error fetching destination images:', error);
    }
}

// Display destination images in a gallery section
function displayDestinationImages(images) {
    let gallery = document.getElementById('destination-gallery');
    
    if (!gallery) {
        // Create gallery section if it doesn't exist
        const hotelSection = document.getElementById('hotels-section');
        if (hotelSection && hotelSection.parentNode) {
            gallery = document.createElement('div');
            gallery.id = 'destination-gallery';
            gallery.className = 'section';
            hotelSection.parentNode.insertBefore(gallery, hotelSection);
        } else {
            return;
        }
    }
    
    gallery.innerHTML = `
        <h2 class="section-title">
            <i class="fa-solid fa-images"></i> Destination Gallery
        </h2>
        <div class="gallery-grid">
            ${images.map(img => `
                <div class="gallery-item">
                    <img src="${img.url}" alt="${img.alt}" loading="lazy">
                    <div class="gallery-credit">
                        <small>Photo by <a href="${img.link}" target="_blank">${img.photographer}</a></small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Fetch and display real attractions from Google Places
async function fetchAndDisplayAttractions(destination) {
    try {
        const response = await fetch(`/.netlify/functions/getAttractions?destination=${encodeURIComponent(destination)}`);
        if (!response.ok) throw new Error('Failed to fetch attractions');
        
        const data = await response.json();
        if (data.attractions && data.attractions.length > 0) {
            displayAttractions(data.attractions);
        }
    } catch (error) {
        console.error('Error fetching attractions:', error);
    }
}

// Display attractions in a card layout
function displayAttractions(attractions) {
    let section = document.getElementById('attractions-section');
    
    if (!section) {
        // Create attractions section if it doesn't exist
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            section = document.createElement('div');
            section.id = 'attractions-section';
            section.className = 'section';
            resultsSection.appendChild(section);
        } else {
            return;
        }
    }
    
    section.innerHTML = `
        <h2 class="section-title">
            <i class="fa-solid fa-map-location-dot"></i> Popular Attractions
        </h2>
        <div class="attractions-grid">
            ${attractions.map(attr => `
                <div class="attraction-card">
                    ${attr.photo ? `<img src="${attr.photo}" alt="${attr.name}" class="attraction-image">` : ''}
                    <div class="attraction-content">
                        <h4 class="attraction-name">${attr.name}</h4>
                        <p class="attraction-address">
                            <i class="fa-solid fa-location-dot"></i>
                            ${attr.address}
                        </p>
                        <div class="attraction-stats">
                            <span class="rating">
                                <i class="fa-solid fa-star"></i> ${typeof attr.rating === 'number' ? attr.rating.toFixed(1) : 'N/A'}
                            </span>
                            <span class="reviews">(${attr.reviews} reviews)</span>
                        </div>
                        ${attr.openNow !== null ? `
                            <div class="open-status ${attr.openNow ? 'open' : 'closed'}">
                                ${attr.openNow ? '<i class="fa-solid fa-circle"></i> Open Now' : '<i class="fa-solid fa-circle"></i> Closed'}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Initialize trip map with destination and itinerary points
async function initializeTripMap() {
    if (!currentTripData || !fullTripResult) {
        console.error('No trip data available for map');
        return;
    }

    // Load Leaflet if not already loaded
    await loadLeaflet();

    const destination = currentTripData.destination;
    
    // Get coordinates for destination
    const geoData = await getCoordinates(destination);
    if (!geoData) {
        throw new Error('Could not find coordinates for destination');
    }

    const { lat, lon, name } = geoData;

    // Create map instance
    const mapContainer = document.getElementById('trip-map');
    if (!mapContainer) return;

    // Clear any existing map
    mapContainer.innerHTML = '';
    
    const tripMap = window.L.map('trip-map').setView([lat, lon], 12);

    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(tripMap);

    // Add main destination marker
    const mainMarker = window.L.marker([lat, lon], {
        icon: window.L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="
                background: linear-gradient(135deg, #6366f1, #a855f7);
                width: 40px;
                height: 40px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fa-solid fa-location-dot" style="
                    color: white;
                    font-size: 20px;
                    transform: rotate(45deg);
                "></i>
            </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    }).addTo(tripMap);

    mainMarker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
            <h3 style="margin: 0 0 5px; color: #6366f1; font-size: 1.1rem;">
                <i class="fa-solid fa-map-location-dot"></i> ${name || destination}
            </h3>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Your destination</p>
        </div>
    `).openPopup();

    // Add markers for hotels if available
    if (fullTripResult.hotels && fullTripResult.hotels.length > 0) {
        const hotelPromises = fullTripResult.hotels.slice(0, 3).map(async (hotel, index) => {
            try {
                const hotelGeo = await getCoordinates(`${hotel.name}, ${destination}`);
                if (hotelGeo) {
                    const hotelMarker = window.L.marker([hotelGeo.lat, hotelGeo.lon], {
                        icon: window.L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="
                                background: #10b981;
                                width: 30px;
                                height: 30px;
                                border-radius: 50%;
                                border: 2px solid white;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <i class="fa-solid fa-hotel" style="color: white; font-size: 14px;"></i>
                            </div>`,
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    }).addTo(tripMap);

                    hotelMarker.bindPopup(`
                        <div style="padding: 8px; min-width: 200px;">
                            <h4 style="margin: 0 0 5px; color: #10b981;">
                                <i class="fa-solid fa-hotel"></i> ${hotel.name}
                            </h4>
                            <p style="margin: 0 0 3px; font-size: 0.85rem; color: #64748b;">
                                ${hotel.address || 'Hotel location'}
                            </p>
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">
                                ${hotel.pricePerNight || 'Price on request'}
                            </p>
                        </div>
                    `);
                }
            } catch (error) {
                console.log('Could not add hotel marker:', hotel.name);
            }
        });

        await Promise.all(hotelPromises);
    }

    // Add markers for key activities from itinerary
    if (fullTripResult.itinerary && fullTripResult.itinerary.length > 0) {
        const activityPromises = [];
        
        fullTripResult.itinerary.forEach((day, dayIndex) => {
            if (day.activities && day.activities.length > 0) {
                // Add first 2 activities per day
                day.activities.slice(0, 2).forEach((activity, actIndex) => {
                    if (activity.activity) {
                        activityPromises.push(
                            (async () => {
                                try {
                                    const actGeo = await getCoordinates(`${activity.activity}, ${destination}`);
                                    if (actGeo) {
                                        const actMarker = window.L.marker([actGeo.lat, actGeo.lon], {
                                            icon: window.L.divIcon({
                                                className: 'custom-div-icon',
                                                html: `<div style="
                                                    background: #f59e0b;
                                                    width: 28px;
                                                    height: 28px;
                                                    border-radius: 50%;
                                                    border: 2px solid white;
                                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    font-weight: bold;
                                                    color: white;
                                                    font-size: 12px;
                                                ">
                                                    ${dayIndex + 1}
                                                </div>`,
                                                iconSize: [28, 28],
                                                iconAnchor: [14, 14]
                                            })
                                        }).addTo(tripMap);

                                        actMarker.bindPopup(`
                                            <div style="padding: 8px; min-width: 180px;">
                                                <h4 style="margin: 0 0 5px; color: #f59e0b;">
                                                    Day ${dayIndex + 1} Activity
                                                </h4>
                                                <p style="margin: 0; font-size: 0.9rem; color: #1e293b;">
                                                    ${activity.activity}
                                                </p>
                                                ${activity.description ? `
                                                    <p style="margin: 5px 0 0; font-size: 0.8rem; color: #64748b;">
                                                        ${activity.description}
                                                    </p>
                                                ` : ''}
                                            </div>
                                        `);
                                    }
                                } catch (error) {
                                    console.log('Could not add activity marker');
                                }
                            })()
                        );
                    }
                });
            }
        });

        // Wait for some activity markers to load (not all to avoid delays)
        await Promise.race([
            Promise.all(activityPromises.slice(0, 5)),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]);
    }

    // Fit map bounds to show all markers
    setTimeout(() => {
        tripMap.invalidateSize();
    }, 300);

    console.log('✅ Trip map initialized with destination and key locations');
}
