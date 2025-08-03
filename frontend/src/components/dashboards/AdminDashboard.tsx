import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  Building, 
  Calendar,
  LogOut,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { Restaurant, User, Booking } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSubAdminModal, setShowAddSubAdminModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newSubAdmin, setNewSubAdmin] = useState({
    name: '',
    email: '',
    password: '',
    restaurant: ''
  });
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'India'
    },
    phone: '',
    email: '',
    cuisine: [] as string[],
    priceRange: 'moderate',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '22:00', isClosed: false },
      sunday: { open: '09:00', close: '22:00', isClosed: false }
    },
    amenities: [] as string[],
    seats: [] as any[]
  });
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [restaurantsRes, usersRes, bookingsRes] = await Promise.all([
        axios.get('/api/restaurant/admin/managed'),
        axios.get('/api/user'),
        axios.get('/api/booking/admin')
      ]);

      if (restaurantsRes.data.success) {
        setRestaurants(restaurantsRes.data.restaurants || []);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }
      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    try {
      if (!newRestaurant.name || !newRestaurant.phone || !newRestaurant.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData = new FormData();
      formData.append('name', newRestaurant.name);
      formData.append('description', newRestaurant.description);
      formData.append('address', JSON.stringify(newRestaurant.address));
      formData.append('phone', newRestaurant.phone);
      formData.append('email', newRestaurant.email);
      formData.append('cuisine', JSON.stringify(newRestaurant.cuisine));
      formData.append('priceRange', newRestaurant.priceRange);
      formData.append('operatingHours', JSON.stringify(newRestaurant.operatingHours));
      formData.append('amenities', JSON.stringify(newRestaurant.amenities));
      formData.append('seats', JSON.stringify(newRestaurant.seats));

      const response = await axios.post('/api/restaurant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Restaurant created successfully');
        setShowAddModal(false);
        resetForm();
        fetchDashboardData();
      }
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast.error(error.response?.data?.message || 'Failed to create restaurant');
    }
  };

  const resetForm = () => {
    setNewRestaurant({
      name: '',
      description: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India'
      },
      phone: '',
      email: '',
      cuisine: [],
      priceRange: 'moderate',
      operatingHours: {
        monday: { open: '09:00', close: '22:00', isClosed: false },
        tuesday: { open: '09:00', close: '22:00', isClosed: false },
        wednesday: { open: '09:00', close: '22:00', isClosed: false },
        thursday: { open: '09:00', close: '22:00', isClosed: false },
        friday: { open: '09:00', close: '22:00', isClosed: false },
        saturday: { open: '09:00', close: '22:00', isClosed: false },
        sunday: { open: '09:00', close: '22:00', isClosed: false }
      },
      amenities: [],
      seats: []
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRestaurant(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRestaurant(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
  };

  const handleCuisineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cuisineArray = value.split(',').map(c => c.trim()).filter(c => c);
    setNewRestaurant(prev => ({ ...prev, cuisine: cuisineArray }));
  };

  // User management functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || 
                         (userStatusFilter === 'active' && user.isActive) ||
                         (userStatusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const viewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const editUser = (user: User) => {
    // For now, just show user details - can be expanded to edit form
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await axios.put(`/api/auth/users/${userId}/status`, { isActive });
      if (response.data.success) {
        toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchDashboardData(); // Refresh data
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await axios.delete(`/api/user/${userId}`);
        if (response.data.success) {
          toast.success('User deleted successfully');
          fetchDashboardData(); // Refresh data
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleAddSubAdmin = async () => {
    try {
      if (!newSubAdmin.name || !newSubAdmin.email || !newSubAdmin.password || !newSubAdmin.restaurant) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await axios.post('/api/auth/subadmin', newSubAdmin);
      if (response.data.success) {
        toast.success('SubAdmin created successfully');
        setShowAddSubAdminModal(false);
        setNewSubAdmin({ name: '', email: '', password: '', restaurant: '' });
        fetchDashboardData(); // Refresh data
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create SubAdmin');
    }
  };

  const handleSubAdminInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSubAdmin(prev => ({ ...prev, [name]: value }));
  };

  const stats = {
    totalRestaurants: restaurants.length,
    totalUsers: users.filter(u => u.role === 'user').length,
    totalSubAdmins: users.filter(u => u.role === 'subadmin').length,
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => ['confirmed', 'arrived'].includes(b.status)).length,
    revenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <h3 className="text-lg font-medium text-gray-900 truncate">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const RestaurantTable = ({ restaurants }: { restaurants: Restaurant[] }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Restaurants</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <tr key={restaurant._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                    <div className="text-sm text-gray-500">{restaurant.cuisine?.join(', ') || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {restaurant.address?.city || 'N/A'}, {restaurant.address?.state || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {restaurant.totalSeats || restaurant.seats?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {restaurant.rating?.average?.toFixed(1) || '0.0'} ({restaurant.rating?.count || 0})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
    const matchesSearch = booking.bookingId.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
                         booking.user?.name?.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
                         booking.restaurant?.name?.toLowerCase().includes(bookingSearchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const viewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    // For now, just show booking details - can be expanded to edit form
    setShowUserModal(true); // Reusing UserModal for Booking details
  };

  const editBooking = (booking: Booking) => {
    // For now, just show booking details - can be expanded to edit form
    setSelectedBooking(booking);
    setShowUserModal(true); // Reusing UserModal for Booking details
  };

  const toggleBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await axios.put(`/api/booking/${bookingId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Booking status updated to ${newStatus} successfully`);
        fetchDashboardData(); // Refresh data
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        const response = await axios.delete(`/api/booking/${bookingId}`);
        if (response.data.success) {
          toast.success('Booking deleted successfully');
          fetchDashboardData(); // Refresh data
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete booking');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
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
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'restaurants'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Restaurants</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bookings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Bookings</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Restaurants"
                value={stats.totalRestaurants}
                icon={Building}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                color="bg-green-500"
              />
              <StatCard
                title="Active Bookings"
                value={stats.activeBookings}
                icon={Calendar}
                color="bg-yellow-500"
              />
              <StatCard
                title="Total Revenue"
                value={`₹${stats.revenue.toLocaleString()}`}
                icon={BarChart3}
                color="bg-purple-500"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Restaurants</h3>
                <div className="space-y-3">
                  {restaurants.slice(0, 5).map((restaurant) => (
                    <div key={restaurant._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-600">{restaurant.address?.city || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{booking.restaurant?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'arrived' ? 'bg-green-100 text-green-800' :
                        booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Restaurant</span>
              </button>
            </div>
            <RestaurantTable restaurants={restaurants} />
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
              <button 
                onClick={() => setShowAddSubAdminModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add SubAdmin</span>
              </button>
            </div>
            
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="subadmin">SubAdmins</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredUsers.length} of {users.length} users
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'subadmin' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.restaurant?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => viewUser(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => editUser(user)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => toggleUserStatus(user._id, !user.isActive)}
                              className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {user.role !== 'admin' && (
                              <button 
                                onClick={() => deleteUser(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {userSearchTerm || userRoleFilter !== 'all' || userStatusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No users available in the system.'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="arrived">Arrived</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Bookings Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">Total Bookings</h3>
                    <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">Completed</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredBookings.filter(b => b.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-500">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">Active</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredBookings.filter(b => ['confirmed', 'arrived'].includes(b.status)).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.bookingId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.user?.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{booking.contactPhone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.restaurant?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">{booking.bookingTime}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.seatNumber} ({booking.partySize} people)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'arrived' ? 'bg-green-100 text-green-800' :
                            booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{booking.totalAmount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => viewBooking(booking)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredBookings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">
                  {bookingSearchTerm || bookingStatusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No bookings available in the system.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Restaurant</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Restaurant Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newRestaurant.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter restaurant name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={newRestaurant.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter restaurant description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Street</label>
                      <input
                        type="text"
                        name="street"
                        value={newRestaurant.address.street}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        name="city"
                        value={newRestaurant.address.city}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        name="state"
                        value={newRestaurant.address.state}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                      <input
                        type="text"
                        name="zip"
                        value={newRestaurant.address.zip}
                        onChange={handleAddressChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={newRestaurant.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={newRestaurant.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cuisine Types</label>
                    <input
                      type="text"
                      value={newRestaurant.cuisine.join(', ')}
                      onChange={handleCuisineChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Italian, Indian, Chinese (comma separated)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price Range</label>
                    <select
                      name="priceRange"
                      value={newRestaurant.priceRange}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="budget">Budget ($)</option>
                      <option value="moderate">Moderate ($$)</option>
                      <option value="expensive">Expensive ($$$)</option>
                      <option value="luxury">Luxury ($$$$)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddRestaurant}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add SubAdmin Modal */}
      {showAddSubAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddSubAdminModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New SubAdmin</h3>
                  <button
                    onClick={() => setShowAddSubAdminModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newSubAdmin.name}
                      onChange={handleSubAdminInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={newSubAdmin.email}
                      onChange={handleSubAdminInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={newSubAdmin.password}
                      onChange={handleSubAdminInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Restaurant *</label>
                    <select
                      name="restaurant"
                      value={newSubAdmin.restaurant}
                      onChange={handleSubAdminInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Restaurant</option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddSubAdmin}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create SubAdmin
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSubAdminModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUserModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        selectedUser.role === 'subadmin' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedUser.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
                    </div>
                  )}
                  
                  {selectedUser.restaurant && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Restaurant</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.restaurant.name}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 