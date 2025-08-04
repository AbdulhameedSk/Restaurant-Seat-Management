import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Users, 
  Calendar, 
  UserPlus,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  Clock,
  BarChart3,
  Utensils
} from 'lucide-react';
import axios from 'axios';
import { Restaurant, User, Booking } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const RestaurantOwnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subAdmins, setSubAdmins] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubAdminModal, setShowAddSubAdminModal] = useState(false);
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [newSubAdmin, setNewSubAdmin] = useState({
    name: '',
    email: '',
    password: '',
    restaurant: ''
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    description: '',
    cuisine: [] as string[],
    priceRange: 'moderate' as 'budget' | 'moderate' | 'expensive' | 'luxury',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    seats: [] as any[]
  });
  const [currentSeatType, setCurrentSeatType] = useState('table-2');
  const [currentSeatNumber, setCurrentSeatNumber] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel for better performance
      const [restaurantsRes, subAdminsRes, bookingsRes] = await Promise.all([
        axios.get('/api/restaurant/owner/managed').catch(error => {
          console.error('Error fetching restaurants:', error);
          return { data: { success: false, restaurants: [] } };
        }),
        axios.get('/api/auth/subadmins').catch(error => {
          console.error('Error fetching subadmins:', error);
          return { data: { success: false, subAdmins: [] } };
        }),
        axios.get('/api/booking/owner/restaurants').catch(error => {
          console.error('Error fetching bookings:', error);
          return { data: { success: false, bookings: [] } };
        })
      ]);

      // Process restaurants
      if (restaurantsRes.data.success) {
        setRestaurants(restaurantsRes.data.restaurants || []);
        console.log('Restaurants loaded:', restaurantsRes.data.restaurants?.length || 0);
      }

      // Process subadmins
      if (subAdminsRes.data.success) {
        setSubAdmins(subAdminsRes.data.subAdmins || []);
        console.log('SubAdmins loaded:', subAdminsRes.data.subAdmins?.length || 0);
      }

      // Process bookings
      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
        console.log('Bookings loaded:', bookingsRes.data.bookings?.length || 0);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Only show error if all requests fail
      toast.error('Some data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubAdmin = async () => {
    if (!newSubAdmin.name || !newSubAdmin.email || !newSubAdmin.password || !newSubAdmin.restaurant) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/auth/subadmin', newSubAdmin);
      
      if (response.data.success) {
        toast.success(`SubAdmin "${newSubAdmin.name}" created successfully!`);
        setShowAddSubAdminModal(false);
        setNewSubAdmin({
          name: '',
          email: '',
          password: '',
          restaurant: ''
        });
        // Refresh dashboard data to show the new subadmin
        fetchDashboardData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create SubAdmin');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Add basic info
      formData.append('name', newRestaurant.name);
      formData.append('description', newRestaurant.description);
      formData.append('phone', newRestaurant.contactInfo.phone);
      formData.append('email', newRestaurant.contactInfo.email);
      formData.append('priceRange', newRestaurant.priceRange);
      
      // Add address
      formData.append('address', JSON.stringify(newRestaurant.address));
      
      // Add cuisine
      formData.append('cuisine', JSON.stringify(newRestaurant.cuisine));
      
      // Add seats
      formData.append('seats', JSON.stringify(newRestaurant.seats));
      
      // Add operating hours (default)
      const defaultHours = {
        monday: { open: '09:00', close: '22:00', isClosed: false },
        tuesday: { open: '09:00', close: '22:00', isClosed: false },
        wednesday: { open: '09:00', close: '22:00', isClosed: false },
        thursday: { open: '09:00', close: '22:00', isClosed: false },
        friday: { open: '09:00', close: '22:00', isClosed: false },
        saturday: { open: '09:00', close: '22:00', isClosed: false },
        sunday: { open: '09:00', close: '22:00', isClosed: false }
      };
      formData.append('operatingHours', JSON.stringify(defaultHours));
      
      // Add amenities (default)
      const defaultAmenities = ['wifi', 'parking'];
      formData.append('amenities', JSON.stringify(defaultAmenities));
      
      // Add images
      selectedImages.forEach((image, index) => {
        formData.append('images', image);
      });

      const response = await axios.post('/api/restaurant', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(`Restaurant "${newRestaurant.name}" created successfully!`);
        setShowAddRestaurantModal(false);
        setNewRestaurant({
          name: '',
          description: '',
          cuisine: [],
          priceRange: 'moderate',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          },
          contactInfo: {
            phone: '',
            email: ''
          },
          seats: []
        });
        setSelectedImages([]);
        fetchDashboardData();
      }
    } catch (error: any) {
      console.error('Error adding restaurant:', error);
      toast.error(error.response?.data?.message || 'Failed to add restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCuisineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cuisines = e.target.value.split(',').map(c => c.trim()).filter(c => c);
    setNewRestaurant(prev => ({ ...prev, cuisine: cuisines }));
  };

  const addSeatToLayout = () => {
    if (!currentSeatNumber.trim()) {
      toast.error('Please enter a seat number');
      return;
    }

    if (newRestaurant.seats.some(seat => seat.seatNumber === currentSeatNumber)) {
      toast.error('Seat number already exists');
      return;
    }

    const newSeat = {
      seatNumber: currentSeatNumber,
      seatType: currentSeatType,
      capacity: currentSeatType === 'table-2' ? 2 : 
                currentSeatType === 'table-4' ? 4 : 
                currentSeatType === 'table-6' ? 6 : 1,
      position: { x: 50, y: 50 }
    };

    setNewRestaurant(prev => ({
      ...prev,
      seats: [...prev.seats, newSeat]
    }));
    setCurrentSeatNumber('');
  };

  const removeSeatFromLayout = (index: number) => {
    setNewRestaurant(prev => ({
      ...prev,
      seats: prev.seats.filter((_, i) => i !== index)
    }));
  };

  // Calculate stats
  const stats = {
    totalRestaurants: restaurants.length,
    totalSubAdmins: subAdmins.length,
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => ['confirmed', 'arrived'].includes(b.status)).length,
    revenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 500), 0)
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-secondary-900">Restaurant Owner Dashboard</h1>
                <p className="text-sm text-secondary-600">Manage your restaurant business</p>
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
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'restaurants', label: 'My Restaurants', icon: Building2 },
              { key: 'subadmins', label: 'SubAdmins', icon: Users },
              { key: 'bookings', label: 'Bookings', icon: Calendar }
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
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center">
                  <Building2 className="h-12 w-12 text-primary-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">My Restaurants</p>
                    <p className="text-3xl font-bold text-secondary-900">{stats.totalRestaurants}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <Users className="h-12 w-12 text-success-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">SubAdmins</p>
                    <p className="text-3xl font-bold text-secondary-900">{stats.totalSubAdmins}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <Calendar className="h-12 w-12 text-info-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Total Bookings</p>
                    <p className="text-3xl font-bold text-secondary-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-12 w-12 text-warning-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Active Bookings</p>
                    <p className="text-3xl font-bold text-secondary-900">{stats.activeBookings}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-12 w-12 text-primary-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Revenue</p>
                    <p className="text-3xl font-bold text-secondary-900">₹{stats.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-subheading">Quick Actions</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setShowAddRestaurantModal(true)}
                  className="p-6 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors text-left"
                >
                  <Building2 className="h-8 w-8 text-primary-600 mb-3" />
                  <h3 className="font-semibold text-secondary-900 mb-2">Create Restaurant</h3>
                  <p className="text-sm text-secondary-600">Add a new restaurant with seats, images, and details</p>
                </button>

                <button
                  onClick={() => setActiveTab('restaurants')}
                  className="p-6 bg-info-50 border border-info-200 rounded-xl hover:bg-info-100 transition-colors text-left"
                >
                  <Eye className="h-8 w-8 text-info-600 mb-3" />
                  <h3 className="font-semibold text-secondary-900 mb-2">Manage Restaurants</h3>
                  <p className="text-sm text-secondary-600">View and manage your existing restaurant details and settings</p>
                </button>
                
                <button
                  onClick={() => setShowAddSubAdminModal(true)}
                  className="p-6 bg-success-50 border border-success-200 rounded-xl hover:bg-success-100 transition-colors text-left"
                >
                  <UserPlus className="h-8 w-8 text-success-600 mb-3" />
                  <h3 className="font-semibold text-secondary-900 mb-2">Add SubAdmin</h3>
                  <p className="text-sm text-secondary-600">Create new subadmin accounts to help manage your restaurants</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-heading">My Restaurants</h2>
              <button
                onClick={() => setShowAddRestaurantModal(true)}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Restaurant
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <div key={restaurant._id} className="card group">
                  {restaurant.images && restaurant.images.length > 0 ? (
                    <img
                      src={`http://localhost:5000${restaurant.images[0].url}`}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-secondary-100 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-secondary-400" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-secondary-900">{restaurant.name}</h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-secondary-600">{restaurant.rating?.average || 0}</span>
                      </div>
                    </div>
                    
                    <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{restaurant.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-600">{restaurant.seats?.length || 0} seats</span>
                      <span className="badge-secondary">
                        {restaurant.priceRange}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {restaurants.length === 0 && (
              <div className="text-center py-16 card">
                <Building2 className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-700 mb-2">No restaurants yet</h3>
                <p className="text-secondary-500 mb-4">Create your first restaurant to start managing bookings</p>
                <button
                  onClick={() => setShowAddRestaurantModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Restaurant
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subadmins' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading">SubAdmin Management</h2>
              <button
                onClick={() => setShowAddSubAdminModal(true)}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add SubAdmin
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subAdmins.map((subadmin) => (
                <div key={subadmin._id} className="card p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">{subadmin.name}</h3>
                      <p className="text-sm text-secondary-600">{subadmin.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-secondary-700">
                    <p><strong>Restaurant:</strong> {subadmin.restaurant?.name || 'Not assigned'}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 badge-${subadmin.isActive ? 'success' : 'error'}`}>
                        {subadmin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {subAdmins.length === 0 && (
              <div className="text-center py-16 card">
                <Users className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-700 mb-2">No subadmins yet</h3>
                <p className="text-secondary-500">Create subadmin accounts to help manage your restaurants</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading">All Bookings</h2>
            </div>

            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-secondary-200">
                <h3 className="text-subheading">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Booking ID</th>
                      <th className="table-header-cell">Customer</th>
                      <th className="table-header-cell">Restaurant</th>
                      <th className="table-header-cell">Date & Time</th>
                      <th className="table-header-cell">Seat</th>
                      <th className="table-header-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {bookings.slice(0, 20).map((booking) => (
                      <tr key={booking._id} className="table-row">
                        <td className="table-cell">
                          <div className="text-sm font-medium text-secondary-900">{booking.bookingId || booking._id.slice(-6)}</div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">{booking.user?.name || 'N/A'}</div>
                            <div className="text-sm text-secondary-500">{booking.contactPhone}</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-secondary-900">
                            {typeof booking.restaurant === 'object' ? booking.restaurant.name : 'N/A'}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="text-sm text-secondary-900">
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-secondary-500">{booking.bookingTime}</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm text-secondary-900">
                            {booking.seatNumber} ({booking.partySize} people)
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge-${
                            booking.status === 'confirmed' ? 'info' :
                            booking.status === 'arrived' ? 'success' :
                            booking.status === 'completed' ? 'secondary' :
                            booking.status === 'cancelled' ? 'error' :
                            'warning'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {bookings.length === 0 && (
              <div className="text-center py-12 card">
                <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">No bookings found</h3>
                <p className="text-secondary-600">Bookings will appear here once customers start booking</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add SubAdmin Modal */}
      {showAddSubAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddSubAdminModal(false)}></div>
            
            <div className="inline-block align-bottom modal text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-subheading">Add New SubAdmin</h3>
                  <button
                    onClick={() => setShowAddSubAdminModal(false)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newSubAdmin.name}
                      onChange={(e) => setNewSubAdmin(prev => ({ ...prev, name: e.target.value }))}
                      className="input"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newSubAdmin.email}
                      onChange={(e) => setNewSubAdmin(prev => ({ ...prev, email: e.target.value }))}
                      className="input"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={newSubAdmin.password}
                      onChange={(e) => setNewSubAdmin(prev => ({ ...prev, password: e.target.value }))}
                      className="input"
                      placeholder="Enter password"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Restaurant *</label>
                    <select
                      value={newSubAdmin.restaurant}
                      onChange={(e) => setNewSubAdmin(prev => ({ ...prev, restaurant: e.target.value }))}
                      className="input"
                    >
                      <option value="">Select Restaurant</option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                    {restaurants.length === 0 && (
                      <p className="text-xs text-secondary-500 mt-1">
                        Create a restaurant first to assign subadmins
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubAdminModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSubAdmin}
                  className="btn-primary"
                >
                  Create SubAdmin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddRestaurantModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddRestaurantModal(false)}></div>
            
            <div className="inline-block align-bottom modal text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-subheading">Create New Restaurant</h3>
                  <button
                    onClick={() => setShowAddRestaurantModal(false)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleAddRestaurant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-secondary-900">Basic Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Restaurant Name *</label>
                        <input
                          type="text"
                          required
                          value={newRestaurant.name}
                          onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                          className="input"
                          placeholder="Enter restaurant name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Description *</label>
                        <textarea
                          required
                          rows={3}
                          value={newRestaurant.description}
                          onChange={(e) => setNewRestaurant(prev => ({ ...prev, description: e.target.value }))}
                          className="input"
                          placeholder="Describe your restaurant"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">Phone *</label>
                          <input
                            type="tel"
                            required
                            value={newRestaurant.contactInfo.phone}
                            onChange={(e) => setNewRestaurant(prev => ({ 
                              ...prev, 
                              contactInfo: { ...prev.contactInfo, phone: e.target.value } 
                            }))}
                            className="input"
                            placeholder="10-digit phone"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">Email *</label>
                          <input
                            type="email"
                            required
                            value={newRestaurant.contactInfo.email}
                            onChange={(e) => setNewRestaurant(prev => ({ 
                              ...prev, 
                              contactInfo: { ...prev.contactInfo, email: e.target.value } 
                            }))}
                            className="input"
                            placeholder="restaurant@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-secondary-900">Address</h4>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Street *</label>
                        <input
                          type="text"
                          required
                          value={newRestaurant.address.street}
                          onChange={(e) => setNewRestaurant(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value } 
                          }))}
                          className="input"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={newRestaurant.address.city}
                            onChange={(e) => setNewRestaurant(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value } 
                            }))}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={newRestaurant.address.state}
                            onChange={(e) => setNewRestaurant(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, state: e.target.value } 
                            }))}
                            className="input"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">ZIP Code *</label>
                          <input
                            type="text"
                            required
                            value={newRestaurant.address.zipCode}
                            onChange={(e) => setNewRestaurant(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, zipCode: e.target.value } 
                            }))}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">Country</label>
                          <input
                            type="text"
                            value={newRestaurant.address.country}
                            onChange={(e) => setNewRestaurant(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, country: e.target.value } 
                            }))}
                            className="input"
                            placeholder="India"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Images Upload */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-3">Restaurant Images</h4>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Upload Images (Max 5)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="input"
                      />
                      <p className="text-xs text-secondary-500 mt-1">Supported formats: JPG, PNG, GIF (Max 5MB each)</p>
                      
                      {/* Image Preview */}
                      {selectedImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {selectedImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-1 -right-1 bg-error-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-error-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Restaurant Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Cuisine Types *</label>
                      <input
                        type="text"
                        value={newRestaurant.cuisine.join(', ')}
                        onChange={handleCuisineChange}
                        className="input"
                        placeholder="e.g., Italian, Indian, Chinese"
                      />
                      <p className="text-xs text-secondary-500 mt-1">Separate multiple cuisines with commas</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Price Range *</label>
                      <select
                        required
                        value={newRestaurant.priceRange}
                        onChange={(e) => setNewRestaurant(prev => ({ ...prev, priceRange: e.target.value as any }))}
                        className="input"
                      >
                        <option value="">Select price range</option>
                        <option value="budget">Budget (₹0-500)</option>
                        <option value="moderate">Moderate (₹500-1500)</option>
                        <option value="expensive">Expensive (₹1500-3000)</option>
                        <option value="luxury">Luxury (₹3000+)</option>
                      </select>
                    </div>
                  </div>

                  {/* Seat Management */}
                  <div>
                    <h4 className="font-medium text-secondary-900 mb-3">Seat Management</h4>
                    <div className="border border-secondary-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Seat Type</label>
                            <select
                              value={currentSeatType}
                              onChange={(e) => setCurrentSeatType(e.target.value)}
                              className="input"
                            >
                              <option value="table-2">Table for 2</option>
                              <option value="table-4">Table for 4</option>
                              <option value="table-6">Table for 6</option>
                              <option value="bar">Bar Seat</option>
                              <option value="counter">Counter</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Seat Number</label>
                            <input
                              type="text"
                              value={currentSeatNumber}
                              onChange={(e) => setCurrentSeatNumber(e.target.value)}
                              className="input w-20"
                              placeholder="A1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addSeatToLayout}
                            className="btn-primary mt-6"
                          >
                            Add Seat
                          </button>
                        </div>
                        <div className="text-sm text-secondary-600">
                          Total Seats: {newRestaurant.seats.length}
                        </div>
                      </div>
                      
                      {/* Seat List */}
                      {newRestaurant.seats.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-secondary-700 mb-2">Added Seats:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {newRestaurant.seats.map((seat, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-secondary-50 rounded border"
                              >
                                <span className="text-sm">
                                  {seat.seatNumber} ({seat.seatType})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeSeatFromLayout(index)}
                                  className="text-error-600 hover:text-error-800 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-secondary-200">
                    <button
                      type="button"
                      onClick={() => setShowAddRestaurantModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && <div className="loading-spinner w-4 h-4"></div>}
                      <span>{loading ? 'Creating...' : 'Create Restaurant'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOwnerDashboard; 