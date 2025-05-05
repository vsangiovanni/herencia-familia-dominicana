
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
  const [shouldRedirect, setShouldRedirect] = useState<{
    redirect: boolean;
    to: string;
  }>({ redirect: false, to: '' });
  
  // Set up the redirect logic in an effect to prevent excessive redirects
  useEffect(() => {
    let redirectPath = '';
    
    if (loading) {
      // Don't redirect while loading
      return;
    }
    
    if (!user) {
      redirectPath = '/auth';
    } else if (requireAdmin && !isAdmin) {
      redirectPath = '/';
    } else if (requireApproved && !isApproved && user) {
      redirectPath = '/perfil';
    } else if (!hasAccess(location.pathname) && user) {
      redirectPath = '/';
    }
    
    // Only update redirect state if there's a change
    if (redirectPath && (!shouldRedirect.redirect || shouldRedirect.to !== redirectPath)) {
      setShouldRedirect({ redirect: true, to: redirectPath });
    } else if (!redirectPath && shouldRedirect.redirect) {
      setShouldRedirect({ redirect: false, to: '' });
    }
    
  }, [user, isAdmin, isApproved, location.pathname, requireAdmin, requireApproved, hasAccess, shouldRedirect, loading]);

  // Render loading screen outside of the effect
  if (loading) {
    return <LoadingScreen />;
  }

  // Handle redirect outside of the effect but after all hooks
  if (shouldRedirect.redirect) {
    return <Navigate to={shouldRedirect.to} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
