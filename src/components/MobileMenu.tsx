
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const MobileMenu = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center md:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
        >
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email} />
              <AvatarFallback>
                {userProfile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/calculo-herencias')}>
                Cálculo de Herencias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin-users')}>
                Admin Usuarios
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileMenu;
