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
  
  registerRestaurantOwner: (userData: { name: string; email: string; password: string; phone: string }) =>
    axios.post<ApiResponse>('/api/auth/register-restaurant-owner', userData),
  
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
  
  create: (formData: FormData) =>
    axios.post<ApiResponse<{ restaurant: Restaurant }>>('/api/restaurant', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: string, formData: FormData) =>
    axios.put<ApiResponse<{ restaurant: Restaurant }>>(`/api/restaurant/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id: string) =>
    axios.delete<ApiResponse>(`/api/restaurant/${id}`),
  
  getOwnerRestaurants: () =>
    axios.get<ApiResponse<{ restaurants: Restaurant[] }>>('/api/restaurant/owner/managed'),
    
  getAdminRestaurants: () =>
    axios.get<ApiResponse<{ restaurants: Restaurant[] }>>('/api/restaurant/admin/all'),
  
  toggleStatus: (id: string) =>
    axios.patch<ApiResponse>(`/api/restaurant/${id}/toggle-status`),
  
  // New seat availability endpoints
  getSeatAvailability: (id: string, date: string, time: string) =>
    axios.get<ApiResponse<{
      restaurant: {
        _id: string;
        name: string;
        description: string;
        images: any[];
        operatingHours: any;
      };
      date: string;
      time: string;
      seatAvailability: Array<{
        _id: string;
        seatNumber: string;
        seatType: string;
        position: { x: number; y: number };
        isAvailable: boolean;
        capacity: number;
      }>;
      availableSeats: any[];
      totalSeats: number;
      availableCount: number;
      nextAvailableTimes: Array<{
        date: string;
        time: string;
        availableSeats: number;
        totalSeats: number;
      }>;
      timeSlots: string[];
    }>>(`/api/restaurant/${id}/seat-availability?date=${date}&time=${time}`),
  
  getAvailableSeats: (id: string, date?: string, time?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (time) params.append('time', time);
    const queryString = params.toString();
    
    return axios.get<ApiResponse<{
      seats: Array<{
        _id: string;
        seatNumber: string;
        seatType: string;
        position: { x: number; y: number };
        isAvailable: boolean;
      }>;
      date?: string;
      time?: string;
      totalSeats: number;
      availableCount: number;
    }>>(`/api/restaurant/${id}/available-seats${queryString ? '?' + queryString : ''}`);
  }
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
    axios.get<ApiResponse<{ bookings: Booking[] }>>('/api/booking/owner/restaurants'),
  
  getSubAdminBookings: () =>
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
    axios.patch<ApiResponse>(`/api/booking/${id}/status`, { status, notes }),
  
  // SubAdmin specific booking management
  createWalkIn: (walkInData: {
    customerName: string;
    customerPhone: string;
    seatNumber: string;
    seatType: string;
    partySize: number;
    specialRequests?: string;
  }) =>
    axios.post<ApiResponse>('/api/booking/walk-in', walkInData),
  
  getSeatStatus: (date?: string, time?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (time) params.append('time', time);
    const queryString = params.toString();
    
    return axios.get<ApiResponse<{ seatStatus: any[] }>>(`/api/booking/seat-status${queryString ? '?' + queryString : ''}`);
  }
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