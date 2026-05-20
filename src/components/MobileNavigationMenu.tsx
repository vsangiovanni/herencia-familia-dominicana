
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
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

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
          <DropdownMenuItem onClick={() => navigate('/arbol-genealogico')}>
            Árbol Completo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/arbol-genealogico-clasico')}>
            Árbol Clásico
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/lineas-familiares')}>
            Líneas Familiares
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/determinacion-herederos')}>
            Determinación de Herederos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-legal-gray">
            Sienna
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigate('/hallazgos')}>
            Hallazgos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/calculo-filiacion')}>
            Cálculo por Filiación
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/documentos-probatorios')}>
            Documentos Probatorios
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/sienna/arbol-genealogico')}>
            Árbol Sienna
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/sienna/miembros-arbol')}>
            Miembros del Árbol
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/sienna/explicacion-herederos')}>
            Explicación Herederos
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/calculo-herencias')}>
                Cálculo de Herencias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin-users')}>
                Admin Usuarios
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                Settings
              </DropdownMenuItem>
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
