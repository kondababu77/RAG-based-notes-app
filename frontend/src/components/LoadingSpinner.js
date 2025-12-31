import React from 'react';

function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`} />
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-secondary-500 text-sm">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-secondary-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce animation-delay-150" />
      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce animation-delay-300" />
    </div>
  );
}

export default LoadingSpinner;
