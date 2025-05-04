
import React from 'react';
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
  
  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Redirigir a login si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar requisitos de administrador
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Verificar requisitos de aprobación
  if (requireApproved && !isApproved) {
    return <Navigate to="/perfil" state={{ from: location }} replace />;
  }
  
  // Verificar acceso a la ruta específica
  if (!hasAccess(location.pathname)) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
