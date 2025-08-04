import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div className={`loading-spinner ${sizeClasses[size]}`}></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className={`font-medium text-secondary-900 ${textSizeClasses[size]}`}>
            {text}
          </h2>
          
          {/* Loading Dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 