/**
 * API Client for Dashboard
 * Handles all fetch calls to the dashboard-api backend
 */

const API_BASE = '/dashboard-api';

class ApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async getOrders({ status, customer_id, limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (customer_id) params.set('customer_id', customer_id);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    return this.request(`/orders?${params}`);
  }

  async getOrder(display_id) {
    return this.request(`/orders/${encodeURIComponent(display_id)}`);
  }

  async updateOrderStatus(display_id, status) {
    return this.request(`/orders/${encodeURIComponent(display_id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async sendOrderMessage(display_id, message) {
    return this.request(`/orders/${encodeURIComponent(display_id)}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getCustomer(customerId) {
    return this.request(`/customers/${customerId}`);
  }

  async getActivityLogs({ action, actor, from, to, limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (actor) params.set('actor', actor);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    return this.request(`/activity-logs?${params}`);
  }
}

export const api = new ApiClient();
export default api;