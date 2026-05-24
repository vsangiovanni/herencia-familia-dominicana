
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface PageConfig {
  [path: string]: string;
}

const pageNames: PageConfig = {
  '/': 'Página de Inicio',
  '/dashboard': 'Portada del caso Alessandro',
  '/sienna': 'Caso Alessandro',
  '/arbol-genealogico': 'Árbol Genealógico',
  '/arbol-genealogico-clasico': 'Árbol Genealógico Clásico',
  '/lineas-familiares': 'Líneas Familiares',
  '/determinacion-herederos': 'Determinación de Herederos',
  '/caso/determinacion-herederos': 'Caso - Determinación de Herederos',
  '/calculo-herencias': 'Cálculo de Herencias',
  '/calculo-filiacion': 'Cálculo por Filiación',
  '/hallazgos': 'Hallazgos',
  '/documentos-probatorios': 'Documentos Probatorios',
  '/sienna/arbol': 'Árbol del caso Alessandro',
  '/sienna/arbol-genealogico': 'Árbol del caso Alessandro',
  '/sienna/hallazgos': 'Hallazgos del caso Alessandro',
  '/sienna/linajes': 'Linajes del caso Alessandro',
  '/sienna/dobles-linajes': 'Análisis de Dobles Linajes',
  '/sienna/miembros': 'Miembros del caso Alessandro',
  '/sienna/miembros-arbol': 'Miembros del caso Alessandro',
  '/sienna/documentos': 'Documentos del caso Alessandro',
  '/sienna/explicacion': 'Explicación para Herederos',
  '/sienna/explicacion-herederos': 'Explicación para Herederos',
  '/sienna/filiacion': 'Filiación del caso Alessandro',
  '/legacy/arbol-genealogico': 'Legacy - Árbol Genealógico',
  '/legacy/arbol-clasico': 'Legacy - Árbol Clásico',
  '/legacy/lineas-familiares': 'Legacy - Líneas Familiares',
  '/legacy/calculo-filiacion': 'Legacy - Cálculo por Filiación',
  '/perfil': 'Perfil de Usuario',
  '/admin-users': 'Panel Administrativo',
  '/admin/usuarios': 'Panel Administrativo',
  '/admin/calculo-herencias': 'Admin - Cálculo Técnico',
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
