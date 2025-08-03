import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      admin: '/admin',
      subadmin: '/subadmin',
      user: '/dashboard'
    };
    
    return <Navigate to={roleRedirects[user.role as keyof typeof roleRedirects] || '/dashboard'} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute; 