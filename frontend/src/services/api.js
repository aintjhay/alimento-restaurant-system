const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

// Helper function to fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  let timeoutId;
  let isAborted = false;
  
  try {
    timeoutId = setTimeout(() => {
      isAborted = true;
      controller.abort();
    }, timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (isAborted) {
      console.warn(`⏱️ Fetch timeout after ${timeout}ms for ${url}`);
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

// Menu API calls
export const menuAPI = {
    getAll: async () => {
        try {
            console.log(`🔗 Fetching menu from: ${API_URL}/menu`);
            // Use longer timeout (60 seconds) for initial menu load - backend may be cold starting
            const response = await fetchWithTimeout(`${API_URL}/menu`, {}, 60000);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Menu API response:`, data);
            
            // Handle both array and wrapper formats
            if (Array.isArray(data)) {
                return data;
            } else if (data && data.data && Array.isArray(data.data)) {
                return data.data;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.warn('⚠️ Menu response is not in expected format:', typeof data);
                return [];
            }
        } catch (error) {
            console.error('❌ Menu API error:', error.message, error);
            return [];
        }
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
