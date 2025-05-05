
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireApproved?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requireAdmin = false, 
  requireApproved = true,
  children 
}) => {
  const { user, loading, isAdmin, isApproved } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(true);
  
  // Use a single useEffect to determine redirection
  useEffect(() => {
    // Skip logic during loading
    if (loading) {
      return;
    }
    
    let path: string | null = null;
    
    // Check authentication criteria
    if (!user) {
      path = '/auth';
    } else if (requireAdmin && !isAdmin) {
      path = '/';
    } else if (requireApproved && !isApproved && user) {
      path = '/perfil';
    }
    
    setRedirectPath(path);
    setEvaluating(false);
    
  }, [user, loading, isAdmin, isApproved, requireAdmin, requireApproved]);

  // Don't render anything until the loading state is resolved
  if (loading || evaluating) {
    return <LoadingScreen />;
  }

  // Perform redirect if needed
  if (redirectPath) {
    // Create a unique key to ensure React creates a new Navigate instance
    const redirectKey = `redirect-${redirectPath}-${Date.now()}`;
    return <Navigate to={redirectPath} replace key={redirectKey} />;
  }

  // Render children or Outlet if authentication checks passed
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
