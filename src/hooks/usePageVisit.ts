
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface PageConfig {
  [path: string]: string;
}

const pageNames: PageConfig = {
  '/': 'Página de Inicio',
  '/dashboard': 'Dashboard',
  '/arbol-genealogico': 'Árbol Genealógico',
  '/arbol-genealogico-clasico': 'Árbol Genealógico Clásico',
  '/lineas-familiares': 'Líneas Familiares',
  '/determinacion-herederos': 'Determinación de Herederos',
  '/sienna/explicacion-herederos': 'Explicación Sienna para Herederos',
  '/perfil': 'Perfil de Usuario',
  '/admin/usuarios': 'Administración de Usuarios',
  '/auth': 'Autenticación'
};

export const usePageVisit = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const registerPageVisit = async () => {
      if (!user) return;

      try {
        const pageName = pageNames[location.pathname] || 'Página Desconocida';
        
        await api.recordPageVisit({
          page_path: location.pathname,
          page_name: pageName,
          user_agent: navigator.userAgent
        });

        console.log('Visita de página registrada:', location.pathname);
      } catch (error) {
        console.error('Error registrando visita de página:', error);
      }
    };

    registerPageVisit();
  }, [location.pathname, user]);
};
