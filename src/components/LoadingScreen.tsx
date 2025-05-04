
import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-legal-blue mb-4"></div>
        <h2 className="text-xl font-serif font-bold text-legal-blue">Cargando...</h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
