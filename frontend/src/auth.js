/**
 * frontend/src/auth.js
 * 
 * Module JWT Authentication
 * Gère tokens, localStorage, et headers d'authentification
 */

const AUTH_MODULE = (() => {
    const TOKEN_KEY = 'otea_jwt_token';
    const USER_KEY = 'otea_user';

    /**
     * Récupère le token du localStorage
     */
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Récupère l'utilisateur connecté
     */
    function getUser() {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    /**
     * Vérifie si utilisateur est authentifié
     */
    function isAuthenticated() {
        return getToken() !== null;
    }

    /**
     * Retourne le header Authorization pour les requêtes API
     */
    function getAuthHeader() {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Login avec username/password
     * Retourne {success, message, data} où data = {token, user}
     */
    async function login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.error || 'Login failed', data: null };
            }

            // Store token and user
            localStorage.setItem(TOKEN_KEY, data.data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

            return { success: true, message: 'Login successful', data: data.data };
        } catch (error) {
            return { success: false, message: error.message, data: null };
        }
    }

    /**
     * Logout - supprime token et user
     */
    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    /**
     * Decode JWT pour récupérer le payload (sans vérification - côté client)
     */
    function decodeToken(token = null) {
        const t = token || getToken();
        if (!t) return null;

        const parts = t.split('.');
        if (parts.length !== 3) return null;

        try {
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (e) {
            return null;
        }
    }

    /**
     * Vérifie si token est expiré
     */
    function isTokenExpired() {
        const payload = decodeToken();
        if (!payload || !payload.exp) return true;

        const nowInSeconds = Math.floor(Date.now() / 1000);
        return payload.exp < nowInSeconds;
    }

    /**
     * Affiche une notification
     */
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${type === 'error' ? '#c0392b' : type === 'success' ? '#27ae60' : '#f39c12'};
            color: white;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Return public API
    return {
        getToken,
        getUser,
        isAuthenticated,
        getAuthHeader,
        login,
        logout,
        decodeToken,
        isTokenExpired,
        showNotification
    };
})();
