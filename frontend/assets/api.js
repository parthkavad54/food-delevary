// API Service for connecting frontend to backend
class FoodDeliveryAPI {
  constructor() {
    // Automatically detect backend URL based on current hostname
    // For production, set window.API_BASE_URL in your HTML or use environment detection
    const getBaseURL = () => {
      // Check if API_BASE_URL is set globally (for production)
      if (window.API_BASE_URL) {
        return window.API_BASE_URL;
      }
      // Auto-detect: if frontend and backend are on same domain, use relative path
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
      // For production, assume backend is on same domain
      return `${window.location.protocol}//${window.location.host}/api`;
    };
    
    this.baseURL = getBaseURL();
    this.token = localStorage.getItem('foody_token');
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    // Always get fresh token from localStorage before each request
    this.token = localStorage.getItem('foody_token');
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorMsg = data.message || data.error || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        throw error;
      }
      
      return data;
    } catch (error) {
      // Re-throw if it's already our formatted error
      if (error.status || error.message) {
        throw error;
      }
      // Handle network errors
      console.error('API request failed:', error);
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  // Authentication methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('foody_token', data.token);
      localStorage.setItem('foody_user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async me() {
    // Verify the current token and return the user
    const data = await this.request('/auth/me', {
      method: 'GET'
    });
    if (data && data.user) {
      localStorage.setItem('foody_user', JSON.stringify(data.user));
    }
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('foody_token', data.token);
      localStorage.setItem('foody_user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('foody_token');
    localStorage.removeItem('foody_user');
  }

  // Restaurant methods
  async getRestaurants(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/restaurants?${queryParams}` : '/restaurants';
    return await this.request(endpoint);
  }

  async getRestaurant(id) {
    return await this.request(`/restaurants/${id}`);
  }

  async createRestaurant(restaurantData) {
    return await this.request('/restaurants', {
      method: 'POST',
      body: JSON.stringify(restaurantData)
    });
  }

  // Menu methods
  async getMenuItems(restaurantId, filters = {}) {
    const queryParams = new URLSearchParams({ restaurantId, ...filters }).toString();
    return await this.request(`/menu?${queryParams}`);
  }

  async getMenuItemsByRestaurant(restaurantId, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/menu/restaurant/${restaurantId}?${queryParams}` : `/menu/restaurant/${restaurantId}`;
    return await this.request(endpoint);
  }

  async getMenuItem(id) {
    return await this.request(`/menu/${id}`);
  }

  // Cart methods
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(itemData) {
    return await this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async updateCartItem(itemId, quantity) {
    return await this.request(`/cart/update/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  async removeFromCart(itemId) {
    return await this.request(`/cart/remove/${itemId}`, {
      method: 'DELETE'
    });
  }

  async clearCart() {
    return await this.request('/cart/clear', {
      method: 'DELETE'
    });
  }

  // Order methods
  async createOrder(orderData) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders() {
    return await this.request('/orders');
  }

  async getOrder(id) {
    return await this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return await this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Review methods
  async getReviews(restaurantId) {
    return await this.request(`/reviews?restaurantId=${restaurantId}`);
  }

  async createReview(reviewData) {
    return await this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async updateReview(id, reviewData) {
    return await this.request(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  }

  async deleteReview(id) {
    return await this.request(`/reviews/${id}`, {
      method: 'DELETE'
    });
  }

  // User methods
  async getUserProfile() {
    return await this.request('/users/profile');
  }

  async updateUserProfile(userData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }

  // =================================================================
  // ADMIN METHODS
  // =================================================================

  // Dashboard
  async getAdminDashboardStats() {
    return await this.request('/admin/dashboard/stats');
  }

  // User Management
  async getAdminUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
    return await this.request(endpoint);
  }

  async getAdminUserStats() {
    return await this.request('/admin/users/stats');
  }

  async getAdminUserById(id) {
    return await this.request(`/admin/users/${id}`);
  }

  async createAdminUser(userData) {
    return await this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateAdminUser(id, userData) {
    return await this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteAdminUser(id) {
    return await this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Restaurant Management (Admin)
  async getAdminRestaurants(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/restaurants?${queryParams}` : '/admin/restaurants';
    return await this.request(endpoint);
  }

  async getAdminRestaurantStats() {
    return await this.request('/admin/restaurants/stats');
  }

  async getRestaurantOwners() {
    return await this.request('/admin/restaurants/owners');
  }

  async createAdminRestaurant(restaurantData) {
    return await this.request('/restaurants', {
      method: 'POST',
      body: JSON.stringify(restaurantData)
    });
  }

  async updateAdminRestaurant(id, restaurantData) {
    return await this.request(`/admin/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(restaurantData)
    });
  }

  async deleteAdminRestaurant(id) {
    return await this.request(`/admin/restaurants/${id}`, {
      method: 'DELETE'
    });
  }

  // Order Management (Admin)
  async getAdminOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/orders?${queryParams}` : '/admin/orders';
    return await this.request(endpoint);
  }

  // =================================================================
  // RESTAURANT OWNER METHODS
  // =================================================================

  // Dashboard
  async getRestaurantDashboardStats() {
    return await this.request('/restaurant-owner/dashboard/stats');
  }

  async getMyRestaurants() {
    return await this.request('/restaurant-owner/restaurants');
  }

  async toggleRestaurantStatus(restaurantId) {
    return await this.request(`/restaurant-owner/restaurants/${restaurantId}/toggle-status`, {
      method: 'PUT'
    });
  }

  // Order Management
  async getRestaurantOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/restaurant-owner/orders?${queryParams}` : '/restaurant-owner/orders';
    return await this.request(endpoint);
  }

  async getRestaurantOrderById(id) {
    return await this.request(`/restaurant-owner/orders/${id}`);
  }

  async updateRestaurantOrderStatus(id, status) {
    return await this.request(`/restaurant-owner/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Menu Item Management
  async getRestaurantMenuItems(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/restaurant-owner/menu-items?${queryParams}` : '/restaurant-owner/menu-items';
    return await this.request(endpoint);
  }

  async createRestaurantMenuItem(menuItemData) {
    return await this.request('/restaurant-owner/menu-items', {
      method: 'POST',
      body: JSON.stringify(menuItemData)
    });
  }

  async updateRestaurantMenuItem(id, menuItemData) {
    return await this.request(`/restaurant-owner/menu-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuItemData)
    });
  }

  async deleteRestaurantMenuItem(id) {
    return await this.request(`/restaurant-owner/menu-items/${id}`, {
      method: 'DELETE'
    });
  }
}

// Create global API instance
window.foodAPI = new FoodDeliveryAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FoodDeliveryAPI;
}

