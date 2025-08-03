import axios from 'axios';
import { Restaurant, Booking, User, ApiResponse } from '../types';

// Set base URL for all API requests
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    axios.post<ApiResponse>('/api/auth/login', { email, password }),
  
  register: (userData: { name: string; email: string; password: string; phone: string }) =>
    axios.post<ApiResponse>('/api/auth/register', userData),
  
  getProfile: () =>
    axios.get<ApiResponse<{ user: User }>>('/api/auth/me'),
  
  updateProfile: (userData: { name?: string; phone?: string }) =>
    axios.put<ApiResponse>('/api/auth/profile', userData),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    axios.put<ApiResponse>('/api/auth/password', { currentPassword, newPassword }),
  
  createSubAdmin: (userData: { name: string; email: string; password: string; restaurant: string }) =>
    axios.post<ApiResponse>('/api/auth/subadmin', userData),
  
  getSubAdmins: () =>
    axios.get<ApiResponse<{ subAdmins: User[] }>>('/api/auth/subadmins'),
  
  updateUserStatus: (userId: string, isActive: boolean) =>
    axios.put<ApiResponse>(`/api/auth/users/${userId}/status`, { isActive })
};

// Restaurant API
export const restaurantAPI = {
  getAll: () =>
    axios.get<ApiResponse<{ restaurants: Restaurant[] }>>('/api/restaurant'),
  
  getById: (id: string) =>
    axios.get<ApiResponse<{ restaurant: Restaurant }>>(`/api/restaurant/${id}`),
  
  create: (restaurantData: FormData) =>
    axios.post<ApiResponse>('/api/restaurant', restaurantData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: string, restaurantData: FormData) =>
    axios.put<ApiResponse>(`/api/restaurant/${id}`, restaurantData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id: string) =>
    axios.delete<ApiResponse>(`/api/restaurant/${id}`),
  
  updateSeats: (id: string, seats: any[]) =>
    axios.put<ApiResponse>(`/api/restaurant/${id}/seats`, { seats }),
  
  getAdminRestaurants: () =>
    axios.get<ApiResponse<{ restaurants: Restaurant[] }>>('/api/restaurant/admin'),
  
  toggleStatus: (id: string) =>
    axios.patch<ApiResponse>(`/api/restaurant/${id}/toggle-status`)
};

// Booking API
export const bookingAPI = {
  create: (bookingData: {
    restaurant: string;
    seatNumber: string;
    seatType: string;
    partySize: number;
    bookingDate: string;
    bookingTime: string;
    specialRequests?: string;
    contactPhone: string;
  }) =>
    axios.post<ApiResponse>('/api/booking', bookingData),
  
  getUserBookings: () =>
    axios.get<ApiResponse<{ bookings: Booking[] }>>('/api/booking/my-bookings'),
  
  getRestaurantBookings: () =>
    axios.get<ApiResponse<{ bookings: Booking[] }>>('/api/booking/restaurant'),
  
  getAdminBookings: () =>
    axios.get<ApiResponse<{ bookings: Booking[] }>>('/api/booking/admin'),
  
  getById: (id: string) =>
    axios.get<ApiResponse<{ booking: Booking }>>(`/api/booking/${id}`),
  
  verifyArrival: (id: string) =>
    axios.post<ApiResponse>(`/api/booking/${id}/verify`),
  
  markNoShow: (id: string) =>
    axios.post<ApiResponse>(`/api/booking/${id}/no-show`),
  
  cancel: (id: string, reason: string) =>
    axios.post<ApiResponse>(`/api/booking/${id}/cancel`, { reason }),
  
  complete: (id: string) =>
    axios.post<ApiResponse>(`/api/booking/${id}/complete`),
  
  updateStatus: (id: string, status: string, notes?: string) =>
    axios.patch<ApiResponse>(`/api/booking/${id}/status`, { status, notes })
};

// User API
export const userAPI = {
  getAll: () =>
    axios.get<ApiResponse<{ users: User[] }>>('/api/user'),
  
  getById: (id: string) =>
    axios.get<ApiResponse<{ user: User }>>(`/api/user/${id}`),
  
  update: (id: string, userData: { name?: string; email?: string; phone?: string }) =>
    axios.put<ApiResponse>(`/api/user/${id}`, userData),
  
  delete: (id: string) =>
    axios.delete<ApiResponse>(`/api/user/${id}`),
  
  toggleStatus: (id: string) =>
    axios.patch<ApiResponse>(`/api/user/${id}/toggle-status`)
};

// Analytics API (if needed)
export const analyticsAPI = {
  getDashboardStats: () =>
    axios.get<ApiResponse>('/api/analytics/dashboard'),
  
  getRestaurantStats: (restaurantId: string) =>
    axios.get<ApiResponse>(`/api/analytics/restaurant/${restaurantId}`),
  
  getBookingTrends: (period: string) =>
    axios.get<ApiResponse>(`/api/analytics/booking-trends?period=${period}`),
  
  getRevenueStats: (restaurantId?: string) =>
    axios.get<ApiResponse>(`/api/analytics/revenue${restaurantId ? `?restaurant=${restaurantId}` : ''}`)
};

export default {
  auth: authAPI,
  restaurant: restaurantAPI,
  booking: bookingAPI,
  user: userAPI,
  analytics: analyticsAPI
}; 