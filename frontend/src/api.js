import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request Interceptor to add Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Token ${token}`
    }
    return config
})

// Inventory APIs
export const fetchCategories = () => api.get('/categories/')
export const fetchProducts = () => api.get('/products/')
export const fetchVariants = (search = '') =>
    api.get('/variants/', { params: { search } })
export const createProduct = (data) => api.post('/products/', data)
export const createVariant = (data) => api.post('/variants/', data)
export const updateVariant = (id, data) => api.put(`/variants/${id}/`, data)
export const deleteVariant = (id) => api.delete(`/variants/${id}/`)

// Sales APIs
export const createSale = (data) => api.post('/sales/', data)
export const fetchSales = () => api.get('/sales/')
export const fetchSalesAnalytics = (params = { days: 30 }) => api.get('/sales/analytics/', { params })

// Returns APIs
export const fetchReturns = () => api.get('/returns/')
export const createReturn = (data) => api.post('/returns/', data)

// Auth APIs
export const login = (credentials) => api.post(`${API_BASE_URL.replace('/api', '')}/api-token-auth/`, credentials)
