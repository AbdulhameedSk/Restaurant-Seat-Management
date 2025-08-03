import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Calendar,
  LogOut,
  AlertCircle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { Booking, Restaurant } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SubAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { joinRestaurant, socket } = useSocket();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user?.restaurant && socket) {
      joinRestaurant(user.restaurant._id);
    }
  }, [user?.restaurant, socket, joinRestaurant]);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, restaurantRes] = await Promise.all([
        axios.get(`/api/booking/restaurant/${user?.restaurant?._id}`),
        axios.get(`/api/restaurant/${user?.restaurant?._id}`)
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
      }
      if (restaurantRes.data.success) {
        setRestaurant(restaurantRes.data.restaurant);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const verifyArrival = async (bookingId: string) => {
    try {
      const response = await axios.post(`/api/booking/${bookingId}/verify`);
      if (response.data.success) {
        toast.success('Arrival verified successfully');
        fetchDashboardData(); // Refresh data
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to verify arrival';
      toast.error(message);
    }
  };

  const markAsNoShow = async (bookingId: string) => {
    try {
      const response = await axios.post(`/api/booking/${bookingId}/no-show`);
      if (response.data.success) {
        toast.success('Marked as no-show');
        fetchDashboardData(); // Refresh data
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to mark as no-show';
      toast.error(message);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.contactPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    arrivedBookings: bookings.filter(b => b.status === 'arrived').length,
    pendingVerification: bookings.filter(b => b.status === 'confirmed' && !b.verified).length
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <h3 className="text-lg font-medium text-gray-900 truncate">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const isExpiringSoon = new Date(booking.arrivalDeadline).getTime() - new Date().getTime() < 5 * 60 * 1000; // 5 minutes
    const isExpired = new Date().getTime() > new Date(booking.arrivalDeadline).getTime();

    return (
      <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
        booking.status === 'arrived' ? 'border-green-500' :
        booking.status === 'confirmed' && !isExpired ? 'border-blue-500' :
        booking.status === 'confirmed' && isExpired ? 'border-red-500' :
        'border-gray-300'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{booking.user.name}</h3>
            <p className="text-sm text-gray-600">Booking ID: {booking.bookingId}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isExpiringSoon && booking.status === 'confirmed' && !booking.verified && (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              booking.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
              booking.status === 'arrived' ? 'bg-green-50 text-green-700' :
              booking.status === 'completed' ? 'bg-gray-50 text-gray-700' :
              booking.status === 'cancelled' ? 'bg-red-50 text-red-700' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              {booking.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-600">Date & Time</p>
            <p className="font-medium">
              {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Party Size</p>
            <p className="font-medium">{booking.partySize} people</p>
          </div>
          <div>
            <p className="text-gray-600">Seat</p>
            <p className="font-medium">{booking.seatNumber} ({booking.seatType})</p>
          </div>
          <div>
            <p className="text-gray-600">Contact</p>
            <p className="font-medium">{booking.contactPhone}</p>
          </div>
        </div>

        {booking.status === 'confirmed' && !booking.verified && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Arrival deadline: {new Date(booking.arrivalDeadline).toLocaleString()}
              </span>
            </div>
            {isExpired && (
              <span className="text-xs text-red-600 font-medium">EXPIRED</span>
            )}
          </div>
        )}

        {booking.specialRequests && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Special Requests:</p>
            <p className="text-sm font-medium">{booking.specialRequests}</p>
          </div>
        )}

        {booking.status === 'confirmed' && !booking.verified && (
          <div className="flex space-x-3">
            <button
              onClick={() => verifyArrival(booking._id)}
              disabled={isExpired}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Verify Arrival</span>
            </button>
            <button
              onClick={() => markAsNoShow(booking._id)}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Mark No-Show
            </button>
          </div>
        )}

        {booking.verified && booking.verificationTime && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Verified at: {new Date(booking.verificationTime).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading subadmin dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {restaurant?.name} - SubAdmin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Refresh</span>
              </button>
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            color="bg-blue-500"
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmedBookings}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Arrived"
            value={stats.arrivedBookings}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Pending Verification"
            value={stats.pendingVerification}
            icon={AlertCircle}
            color="bg-red-500"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="arrived">Arrived</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No bookings available for this restaurant.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubAdminDashboard; 