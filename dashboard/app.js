/**
 * Dashboard App Logic
 * Fetches and displays orders, handles sorting, filtering, and order detail modal
 */

import { api } from './api.js';

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 50;

class DashboardApp {
  constructor() {
    this.orders = [];
    this.currentSort = { column: 'created_at', direction: 'desc' };
    this.filters = { status: '', search: '' };
    this.pagination = { page: 1, total: 0 };
    this.debounceTimer = null;

    this.initElements();
    this.bindEvents();
    this.loadOrders();
  }

  initElements() {
    this.tableBody = document.getElementById('orders-tbody');
    this.statusFilter = document.getElementById('status-filter');
    this.customerSearch = document.getElementById('customer-search');
    this.prevBtn = document.getElementById('prev-page');
    this.nextBtn = document.getElementById('next-page');
    this.pageInfo = document.getElementById('page-info');
    this.modal = document.getElementById('order-detail-modal');
    this.modalContent = document.getElementById('order-detail-content');
    this.modalClose = document.getElementById('modal-close');
    this.logoutBtn = document.getElementById('logout-btn');
  }

  bindEvents() {
    this.statusFilter.addEventListener('change', () => this.onStatusFilterChange());
    this.customerSearch.addEventListener('input', (e) => this.onSearchInput(e));
    this.prevBtn.addEventListener('click', () => this.prevPage());
    this.nextBtn.addEventListener('click', () => this.nextPage());
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    this.logoutBtn.addEventListener('click', () => this.logout());

    document.querySelectorAll('.orders-table th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => this.onSortClick(th.dataset.sort));
    });
  }

  async loadOrders() {
    this.showLoading();
    try {
      const response = await api.getOrders({
        status: this.filters.status || undefined,
        limit: PAGE_SIZE,
        offset: (this.pagination.page - 1) * PAGE_SIZE,
      });
      this.orders = response.orders;
      this.pagination.total = response.total;
      this.renderTable();
    } catch (error) {
      this.showError('Failed to load orders: ' + error.message);
    }
  }

  showLoading() {
    this.tableBody.innerHTML = '<tr class="loading-row"><td colspan="5">Loading orders...</td></tr>';
  }

  showError(message) {
    this.tableBody.innerHTML = `<tr class="error-row"><td colspan="5" class="error">${message}</td></tr>`;
  }

  renderTable() {
    const sortedOrders = this.getSortedOrders();
    const displayOrders = this.filters.search ? this.getFilteredOrders(sortedOrders) : sortedOrders;

    if (displayOrders.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="5" class="empty">No orders found</td></tr>';
      return;
    }

    this.tableBody.innerHTML = displayOrders
      .map(
        (order) => `
      <tr data-display-id="${order.display_id}">
        <td>${order.display_id}</td>
        <td>${order.customer_name}${order.customer_username ? ` (@${order.customer_username})` : ''}</td>
        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
        <td><span class="timestamp-relative" title="${order.created_at}">${this.formatRelativeTime(order.created_at)}</span></td>
        <td>${order.item_count}</td>
      </tr>
    `
      )
      .join('');

    this.tableBody.querySelectorAll('tr[data-display-id]').forEach((row) => {
      row.addEventListener('click', () => this.onRowClick(row.dataset.displayId));
    });

    this.updateSortIndicators();
    this.updatePagination();
  }

  getSortedOrders() {
    const { column, direction } = this.currentSort;
    return [...this.orders].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      if (column === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getFilteredOrders(orders) {
    const searchLower = this.filters.search.toLowerCase();
    return orders.filter(
      (order) =>
        order.customer_name.toLowerCase().includes(searchLower) ||
        (order.customer_username && order.customer_username.toLowerCase().includes(searchLower))
    );
  }

  updateSortIndicators() {
    document.querySelectorAll('.orders-table th').forEach((th) => {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === this.currentSort.column) {
        th.classList.add(this.currentSort.direction);
      }
    });
  }

  updatePagination() {
    const totalPages = Math.ceil(this.pagination.total / PAGE_SIZE);
    const start = (this.pagination.page - 1) * PAGE_SIZE + 1;
    const end = Math.min(this.pagination.page * PAGE_SIZE, this.pagination.total);

    this.pageInfo.textContent = totalPages > 0 ? `Showing ${start}-${end} of ${this.pagination.total}` : 'No results';
    this.prevBtn.disabled = this.pagination.page <= 1;
    this.nextBtn.disabled = this.pagination.page >= totalPages;
  }

  onSortClick(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'asc';
    }
    this.renderTable();
  }

  onStatusFilterChange() {
    this.filters.status = this.statusFilter.value;
    this.pagination.page = 1;
    this.loadOrders();
  }

  onSearchInput() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.filters.search = this.customerSearch.value;
      this.pagination.page = 1;
      this.loadOrders();
    }, DEBOUNCE_MS);
  }

  prevPage() {
    if (this.pagination.page > 1) {
      this.pagination.page--;
      this.loadOrders();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.pagination.total / PAGE_SIZE);
    if (this.pagination.page < totalPages) {
      this.pagination.page++;
      this.loadOrders();
    }
  }

  async onRowClick(displayId) {
    try {
      const response = await api.getOrder(displayId);
      this.showOrderDetail(response.order);
    } catch (error) {
      alert('Failed to load order details: ' + error.message);
    }
  }

  showOrderDetail(order) {
    const transitionsHtml = order.transitions
      .map(
        (t) => `
      <li>
        <span>${t.from_status || 'created'} → ${t.to_status}</span>
        <span>${t.changed_by} • ${this.formatRelativeTime(t.created_at)}</span>
      </li>
    `
      )
      .join('');

    const itemsHtml = order.items
      .map(
        (item, i) => `
      <li>
        <a href="${item.link}" target="_blank" rel="noopener">${item.link}</a>
      </li>
    `
      )
      .join('');

    this.modalContent.innerHTML = `
      <div class="order-detail">
        <h2>Order ${order.display_id}</h2>

        <div class="order-detail-section">
          <div class="order-detail-label">Customer</div>
          <div class="order-detail-value">${order.customer.name}${order.customer.username ? ` (@${order.customer.username})` : ''}</div>
        </div>

        <div class="order-detail-section">
          <div class="order-detail-label">Status</div>
          <div class="order-detail-value"><span class="status-badge status-${order.status}">${order.status}</span></div>
        </div>

        <div class="order-detail-section">
          <div class="order-detail-label">Product Links</div>
          <ul class="product-links">${itemsHtml || '<li>No items</li>'}</ul>
        </div>

        ${order.specs ? `
        <div class="order-detail-section">
          <div class="order-detail-label">Specifications</div>
          <div class="order-detail-value">${order.specs}</div>
        </div>
        ` : ''}

        <div class="order-detail-section">
          <div class="order-detail-label">Status History</div>
          <ul class="status-history">${transitionsHtml || '<li>No transitions</li>'}</ul>
        </div>

        <div class="order-detail-section">
          <div class="order-detail-label">Created</div>
          <div class="order-detail-value">${new Date(order.created_at).toLocaleString()}</div>
        </div>
      </div>
    `;

    this.modal.hidden = false;
  }

  closeModal() {
    this.modal.hidden = true;
  }

  async logout() {
    try {
      await fetch('/dashboard-api/logout', { method: 'POST' });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  formatRelativeTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DashboardApp();
});