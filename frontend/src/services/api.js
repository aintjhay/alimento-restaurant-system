const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Menu API calls
export const menuAPI = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/menu`);
        const data = await response.json();
        return data.data || data; // Handle both formats
    },
    
    create: (itemData) => 
        fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        }).then(res => res.json()),
    
    update: (id, itemData) => 
        fetch(`${API_URL}/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        }).then(res => res.json()),
    
    delete: (id) => 
        fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' }).then(res => res.json())
};

// Orders API calls - check what endpoints you have
export const ordersAPI = {
    // Test if orders endpoint exists
    getAll: () => fetch(`${API_URL}/orders`).then(res => res.json()),
    
    create: (orderData) => 
        fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        }).then(res => res.json()),
    
    // Try common dashboard endpoints
    getStats: () => fetch(`${API_URL}/dashboard/stats`).then(res => res.json())
        .catch(() => fetch(`${API_URL}/stats`).then(res => res.json()))
        .catch(() => ({ totalRevenue: 0, totalOrders: 0, activeTables: 0 })),
    
    getToday: () => fetch(`${API_URL}/orders/today`).then(res => res.json())
        .catch(() => [])
};
