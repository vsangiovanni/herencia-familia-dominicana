
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
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
  const { user, loading, isAdmin, isApproved, hasAccess } = useAuth();
  const location = useLocation();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Use a single useEffect with stable dependencies to determine redirection
  useEffect(() => {
    // Skip evaluation during loading to prevent early redirects
    if (loading) {
      return;
    }

    let newRedirectPath: string | null = null;

    // Check authentication criteria
    if (!user) {
      newRedirectPath = '/auth';
    } else if (requireAdmin && !isAdmin) {
      newRedirectPath = '/';
    } else if (requireApproved && !isApproved && user) {
      newRedirectPath = '/perfil';
    } else if (!hasAccess(location.pathname) && user) {
      newRedirectPath = '/';
    }

    // Only update state if the redirect path has changed
    setRedirectTo(newRedirectPath);
    
    // Clean log to verify the flow
    console.log('ProtectedRoute evaluation:', { 
      path: location.pathname,
      redirectTo: newRedirectPath, 
      loading, 
      isAuthenticated: !!user,
      isAdmin,
      isApproved,
      requireAdmin,
      requireApproved
    });
    
  }, [user, loading, isAdmin, isApproved, hasAccess, location.pathname, requireAdmin, requireApproved]);

  // Show loading screen if authentication is still being checked
  if (loading) {
    return <LoadingScreen />;
  }

  // Perform redirect if needed
  if (redirectTo) {
    // Adding a key prop with path ensures that React creates a new Navigate instance when the path changes
    return <Navigate to={redirectTo} state={{ from: location }} replace key={redirectTo} />;
  }

  // Render children or Outlet if authentication checks passed
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
