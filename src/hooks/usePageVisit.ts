
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
  '/calculo-herencias': 'Cálculo de Herencias',
  '/calculo-filiacion': 'Cálculo por Filiación',
  '/hallazgos': 'Hallazgos',
  '/documentos-probatorios': 'Documentos Probatorios',
  '/sienna/arbol-genealogico': 'Árbol Sienna',
  '/sienna/dobles-linajes': 'Análisis de Dobles Linajes',
  '/sienna/miembros-arbol': 'Miembros Árbol Sienna',
  '/sienna/explicacion-herederos': 'Explicación Sienna para Herederos',
  '/perfil': 'Perfil de Usuario',
  '/admin-users': 'Panel Administrativo',
  '/legal': 'Información Legal',
  '/auth': 'Autenticación'
};

export const usePageVisit = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const registerPageVisit = async () => {
      if (!user) return;

      try {
        const pageName = pageNames[location.pathname] || location.pathname;
        
        await api.recordPageVisit({
          page_path: location.pathname,
          page_name: pageName,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        // Evita ruido de consola en producción; no interrumpe la UX.
      }
    };

    registerPageVisit();
  }, [location.pathname, user]);
};
