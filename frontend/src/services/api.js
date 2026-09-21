import { checkoutKey } from './checkoutKey';
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

const parseResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || `Request failed (${response.status})`);
    return data;
};

const authHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const menuAPI = {
    getPage: async ({ page = 1, category = 'All', search = '', available } = {}) => {
        const params = new URLSearchParams({ page: String(page) });
        if (category && category !== 'All') params.set('category', category);
        if (search.trim()) params.set('search', search.trim());
        if (available) params.set('available', available);
        const response = await fetchWithTimeout(`${API_URL}/menu?${params}`, {}, 60000);
        const data = await parseResponse(response);
        return {
            items: Array.isArray(data.data) ? data.data : [],
            pagination: data.pagination || { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 }
        };
    },
    getCategories: () => fetch(`${API_URL}/menu/categories/list`).then(parseResponse),
    create: (itemData) => fetch(`${API_URL}/admin/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(itemData)
    }).then(parseResponse),
    update: (id, itemData) => fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(itemData)
    }).then(parseResponse),
    delete: (id) => fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE', headers: authHeaders()
    }).then(parseResponse)
};

export const ordersAPI = {
    getAll: () => fetch(`${API_URL}/orders`, { headers: authHeaders() }).then(parseResponse),
    create: (orderData) => fetch(`${API_URL}/orders`, {
        method: 'POST', headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': checkoutKey('portal', orderData),
            ...(localStorage.getItem('portalToken') ? { Authorization: `Bearer ${localStorage.getItem('portalToken')}` } : {})
        }, body: JSON.stringify(orderData)
    }).then(parseResponse),
    getStats: () => fetch(`${API_URL}/dashboard/stats`).then(parseResponse)
        .catch(() => fetch(`${API_URL}/stats`).then(parseResponse))
        .catch(() => ({ totalRevenue: 0, totalOrders: 0, activeTables: 0 })),
    getToday: () => fetch(`${API_URL}/orders/today`, { headers: authHeaders() }).then(parseResponse).catch(() => [])
};

export { API_URL, authHeaders, fetchWithTimeout, parseResponse };
