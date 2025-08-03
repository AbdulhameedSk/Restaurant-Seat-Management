import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Calendar, 
  MapPin, 
  User, 
  LogOut, 
  Search,
  Star,
  Clock,
  Users,
  Phone
} from 'lucide-react';
import axios from 'axios';
import { Restaurant, Booking } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRestaurants();
    fetchBookings();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('/api/restaurant');
      if (response.data.success) {
        setRestaurants(response.data.restaurants || []);
      }
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/booking/my-bookings');
      if (response.data.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/dashboard/restaurant/${restaurantId}`);
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
    restaurant.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleRestaurantClick(restaurant._id)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{restaurant.description}</p>
          </div>
          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-yellow-700">
              {restaurant.rating.average.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{restaurant.address.city}, {restaurant.address.state}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{restaurant.totalSeats} seats</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.cuisine.slice(0, 3).map((cuisine, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
            >
              {cuisine}
            </span>
          ))}
          <span className={`px-2 py-1 text-xs rounded-full ${
            restaurant.priceRange === 'budget' ? 'bg-green-50 text-green-700' :
            restaurant.priceRange === 'mid-range' ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>
            {restaurant.priceRange}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{restaurant.phone}</span>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.restaurant.name}</h3>
          <p className="text-sm text-gray-600">Booking ID: {booking.bookingId}</p>
        </div>
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

      <div className="grid grid-cols-2 gap-4 text-sm">
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

      {booking.specialRequests && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Special Requests:</p>
          <p className="text-sm font-medium">{booking.specialRequests}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
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
              <h1 className="text-xl font-semibold text-gray-900">Restaurant Portal</h1>
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
              onClick={() => setActiveTab('restaurants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'restaurants'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Browse Restaurants</span>
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
                <span>My Bookings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'restaurants' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search restaurants, cuisine, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Restaurants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
            </div>

            {filteredRestaurants.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
                <p className="text-gray-600">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>

            {bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600">Start by browsing restaurants and making your first booking.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{user?.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="text-gray-900 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 