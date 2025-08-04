import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Users, 
  Phone,
  Mail,
  Utensils,
  Wifi,
  Car,
  Music,
  LogOut,
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Building2
} from 'lucide-react';
import axios from 'axios';
import { Restaurant, Booking, Seat } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

interface SeatAvailability {
  _id: string;
  seatNumber: string;
  seatType: string;
  position: { x: number; y: number };
  isAvailable: boolean;
  capacity: number;
}

interface NextAvailableTime {
  date: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
}

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    bookingDate: '',
    bookingTime: '',
    partySize: 1,
    selectedSeat: '',
    specialRequests: '',
    contactPhone: user?.phone || ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  
  // Seat availability states
  const [seatAvailability, setSeatAvailability] = useState<SeatAvailability[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [nextAvailableTimes, setNextAvailableTimes] = useState<NextAvailableTime[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [restaurantsRes, bookingsRes] = await Promise.all([
        axios.get('/api/restaurant'),
        axios.get('/api/booking/my-bookings')
      ]);

      if (restaurantsRes.data.success) {
        setRestaurants(restaurantsRes.data.restaurants || []);
      }

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkSeatAvailability = async () => {
    if (!selectedRestaurant || !bookingForm.bookingDate || !bookingForm.bookingTime) {
      return;
    }

    try {
      setCheckingAvailability(true);
      const response = await axios.get(
        `/api/restaurant/${selectedRestaurant._id}/seat-availability?date=${bookingForm.bookingDate}&time=${bookingForm.bookingTime}`
      );

      if (response.data.success) {
        setSeatAvailability(response.data.seatAvailability);
        setAvailableTimeSlots(response.data.timeSlots);
        setNextAvailableTimes(response.data.nextAvailableTimes);
        
        // Reset selected seat if it's no longer available
        const selectedSeatAvailable = response.data.seatAvailability.find(
          (seat: SeatAvailability) => seat.seatNumber === bookingForm.selectedSeat && seat.isAvailable
        );
        
        if (!selectedSeatAvailable && bookingForm.selectedSeat) {
          setBookingForm(prev => ({ ...prev, selectedSeat: '' }));
          toast.error('Selected seat is no longer available. Please choose another seat.');
        }
      }
    } catch (error: any) {
      console.error('Error checking availability:', error);
      toast.error(error.response?.data?.message || 'Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Check availability when date or time changes
  useEffect(() => {
    if (selectedRestaurant && bookingForm.bookingDate && bookingForm.bookingTime) {
      checkSeatAvailability();
    }
  }, [selectedRestaurant, bookingForm.bookingDate, bookingForm.bookingTime]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant || !bookingForm.selectedSeat) {
      toast.error('Please select a seat');
      return;
    }

    try {
      setLoading(true);
      const selectedSeatInfo = seatAvailability.find(seat => seat.seatNumber === bookingForm.selectedSeat);
      
      const bookingData = {
        restaurant: selectedRestaurant._id,
        seatNumber: bookingForm.selectedSeat,
        seatType: selectedSeatInfo?.seatType || 'table-2',
        partySize: bookingForm.partySize,
        bookingDate: bookingForm.bookingDate,
        bookingTime: bookingForm.bookingTime,
        specialRequests: bookingForm.specialRequests,
        contactPhone: bookingForm.contactPhone
      };

      const response = await axios.post('/api/booking', bookingData);

      if (response.data.success) {
        toast.success('Booking created successfully!');
        setShowBookingModal(false);
        setSelectedRestaurant(null);
        setBookingForm({
          bookingDate: '',
          bookingTime: '',
          partySize: 1,
          selectedSeat: '',
          specialRequests: '',
          contactPhone: user?.phone || ''
        });
        setSeatAvailability([]);
        setNextAvailableTimes([]);
        fetchDashboardData();
        setActiveTab('bookings');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const selectNextAvailableTime = (nextTime: NextAvailableTime) => {
    setBookingForm(prev => ({
      ...prev,
      bookingDate: nextTime.date,
      bookingTime: nextTime.time
    }));
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCuisine = cuisineFilter === 'all' || restaurant.cuisine.includes(cuisineFilter);
    const matchesPrice = priceFilter === 'all' || restaurant.priceRange === priceFilter;
    return matchesSearch && matchesCuisine && matchesPrice;
  });

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi': return <Wifi className="h-4 w-4 text-primary-600" />;
      case 'parking': return <Car className="h-4 w-4 text-primary-600" />;
      case 'live-music': return <Music className="h-4 w-4 text-primary-600" />;
      default: return <Utensils className="h-4 w-4 text-primary-600" />;
    }
  };

  const getSeatTypeLabel = (seatType: string) => {
    switch (seatType) {
      case 'table-2': return 'Table for 2';
      case 'table-4': return 'Table for 4';
      case 'table-6': return 'Table for 6';
      case 'bar': return 'Bar Seat';
      case 'counter': return 'Counter Seat';
      default: return seatType;
    }
  };

  const getPriceRangeDisplay = (priceRange: string) => {
    switch (priceRange) {
      case 'budget': return '$';
      case 'moderate': return '$$';
      case 'expensive': return '$$$';
      case 'luxury': return '$$$$';
      default: return '$';
    }
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
                <h1 className="text-xl font-bold text-secondary-900">Restaurant Booking</h1>
                <p className="text-sm text-secondary-600">Welcome back, {user?.name}!</p>
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'browse', label: 'Browse Restaurants', icon: Search },
              { key: 'bookings', label: 'My Bookings', icon: Calendar }
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
        {activeTab === 'browse' && (
          <div>
            {/* Search and Filters */}
            <div className="card p-6 mb-8">
              <div className="flex items-center mb-4">
                <Search className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-subheading">Discover Great Restaurants</h2>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search restaurants or cuisine..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={cuisineFilter}
                    onChange={(e) => setCuisineFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Cuisines</option>
                    <option value="Italian">Italian</option>
                    <option value="Indian">Indian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Mexican">Mexican</option>
                  </select>
                  
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Prices</option>
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                    <option value="expensive">Expensive</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant._id} className="card group">
                  {/* Restaurant Image */}
                  <div className="relative overflow-hidden">
                    {restaurant.images && restaurant.images.length > 0 ? (
                      <img
                        src={`http://localhost:5000${restaurant.images[0].url}`}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-secondary-100 flex items-center justify-center">
                        <Utensils className="h-12 w-12 text-secondary-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full shadow-sm">
                      <span className="text-sm font-medium text-secondary-700">
                        {getPriceRangeDisplay(restaurant.priceRange)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-secondary-900">{restaurant.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-warning-400 fill-current" />
                        <span className="text-sm text-secondary-600">{restaurant.rating?.average || 0}</span>
                      </div>
                    </div>
                    
                    <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{restaurant.description}</p>
                    
                    <div className="flex items-center text-sm text-secondary-500 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{restaurant.address?.city || 'Location not specified'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap gap-2">
                        {restaurant.cuisine?.slice(0, 2).map((cuisine, index) => (
                          <span key={index} className="badge-secondary">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Amenities */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {restaurant.amenities?.slice(0, 4).map((amenity, index) => (
                          <div key={index} className="p-2 bg-secondary-50 rounded-lg" title={amenity}>
                            {getAmenityIcon(amenity)}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-secondary-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{restaurant.seats?.length || 0} seats</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowBookingModal(true);
                      }}
                      className="btn-primary w-full"
                    >
                      Book Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredRestaurants.length === 0 && (
              <div className="text-center py-16">
                <Utensils className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-700 mb-2">No restaurants found</h3>
                <p className="text-secondary-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="card p-8">
              <div className="flex items-center mb-6">
                <Calendar className="h-8 w-8 text-primary-600 mr-3" />
                <h2 className="text-heading">My Bookings</h2>
              </div>
              
              {bookings.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">No bookings yet</h3>
                  <p className="text-secondary-500">Start by browsing restaurants and making your first booking</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="bg-secondary-50 border border-secondary-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <h3 className="text-lg font-semibold text-secondary-900">
                              {typeof booking.restaurant === 'object' ? booking.restaurant.name : 'Restaurant'}
                            </h3>
                            <span className={`badge-${
                              booking.status === 'confirmed' ? 'success' :
                              booking.status === 'arrived' ? 'info' :
                              booking.status === 'completed' ? 'secondary' :
                              booking.status === 'cancelled' ? 'error' :
                              'warning'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-secondary-500" />
                              <span className="text-secondary-700">{new Date(booking.bookingDate).toLocaleDateString()}</span>
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
                            <div className="mt-4 p-3 bg-white border border-secondary-200 rounded-lg">
                              <p className="text-sm text-secondary-700">
                                <strong>Special Requests:</strong> {booking.specialRequests}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity" onClick={() => setShowBookingModal(false)}></div>
            
            <div className="inline-block align-bottom modal text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-subheading">Book Your Table</h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {selectedRestaurant.images && selectedRestaurant.images.length > 0 && (
                      <img
                        src={`http://localhost:5000${selectedRestaurant.images[0].url}`}
                        alt={selectedRestaurant.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-secondary-900">{selectedRestaurant.name}</h4>
                      <p className="text-sm text-secondary-600">{selectedRestaurant.description}</p>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 text-secondary-500 mr-1" />
                        <span className="text-sm text-secondary-600">{selectedRestaurant.address?.city}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingForm.bookingDate}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, bookingDate: e.target.value }))}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Time</label>
                      <select
                        required
                        value={bookingForm.bookingTime}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, bookingTime: e.target.value }))}
                        className="input"
                        disabled={!bookingForm.bookingDate}
                      >
                        <option value="">Select time</option>
                        {availableTimeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {!bookingForm.bookingDate && (
                        <p className="text-xs text-secondary-500 mt-1">Select a date first</p>
                      )}
                    </div>
                  </div>

                  {/* Party Size */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Party Size</label>
                    <select
                      value={bookingForm.partySize}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                      className="input"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                        <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Seat Selection */}
                  {bookingForm.bookingDate && bookingForm.bookingTime && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Select Seat
                        {checkingAvailability && (
                          <span className="ml-2 text-xs text-primary-600">Checking availability...</span>
                        )}
                      </label>
                      <select
                        required
                        value={bookingForm.selectedSeat}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, selectedSeat: e.target.value }))}
                        className="input"
                        disabled={checkingAvailability}
                      >
                        <option value="">Choose a seat</option>
                        {seatAvailability
                          .filter(seat => seat.isAvailable)
                          .map(seat => (
                            <option key={seat._id} value={seat.seatNumber}>
                              {seat.seatNumber} - {getSeatTypeLabel(seat.seatType)} (Capacity: {seat.capacity})
                            </option>
                          ))}
                      </select>
                      
                      {/* Availability Status */}
                      {seatAvailability.length > 0 && (
                        <div className="mt-3 p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary-600">
                              Available seats: {seatAvailability.filter(s => s.isAvailable).length} / {seatAvailability.length}
                            </span>
                            {seatAvailability.filter(s => s.isAvailable).length > 0 ? (
                              <div className="flex items-center text-success-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>Seats available</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-error-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>No seats available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Next Available Times */}
                      {nextAvailableTimes.length > 0 && seatAvailability.filter(s => s.isAvailable).length === 0 && (
                        <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                          <h5 className="font-medium text-warning-800 mb-3 flex items-center">
                            <Clock className="h-5 w-5 mr-2" />
                            Next Available Times
                          </h5>
                          <div className="space-y-2">
                            {nextAvailableTimes.slice(0, 3).map((nextTime, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectNextAvailableTime(nextTime)}
                                className="flex items-center justify-between w-full p-3 bg-white border border-warning-300 rounded-lg text-sm hover:bg-warning-50 transition-colors group"
                              >
                                <span className="font-medium text-secondary-700">
                                  {new Date(nextTime.date).toLocaleDateString()} at {nextTime.time}
                                </span>
                                <div className="flex items-center text-warning-700">
                                  <span className="mr-2">{nextTime.availableSeats} seats</span>
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.contactPhone}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="input"
                      placeholder="Your phone number"
                    />
                  </div>
                  
                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Special Requests (Optional)</label>
                    <textarea
                      rows={3}
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      className="input"
                      placeholder="Any special requirements or preferences..."
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-secondary-200">
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !bookingForm.selectedSeat || checkingAvailability}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading && <div className="loading-spinner w-4 h-4"></div>}
                      <span>{loading ? 'Booking...' : 'Confirm Booking'}</span>
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

export default UserDashboard; 