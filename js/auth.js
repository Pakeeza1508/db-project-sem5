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

// Update navbar with user info
function updateNavbarAuth() {
    const user = getUser();
    const navLinks = document.querySelector('.nav-links');
    
    if (!navLinks) return;

    // Remove existing auth elements
    const existingAuthElements = navLinks.querySelectorAll('.auth-nav-item');
    existingAuthElements.forEach(el => el.remove());

    if (user) {
        // User is logged in - show user menu
        const userMenu = document.createElement('div');
        userMenu.className = 'auth-nav-item';
        userMenu.style.cssText = 'display: flex; align-items: center; gap: 15px; margin-left: 10px;';
        
        userMenu.innerHTML = `
            <span style="color: var(--text); font-weight: 500;">
                <i class="fa-solid fa-user-circle" style="color: var(--accent); margin-right: 6px;"></i>
                ${user.name}
            </span>
            <button onclick="logout()" style="
                padding: 8px 18px;
                border: 2px solid var(--accent);
                background: transparent;
                color: var(--accent);
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                font-family: inherit;
            " onmouseover="this.style.background='var(--accent)'; this.style.color='white';" 
               onmouseout="this.style.background='transparent'; this.style.color='var(--accent)';">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
        `;
        
        navLinks.appendChild(userMenu);
    } else {
        // User is not logged in - show login/signup buttons
        const authButtons = document.createElement('div');
        authButtons.className = 'auth-nav-item';
        authButtons.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-left: 10px;';
        
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
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(99, 102, 241, 0.4)';" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <i class="fa-solid fa-user-plus"></i> Sign Up
            </a>
        `;
        
        navLinks.appendChild(authButtons);
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
}
