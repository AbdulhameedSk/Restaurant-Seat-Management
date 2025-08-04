import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Phone, LogIn, Building2, Users, Store } from 'lucide-react';
import toast from 'react-hot-toast';

type UserType = 'user' | 'restaurant';

const Register: React.FC = () => {
  const [userType, setUserType] = useState<UserType>('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { register, registerRestaurantOwner, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect based on user role after successful registration
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRedirects = {
        admin: '/admin',
        restaurant: '/restaurant',
        subadmin: '/subadmin',
        user: '/dashboard'
      };
      
      const redirectPath = roleRedirects[user.role as keyof typeof roleRedirects] || '/dashboard';
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      };

      if (userType === 'restaurant') {
        await registerRestaurantOwner(userData);
        toast.success('Restaurant owner registration successful! Welcome aboard!');
      } else {
        await register(userData);
        toast.success('Registration successful! Welcome aboard!');
      }
      
      // Navigation handled by useEffect after user state updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h1>
          <p className="text-secondary-600 text-lg">Join our restaurant platform</p>
        </div>

        {/* User Type Selection */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4 text-center">
            What type of account do you need?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType('user')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                userType === 'user'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Users className="h-8 w-8" />
                <h3 className="font-medium">Customer Account</h3>
                <p className="text-sm text-center">Book tables and make reservations</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setUserType('restaurant')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                userType === 'restaurant'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Store className="h-8 w-8" />
                <h3 className="font-medium">Restaurant Owner</h3>
                <p className="text-sm text-center">Manage your restaurant and bookings</p>
              </div>
            </button>
          </div>
        </div>

        {/* Register Form */}
        <div className="card-elevated p-8">
          <div className="mb-6 text-center">
            <p className="text-secondary-600">
              Creating {userType === 'restaurant' ? 'restaurant owner' : 'customer'} account
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                Phone Number {userType === 'restaurant' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required={userType === 'restaurant'}
                  value={formData.phone}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder={userType === 'restaurant' ? 'Enter your business phone number' : 'Enter your phone number (optional)'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner w-5 h-5"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>
                      Create {userType === 'restaurant' ? 'Restaurant Owner' : 'Customer'} Account
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">Already have an account?</span>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Ready to sign in?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-secondary-500 text-sm">
            By creating an account, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 