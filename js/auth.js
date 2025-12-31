// Frontend Authentication Helper
// Handles token management, user session, and route protection

// Get auth token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user info from localStorage
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get userId safely
function getUserId() {
    const user = getUser();
    return user ? user.id : null;
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Protect route - redirect to login if not authenticated
function protectRoute() {
    if (!isLoggedIn()) {
        // Save current page to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
    }
}

// Redirect to planner if already logged in (for login/signup pages)
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = 'planner.html';
    }
}

// Verify token is still valid
async function verifyToken() {
    const token = getToken();
    if (!token) return false;

    try {
        const response = await fetch('/.netlify/functions/verifyToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        
        if (data.valid) {
            // Update user info in case it changed
            localStorage.setItem('user', JSON.stringify(data.user));
            return true;
        } else {
            // Token is invalid, logout
            logout();
            return false;
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// Toggle user dropdown menu
function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown-menu');
    const userBtn = document.getElementById('user-profile-btn');
    if (dropdown && userBtn && !userBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Update navbar with user info
function updateNavbarAuth() {
    const user = getUser();
    const navContainer = document.querySelector('.header-nav') || document.querySelector('.nav-links');
    
    if (!navContainer) return;

    // Remove existing auth elements
    const existingAuthElements = navContainer.querySelectorAll('.auth-nav-item');
    existingAuthElements.forEach(el => el.remove());

    if (user) {
        // User is logged in - show user profile dropdown
        const userMenu = document.createElement('div');
        userMenu.className = 'auth-nav-item';
        userMenu.style.cssText = 'position: relative; display: flex; align-items: center; margin-left: auto;';
        
        userMenu.innerHTML = `
            <button id="user-profile-btn" onclick="toggleUserDropdown()" style="
                padding: 8px 18px;
                border: 2px solid var(--accent);
                background: transparent;
                color: var(--accent);
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                font-family: inherit;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 8px;
            " onmouseover="this.style.background='var(--accent)'; this.style.color='white';" 
               onmouseout="this.style.background='transparent'; this.style.color='var(--accent)';">
                <i class="fa-solid fa-user-circle"></i>
                <span>${user.name}</span>
                <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem;"></i>
            </button>
            <div id="user-dropdown-menu" style="
                display: none;
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                background: rgba(20, 20, 40, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                min-width: 200px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                overflow: hidden;
            ">
                <div style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <div style="color: var(--text); font-weight: 600; font-size: 0.9rem;">${user.name}</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">${user.email}</div>
                </div>
                
                <a href="planner.html" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: var(--text);
                    text-decoration: none;
                    transition: background 0.2s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.05)';" 
                   onmouseout="this.style.background='transparent';">
                    <i class="fa-solid fa-plus" style="color: var(--accent); width: 16px;"></i>
                    <span>New Trip</span>
                </a>
                
                <a href="my-trips.html" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: var(--text);
                    text-decoration: none;
                    transition: background 0.2s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.05)';" 
                   onmouseout="this.style.background='transparent';">
                    <i class="fa-solid fa-bookmark" style="color: var(--accent); width: 16px;"></i>
                    <span>My Trips</span>
                </a>
                
                <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin: 4px 0;"></div>
                
                <button onclick="logout()" style="
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: #ef4444;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 1rem;
                    text-align: left;
                    transition: background 0.2s ease;
                " onmouseover="this.style.background='rgba(239, 68, 68, 0.1)';" 
                   onmouseout="this.style.background='transparent';">
                    <i class="fa-solid fa-right-from-bracket" style="width: 16px;"></i>
                    <span>Logout</span>
                </button>
            </div>
        `;
        
        navContainer.appendChild(userMenu);
    } else {
        // User is not logged in - show login/signup buttons
        const authButtons = document.createElement('div');
        authButtons.className = 'auth-nav-item';
        authButtons.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-left: auto;';
        
        authButtons.innerHTML = `
            <a href="login.html" style="
                padding: 8px 18px;
                border: 2px solid var(--accent);
                background: transparent;
                color: var(--accent);
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
                white-space: nowrap;
            " onmouseover="this.style.background='var(--accent)'; this.style.color='white';" 
               onmouseout="this.style.background='transparent'; this.style.color='var(--accent)';">
                <i class="fa-solid fa-right-to-bracket"></i> Login
            </a>
            <a href="signup.html" style="
                padding: 8px 18px;
                background: linear-gradient(135deg, #6366f1, #a855f7);
                color: white;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
                white-space: nowrap;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(99, 102, 241, 0.4)';" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <i class="fa-solid fa-user-plus"></i> Sign Up
            </a>
        `;
        
        navContainer.appendChild(authButtons);
    }
}

// Initialize auth on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Update navbar
        updateNavbarAuth();
        
        // Verify token on page load (if logged in)
        if (isLoggedIn()) {
            verifyToken();
        }
    });
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.getToken = getToken;
    window.getUser = getUser;
    window.isLoggedIn = isLoggedIn;
    window.logout = logout;
    window.getAuthHeaders = getAuthHeaders;
    window.protectRoute = protectRoute;
    window.redirectIfLoggedIn = redirectIfLoggedIn;
    window.verifyToken = verifyToken;
    window.updateNavbarAuth = updateNavbarAuth;
    window.toggleUserDropdown = toggleUserDropdown;
}
