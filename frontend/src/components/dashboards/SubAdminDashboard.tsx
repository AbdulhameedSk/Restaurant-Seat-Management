import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  LogOut,
  Building2,
  UserCheck,
  XCircle,
  Plus,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { Booking } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SubAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket, joinRestaurant } = useSocket();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    arrivedBookings: 0,
    completedBookings: 0
  });
  const [activeTab, setActiveTab] = useState('bookings');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [seatStatus, setSeatStatus] = useState([]);
  const [walkInForm, setWalkInForm] = useState({
    customerName: '',
    customerPhone: '',
    seatNumber: '',
    seatType: 'table-2',
    partySize: 1,
    specialRequests: ''
  });

  useEffect(() => {
    if (user?.restaurant && socket) {
      joinRestaurant(user.restaurant._id);
    }
  }, [user?.restaurant, socket, joinRestaurant]);

  useEffect(() => {
    fetchBookings();
    if (activeTab === 'seats') {
      fetchSeatStatus();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/booking/restaurant');
      
      if (response.data.success) {
        const bookingsData = response.data.bookings || [];
        setBookings(bookingsData);
        
        // Calculate stats
        setStats({
          totalBookings: bookingsData.length,
          confirmedBookings: bookingsData.filter((b: Booking) => b.status === 'confirmed').length,
          arrivedBookings: bookingsData.filter((b: Booking) => b.status === 'arrived').length,
          completedBookings: bookingsData.filter((b: Booking) => b.status === 'completed').length
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const markAsArrived = async (bookingId: string) => {
    try {
      const response = await axios.post(`/api/booking/${bookingId}/verify`);
      if (response.data.success) {
        toast.success('Customer marked as arrived');
        fetchBookings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark as arrived');
    }
  };

  const markAsCompleted = async (bookingId: string) => {
    try {
      const response = await axios.put(`/api/booking/${bookingId}/complete`);
      if (response.data.success) {
        toast.success('Booking marked as completed');
        fetchBookings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark as completed');
    }
  };

  const markAsNoShow = async (bookingId: string) => {
    try {
      const response = await axios.post(`/api/booking/${bookingId}/no-show`);
      if (response.data.success) {
        toast.success('Booking marked as no-show');
        fetchBookings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark as no-show');
    }
  };

  const fetchSeatStatus = async () => {
    try {
      const response = await axios.get('/api/booking/seat-status');
      if (response.data.success) {
        setSeatStatus(response.data.seatStatus || []);
      }
    } catch (error) {
      console.error('Error fetching seat status:', error);
      toast.error('Failed to load seat status');
    }
  };

  const handleWalkInBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/api/booking/walk-in', walkInForm);
      if (response.data.success) {
        toast.success('Walk-in customer seated successfully!');
        setShowWalkInModal(false);
        setWalkInForm({
          customerName: '',
          customerPhone: '',
          seatNumber: '',
          seatType: 'table-2',
          partySize: 1,
          specialRequests: ''
        });
        fetchBookings();
        fetchSeatStatus();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create walk-in booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge-info">Confirmed</span>;
      case 'arrived':
        return <span className="badge-success">Arrived</span>;
      case 'completed':
        return <span className="badge-secondary">Completed</span>;
      case 'cancelled':
        return <span className="badge-error">Cancelled</span>;
      case 'no-show':
        return <span className="badge-error">No Show</span>;
      default:
        return <span className="badge-warning">{status}</span>;
    }
  };

  const canMarkAsArrived = (booking: Booking) => {
    return booking.status === 'confirmed';
  };

  const canMarkAsCompleted = (booking: Booking) => {
    return booking.status === 'arrived';
  };

  const canMarkAsNoShow = (booking: Booking) => {
    return booking.status === 'confirmed';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <UserCheck className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-secondary-900">SubAdmin Dashboard</h1>
                <p className="text-sm text-secondary-600">
                  Managing: {user?.restaurant?.name || 'Restaurant'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-secondary-600">
                <span>Welcome,</span>
                <span className="font-medium text-secondary-900">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'bookings', label: 'Bookings', icon: Calendar },
              { key: 'seats', label: 'Seat Status', icon: Eye }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`nav-tab ${
                  activeTab === key ? 'nav-tab-active' : 'nav-tab-inactive'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <Calendar className="h-12 w-12 text-primary-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Bookings</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Clock className="h-12 w-12 text-warning-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-secondary-600">Confirmed</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.confirmedBookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <CheckCircle className="h-12 w-12 text-success-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-secondary-600">Arrived</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.arrivedBookings}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Users className="h-12 w-12 text-secondary-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-secondary-600">Completed</p>
                <p className="text-3xl font-bold text-secondary-900">{stats.completedBookings}</p>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'bookings' && (
          <>
            {/* Bookings Management */}
            <div className="card">
              <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-subheading">Today's Bookings</h2>
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Walk-in Customer</span>
                </button>
              </div>
          
          <div className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-700 mb-2">No bookings today</h3>
                <p className="text-secondary-500">Bookings will appear here when customers make reservations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="bg-secondary-50 border border-secondary-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-secondary-900">
                            {booking.user?.name || 'Customer'}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-secondary-500" />
                            <span className="text-secondary-700">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-secondary-500" />
                            <span className="text-secondary-700">{booking.bookingTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-secondary-500" />
                            <span className="text-secondary-700">{booking.partySize} people</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-secondary-700">Seat {booking.seatNumber}</span>
                          </div>
                        </div>

                        {booking.specialRequests && (
                          <div className="mb-4 p-3 bg-white border border-secondary-200 rounded-lg">
                            <p className="text-sm text-secondary-700">
                              <strong>Special Requests:</strong> {booking.specialRequests}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-3">
                          {canMarkAsArrived(booking) && (
                            <button
                              onClick={() => markAsArrived(booking._id)}
                              className="btn-success flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Mark Arrived</span>
                            </button>
                          )}
                          
                          {canMarkAsCompleted(booking) && (
                            <button
                              onClick={() => markAsCompleted(booking._id)}
                              className="btn-primary flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Mark Completed</span>
                            </button>
                          )}
                          
                          {canMarkAsNoShow(booking) && (
                            <button
                              onClick={() => markAsNoShow(booking._id)}
                              className="btn-danger flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>No Show</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {activeTab === 'seats' && (
          <div className="card">
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-subheading">Live Seat Status</h2>
              <button
                onClick={fetchSeatStatus}
                className="btn-secondary"
              >
                Refresh
              </button>
            </div>
            
            <div className="p-6">
              {seatStatus.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">No seat data available</h3>
                  <p className="text-secondary-500">Seat information will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {seatStatus.map((seat: any) => (
                    <div 
                      key={seat._id} 
                      className={`p-4 rounded-lg border-2 text-center ${
                        seat.isAvailable 
                          ? 'border-success-200 bg-success-50' 
                          : 'border-error-200 bg-error-50'
                      }`}
                    >
                      <div className="font-semibold text-secondary-900 mb-1">
                        {seat.seatNumber}
                      </div>
                      <div className="text-xs text-secondary-600 mb-2">
                        {seat.seatType}
                      </div>
                      <div className={`text-xs font-medium ${
                        seat.isAvailable ? 'text-success-700' : 'text-error-700'
                      }`}>
                        {seat.isAvailable ? 'Available' : 'Occupied'}
                      </div>
                      {seat.booking && (
                        <div className="mt-2 p-2 bg-white rounded text-xs">
                          <div className="font-medium">{seat.booking.customerName}</div>
                          <div className="text-secondary-600">{seat.booking.customerPhone}</div>
                          <div className="text-secondary-600">{seat.booking.partySize} people</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card p-6 mt-8">
          <h3 className="text-subheading mb-4">SubAdmin Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-3" />
              <h4 className="font-semibold text-secondary-900 mb-2">Mark Arrived</h4>
              <p className="text-sm text-secondary-600">
                When customers arrive, mark them as "Arrived" to track their presence
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-3" />
              <h4 className="font-semibold text-secondary-900 mb-2">Mark Completed</h4>
              <p className="text-sm text-secondary-600">
                When customers finish dining and leave, mark the booking as "Completed"
              </p>
            </div>
            <div className="text-center">
              <XCircle className="h-12 w-12 text-error-600 mx-auto mb-3" />
              <h4 className="font-semibold text-secondary-900 mb-2">Handle No-Shows</h4>
              <p className="text-sm text-secondary-600">
                If customers don't arrive within 15 minutes, mark as "No Show"
              </p>
            </div>
          </div>
        </div>

        {/* Walk-in Modal */}
        {showWalkInModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={() => setShowWalkInModal(false)}></div>
              
              <div className="inline-block align-bottom modal text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-subheading">Seat Walk-in Customer</h3>
                    <button
                      onClick={() => setShowWalkInModal(false)}
                      className="text-secondary-400 hover:text-secondary-600 transition-colors"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleWalkInBooking} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={walkInForm.customerName}
                        onChange={(e) => setWalkInForm(prev => ({ ...prev, customerName: e.target.value }))}
                        className="input"
                        placeholder="Enter customer name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={walkInForm.customerPhone}
                        onChange={(e) => setWalkInForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        className="input"
                        placeholder="10-digit phone number"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Seat Number *</label>
                        <input
                          type="text"
                          required
                          value={walkInForm.seatNumber}
                          onChange={(e) => setWalkInForm(prev => ({ ...prev, seatNumber: e.target.value }))}
                          className="input"
                          placeholder="e.g., T1, B1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Seat Type *</label>
                        <select
                          value={walkInForm.seatType}
                          onChange={(e) => setWalkInForm(prev => ({ ...prev, seatType: e.target.value }))}
                          className="input"
                        >
                          <option value="table-2">Table for 2</option>
                          <option value="table-4">Table for 4</option>
                          <option value="table-6">Table for 6</option>
                          <option value="bar">Bar Seat</option>
                          <option value="counter">Counter</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Party Size *</label>
                      <select
                        value={walkInForm.partySize}
                        onChange={(e) => setWalkInForm(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                        className="input"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                          <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Special Requests</label>
                      <textarea
                        rows={2}
                        value={walkInForm.specialRequests}
                        onChange={(e) => setWalkInForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                        className="input"
                        placeholder="Any special requirements..."
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowWalkInModal(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading ? 'Seating...' : 'Seat Customer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubAdminDashboard; 