
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
  const { user, isAdmin } = useAuth();

  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link
        to="/"
        className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
      >
        Inicio
      </Link>
      
      {user && (
        <>
          <Link
            to="/dashboard"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors">
              Árbol Genealógico
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/arbol-genealogico">Árbol Completo</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/arbol-genealogico-clasico">Árbol Clásico</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/lineas-familiares">Líneas Familiares</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/determinacion-herederos"
            className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
          >
            Determinación de Herederos
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors">
              Sienna
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/hallazgos">Hallazgos</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/calculo-filiacion">Cálculo por Filiación</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/documentos-probatorios">Documentos Probatorios</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        </>
      )}
    </div>
  );
};

export default NavigationMenu;
