
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
import { Menu, User } from "lucide-react";

const MobileNavigationMenu = () => {
  const { user, isAdmin, hasAccess } = useAuth();
  const navigate = useNavigate();

  const can = (path: string) => isAdmin || hasAccess(path);

  if (!user) {
    return (
      <div className="flex items-center md:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
        >
          <User size={18} className="mr-2" />
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  const showGenealogy =
    can('/arbol-genealogico') || can('/arbol-genealogico-clasico') || can('/lineas-familiares');
  const showSienna =
    can('/hallazgos') ||
    can('/calculo-filiacion') ||
    can('/documentos-probatorios') ||
    can('/sienna/arbol-genealogico') ||
    can('/sienna/dobles-linajes') ||
    can('/sienna/miembros-arbol') ||
    can('/sienna/explicacion-herederos');

  return (
    <div className="flex items-center md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>Navegación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/dashboard')}>
            Dashboard
          </DropdownMenuItem>
          {can('/arbol-genealogico') && (
            <DropdownMenuItem onClick={() => navigate('/arbol-genealogico')}>
              Árbol Completo
            </DropdownMenuItem>
          )}
          {can('/arbol-genealogico-clasico') && (
            <DropdownMenuItem onClick={() => navigate('/arbol-genealogico-clasico')}>
              Árbol Clásico
            </DropdownMenuItem>
          )}
          {can('/lineas-familiares') && (
            <DropdownMenuItem onClick={() => navigate('/lineas-familiares')}>
              Líneas Familiares
            </DropdownMenuItem>
          )}
          {can('/determinacion-herederos') && (
            <DropdownMenuItem onClick={() => navigate('/determinacion-herederos')}>
              Determinación de Herederos
            </DropdownMenuItem>
          )}
          {showGenealogy && showSienna && <DropdownMenuSeparator />}
          {showSienna && (
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-legal-gray">
              Sienna
            </DropdownMenuLabel>
          )}
          {can('/hallazgos') && (
            <DropdownMenuItem onClick={() => navigate('/hallazgos')}>
              Hallazgos
            </DropdownMenuItem>
          )}
          {can('/calculo-filiacion') && (
            <DropdownMenuItem onClick={() => navigate('/calculo-filiacion')}>
              Cálculo por Filiación
            </DropdownMenuItem>
          )}
          {can('/documentos-probatorios') && (
            <DropdownMenuItem onClick={() => navigate('/documentos-probatorios')}>
              Documentos Probatorios
            </DropdownMenuItem>
          )}
          {can('/sienna/arbol-genealogico') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/arbol-genealogico')}>
              Árbol Sienna
            </DropdownMenuItem>
          )}
          {can('/sienna/dobles-linajes') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/dobles-linajes')}>
              Dobles Linajes
            </DropdownMenuItem>
          )}
          {can('/sienna/miembros-arbol') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/miembros-arbol')}>
              Miembros del Árbol
            </DropdownMenuItem>
          )}
          {can('/sienna/explicacion-herederos') && (
            <DropdownMenuItem onClick={() => navigate('/sienna/explicacion-herederos')}>
              Explicación Herederos
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              {can('/calculo-herencias') && (
                <DropdownMenuItem onClick={() => navigate('/calculo-herencias')}>
                  Cálculo de Herencias
                </DropdownMenuItem>
              )}
              {can('/admin-users') && (
                <DropdownMenuItem onClick={() => navigate('/admin-users')}>
                  Admin Usuarios
                </DropdownMenuItem>
              )}
              {can('/admin/settings') && (
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                  Settings
                </DropdownMenuItem>
              )}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/perfil')}>
            Mi Perfil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileNavigationMenu;
