
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
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [evaluationComplete, setEvaluationComplete] = useState(false);

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
    } else if (!hasAccess(location.pathname) && user) {
      path = '/';
    }

    // Update redirect path state only if needed
    setRedirectPath(path);
    setEvaluationComplete(true);
    
    console.log('ProtectedRoute evaluation:', { 
      path: location.pathname,
      redirectPath: path, 
      loading, 
      isAuthenticated: !!user,
      isAdmin,
      isApproved,
      requireAdmin,
      requireApproved
    });
    
  }, [user, loading, isAdmin, isApproved, hasAccess, location.pathname, requireAdmin, requireApproved]);

  // Don't render anything until the loading state is resolved and evaluation is complete
  if (loading) {
    return <LoadingScreen />;
  }

  // Wait until evaluation is complete before attempting to redirect
  if (!evaluationComplete) {
    return <LoadingScreen />;
  }

  // Perform redirect if needed
  if (redirectPath) {
    // Create a unique key to ensure React creates a new Navigate instance
    const redirectKey = `redirect-${redirectPath}-${Date.now()}`;
    return <Navigate to={redirectPath} state={{ from: location }} replace key={redirectKey} />;
  }

  // Render children or Outlet if authentication checks passed
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
