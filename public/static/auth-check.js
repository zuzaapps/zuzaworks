/**
 * Authentication Check Utility
 * Include this script on protected pages to enforce authentication
 */

const API_URL = window.location.origin;

// Check authentication status
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        redirectToLogin();
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Authentication failed');
        }
        
        return data.data;
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.clear();
        redirectToLogin();
        return null;
    }
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = '/static/login.html';
}

// Logout user
function logout() {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        // Call logout endpoint
        fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        }).catch(console.error);
    }
    
    // Clear local storage
    localStorage.clear();
    
    // Redirect to login
    redirectToLogin();
}

// Get current user info from localStorage
function getCurrentUser() {
    return {
        token: localStorage.getItem('auth_token'),
        role: localStorage.getItem('user_role'),
        name: localStorage.getItem('user_name'),
        email: localStorage.getItem('user_email')
    };
}

// Check if user has specific role
function hasRole(...roles) {
    const userRole = localStorage.getItem('user_role');
    return roles.includes(userRole);
}

// Make authenticated API request
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        redirectToLogin();
        throw new Error('No authentication token');
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
        localStorage.clear();
        redirectToLogin();
        throw new Error('Unauthorized');
    }
    
    return response;
}

// Display user info in UI
function displayUserInfo(elementId = 'userInfo') {
    const user = getCurrentUser();
    const element = document.getElementById(elementId);
    
    if (element && user.name) {
        element.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex flex-col text-right">
                    <span class="font-semibold text-gray-800">${user.name}</span>
                    <span class="text-xs text-gray-500">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </div>
                <button 
                    onclick="logout()" 
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    title="Logout"
                >
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    }
}

// Auto-run auth check on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Skip auth check on login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    const user = await checkAuth();
    
    if (user) {
        console.log('✅ User authenticated:', user.email, '-', user.role);
        
        // Display user info if element exists
        displayUserInfo();
    }
});

// Export functions for use in other scripts
window.auth = {
    check: checkAuth,
    logout: logout,
    getCurrentUser: getCurrentUser,
    hasRole: hasRole,
    fetch: authenticatedFetch,
    displayUserInfo: displayUserInfo
};
