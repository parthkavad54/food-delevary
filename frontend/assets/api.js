// API Service for connecting frontend to backend
class FoodDeliveryAPI {
  constructor() {
    // Backend URL - change this to your backend URL
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('foody_token');
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
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
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
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

  // Menu methods
  async getMenuItems(restaurantId, filters = {}) {
    const queryParams = new URLSearchParams({ restaurantId, ...filters }).toString();
    return await this.request(`/menu?${queryParams}`);
  }

  async getMenuItem(id) {
    return await this.request(`/menu/${id}`);
  }

  // Cart methods
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(itemData) {
    return await this.request('/cart', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async updateCartItem(itemId, quantity) {
    return await this.request(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  async removeFromCart(itemId) {
    return await this.request(`/cart/${itemId}`, {
      method: 'DELETE'
    });
  }

  async clearCart() {
    return await this.request('/cart', {
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
    return await this.request(`/orders/${id}`, {
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
}

// Create global API instance
window.foodAPI = new FoodDeliveryAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FoodDeliveryAPI;
}
