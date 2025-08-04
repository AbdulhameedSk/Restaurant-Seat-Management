import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, LogIn, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect based on user role after successful login
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
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful! Welcome back!');
      // Navigation handled by useEffect after user state updates
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Restaurant Management</h1>
          <p className="text-secondary-600 text-lg">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="card-elevated p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your password"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
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
                <span className="px-4 bg-white text-secondary-500">New to the platform?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="card p-4 text-center">
          <h3 className="font-semibold text-secondary-800 mb-3">Demo Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
              <p className="font-semibold text-secondary-700">Admin</p>
              <p className="text-secondary-600">admin@restaurant.com</p>
              <p className="text-secondary-600">admin123</p>
            </div>
            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
              <p className="font-semibold text-secondary-700">SubAdmin</p>
              <p className="text-secondary-600">subadmin@restaurant.com</p>
              <p className="text-secondary-600">subadmin123</p>
            </div>
            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
              <p className="font-semibold text-secondary-700">User</p>
              <p className="text-secondary-600">user@restaurant.com</p>
              <p className="text-secondary-600">user123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-secondary-500 text-sm">
            Secure restaurant management and booking platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 