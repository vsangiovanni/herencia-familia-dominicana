
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
  '/sienna': 'Centro Sienna',
  '/arbol-genealogico': 'Árbol Genealógico',
  '/arbol-genealogico-clasico': 'Árbol Genealógico Clásico',
  '/lineas-familiares': 'Líneas Familiares',
  '/determinacion-herederos': 'Determinación de Herederos',
  '/caso/determinacion-herederos': 'Caso - Determinación de Herederos',
  '/calculo-herencias': 'Cálculo de Herencias',
  '/calculo-filiacion': 'Cálculo por Filiación',
  '/hallazgos': 'Hallazgos',
  '/documentos-probatorios': 'Documentos Probatorios',
  '/sienna/arbol': 'Árbol Sienna',
  '/sienna/arbol-genealogico': 'Árbol Sienna',
  '/sienna/hallazgos': 'Hallazgos Sienna',
  '/sienna/linajes': 'Linajes Sienna',
  '/sienna/dobles-linajes': 'Análisis de Dobles Linajes',
  '/sienna/miembros': 'Miembros Árbol Sienna',
  '/sienna/miembros-arbol': 'Miembros Árbol Sienna',
  '/sienna/documentos': 'Documentos Sienna',
  '/sienna/explicacion': 'Explicación Sienna para Herederos',
  '/sienna/explicacion-herederos': 'Explicación Sienna para Herederos',
  '/sienna/filiacion': 'Filiación Sienna',
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
