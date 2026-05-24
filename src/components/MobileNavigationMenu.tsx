
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, User } from "lucide-react";

const MobileNavigationMenu = () => {
  const { user, isAdmin, hasAccess, signOut } = useAuth();
  const navigate = useNavigate();

  const can = (path: string) => isAdmin || hasAccess(path);

  if (!user) {
    return (
      <div className="flex items-center md:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:text-legal-blue dark:text-foreground"
        >
          <User size={18} className="mr-2" />
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  const showSienna =
    can('/sienna/arbol') ||
    can('/sienna/hallazgos') ||
    can('/sienna/linajes') ||
    can('/sienna/documentos') ||
    can('/sienna/miembros') ||
    can('/sienna/explicacion') ||
    can('/sienna/filiacion') ||
    can('/sienna/asistente');
  const showLegacy =
    can('/legacy/arbol-genealogico') ||
    can('/legacy/arbol-clasico') ||
    can('/legacy/lineas-familiares');

  return (
    <div className="flex items-center md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[calc(100vh-5rem)] w-64 overflow-y-auto overscroll-contain" align="end" forceMount>
          <DropdownMenuLabel>Navegación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/sienna')}>
            Caso Alessandro
          </DropdownMenuItem>
          {showSienna && (
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-legal-gray">
              Legado
            </DropdownMenuLabel>
          )}
          {can('/sienna/arbol') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/arbol')}>
              Árbol
            </DropdownMenuItem>
          )}
          {can('/sienna/hallazgos') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/hallazgos')}>
              Hallazgos
            </DropdownMenuItem>
          )}
          {can('/sienna/linajes') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/linajes')}>
              Linajes
            </DropdownMenuItem>
          )}
          {can('/sienna/documentos') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/documentos')}>
              Documentos
            </DropdownMenuItem>
          )}
          {can('/sienna/miembros') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/miembros')}>
              Miembros
            </DropdownMenuItem>
          )}
          {can('/sienna/explicacion') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/explicacion')}>
              Explicación herederos
            </DropdownMenuItem>
          )}
          {can('/sienna/filiacion') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/filiacion')}>
              Filiación
            </DropdownMenuItem>
          )}
          {can('/sienna/asistente') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/asistente')}>
              Sienna
            </DropdownMenuItem>
          )}
          {can('/caso/determinacion-herederos') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-legal-gray">
                Caso
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/caso/determinacion-herederos')}>
                Determinación de herederos
              </DropdownMenuItem>
            </>
          )}
          {showLegacy && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-legal-gray">
                Legacy
              </DropdownMenuLabel>
            </>
          )}
          {can('/legacy/arbol-genealogico') && (
            <DropdownMenuItem onClick={() => navigate('/legacy/arbol-genealogico')}>
              Árbol completo legacy
            </DropdownMenuItem>
          )}
          {can('/legacy/arbol-clasico') && (
            <DropdownMenuItem onClick={() => navigate('/legacy/arbol-clasico')}>
              Árbol clásico legacy
            </DropdownMenuItem>
          )}
          {can('/legacy/lineas-familiares') && (
            <DropdownMenuItem onClick={() => navigate('/legacy/lineas-familiares')}>
              Líneas familiares legacy
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-legal-gray">
                Admin
              </DropdownMenuLabel>
              {can('/admin/calculo-herencias') && (
                <DropdownMenuItem onClick={() => navigate('/admin/calculo-herencias')}>
                  Cálculo técnico
                </DropdownMenuItem>
              )}
              {can('/admin/usuarios') && (
                <DropdownMenuItem onClick={() => navigate('/admin/usuarios')}>
                  Usuarios
                </DropdownMenuItem>
              )}
              {can('/admin/settings') && (
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                  Configuración
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/perfil')}>
            Mi Perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileNavigationMenu;
