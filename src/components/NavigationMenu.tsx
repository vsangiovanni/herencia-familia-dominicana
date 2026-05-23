
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavigationMenu = () => {
  const { user, isAdmin, hasAccess } = useAuth();

  const can = (path: string) => isAdmin || hasAccess(path);

  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link
        to="/"
        className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
      >
            Dashboard
      </Link>
      
      {user && (
        <>
          <Link
            to="/dashboard"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
          
          {(can('/arbol-genealogico') || can('/arbol-genealogico-clasico') || can('/lineas-familiares')) && (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors">
              Árbol Genealógico
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {can('/arbol-genealogico') && (
              <DropdownMenuItem asChild>
                <Link to="/arbol-genealogico">Árbol Completo</Link>
              </DropdownMenuItem>
              )}
              {can('/arbol-genealogico-clasico') && (
              <DropdownMenuItem asChild>
                <Link to="/arbol-genealogico-clasico">Árbol Clásico</Link>
              </DropdownMenuItem>
              )}
              {can('/lineas-familiares') && (
              <DropdownMenuItem asChild>
                <Link to="/lineas-familiares">Líneas Familiares</Link>
              </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          {can('/determinacion-herederos') && (
          <Link
            to="/determinacion-herederos"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Determinación de Herederos
          </Link>
          )}

          {(can('/hallazgos') ||
            can('/calculo-filiacion') ||
            can('/documentos-probatorios') ||
            can('/sienna/arbol-genealogico') ||
            can('/sienna/dobles-linajes') ||
            can('/sienna/miembros-arbol') ||
            can('/sienna/explicacion-herederos')) && (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors">
              Sienna
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {can('/hallazgos') && (
              <DropdownMenuItem asChild>
                <Link to="/hallazgos">Hallazgos</Link>
              </DropdownMenuItem>
              )}
              {can('/calculo-filiacion') && (
              <DropdownMenuItem asChild>
                <Link to="/calculo-filiacion">Cálculo por Filiación</Link>
              </DropdownMenuItem>
              )}
              {can('/documentos-probatorios') && (
              <DropdownMenuItem asChild>
                <Link to="/documentos-probatorios">Documentos Probatorios</Link>
              </DropdownMenuItem>
              )}
              {can('/sienna/arbol-genealogico') && (
              <DropdownMenuItem asChild>
                <Link to="/sienna/arbol-genealogico">Árbol Sienna</Link>
              </DropdownMenuItem>
              )}
              {can('/sienna/dobles-linajes') && (
              <DropdownMenuItem asChild>
                <Link to="/sienna/dobles-linajes">Dobles Linajes</Link>
              </DropdownMenuItem>
              )}
              {can('/sienna/miembros-arbol') && (
              <DropdownMenuItem asChild>
                <Link to="/sienna/miembros-arbol">Miembros del Árbol</Link>
              </DropdownMenuItem>
              )}
              {can('/sienna/explicacion-herederos') && (
              <DropdownMenuItem asChild>
                <Link to="/sienna/explicacion-herederos">Explicación Herederos</Link>
              </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </>
      )}
      
      {isAdmin && (
        <>
          <Link
            to="/calculo-herencias"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Cálculo de Herencias
          </Link>
          <Link
            to="/admin-users"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Admin Usuarios
          </Link>
          <Link
            to="/admin/settings"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Settings
          </Link>
        </>
      )}
    </div>
  );
};

export default NavigationMenu;
