
import React, { useEffect, useRef } from 'react';
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
  const redirecting = useRef(false);
  
  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Prevent recursive redirects
  useEffect(() => {
    redirecting.current = false;
    return () => {
      redirecting.current = false;
    };
  }, [location.pathname]);
  
  // Redirigir a login si no hay usuario autenticado
  if (!user && !redirecting.current) {
    redirecting.current = true;
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar requisitos de administrador
  if (requireAdmin && !isAdmin && !redirecting.current) {
    redirecting.current = true;
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Verificar requisitos de aprobación
  if (requireApproved && !isApproved && !redirecting.current && user) {
    redirecting.current = true;
    return <Navigate to="/perfil" state={{ from: location }} replace />;
  }
  
  // Verificar acceso a la ruta específica
  if (!hasAccess(location.pathname) && !redirecting.current && user) {
    redirecting.current = true;
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
