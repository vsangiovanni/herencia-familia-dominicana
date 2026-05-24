
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavigationMenu = () => {
  const { user, isAdmin, hasAccess } = useAuth();

  const can = (path: string) => isAdmin || hasAccess(path);

  return (
    <div className="hidden items-center gap-1 md:flex">
      
      {user && (
        <>
          <Link
            to="/sienna"
            className="rounded-md bg-legal-blue px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-legal-blue/90"
          >
            Sienna
          </Link>

          {can('/sienna/arbol') && (
          <Link
            to="/sienna/arbol"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
          >
            Árbol
          </Link>
          )}

          {can('/sienna/hallazgos') && (
          <Link
            to="/sienna/hallazgos"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
          >
            Hallazgos
          </Link>
          )}

          {can('/sienna/linajes') && (
          <Link
            to="/sienna/linajes"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
          >
            Linajes
          </Link>
          )}

          {(can('/sienna/documentos') || can('/sienna/miembros') || can('/sienna/explicacion') || can('/sienna/filiacion')) && (
          <>
            {can('/sienna/documentos') && (
            <Link
              to="/sienna/documentos"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
            >
              Documentos
            </Link>
            )}
            {can('/sienna/miembros') && (
            <Link
              to="/sienna/miembros"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
            >
              Miembros
            </Link>
            )}
            {can('/sienna/explicacion') && (
            <Link
              to="/sienna/explicacion"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
            >
              Explicación
            </Link>
            )}
            {can('/sienna/filiacion') && (
            <Link
              to="/sienna/filiacion"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue"
            >
              Filiación
            </Link>
            )}
          </>
          )}

          {can('/caso/determinacion-herederos') && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-legal-beige/70 hover:text-legal-blue">
              Caso
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/caso/determinacion-herederos">Determinación de herederos</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          {(can('/legacy/arbol-genealogico') || can('/legacy/arbol-clasico') || can('/legacy/lineas-familiares')) && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-legal-blue">
              Legacy
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Herramientas anteriores</DropdownMenuLabel>
              {can('/legacy/arbol-genealogico') && (
              <DropdownMenuItem asChild>
                <Link to="/legacy/arbol-genealogico">Árbol completo legacy</Link>
              </DropdownMenuItem>
              )}
              {can('/legacy/arbol-clasico') && (
              <DropdownMenuItem asChild>
                <Link to="/legacy/arbol-clasico">Árbol clásico legacy</Link>
              </DropdownMenuItem>
              )}
              {can('/legacy/lineas-familiares') && (
              <DropdownMenuItem asChild>
                <Link to="/legacy/lineas-familiares">Líneas familiares legacy</Link>
              </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </>
      )}
      
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-legal-blue">
            Admin
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Administración</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/usuarios">Usuarios</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/calculo-herencias">Cálculo técnico</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default NavigationMenu;
