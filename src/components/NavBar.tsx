
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';

const NavBar = () => {
  const { user, userProfile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Ocurrió un error al cerrar la sesión.",
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-legal-blue font-bold text-xl">
              HerenciaRD
            </Link>
          </div>
          
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
            
            {user ? (
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
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                    Cerrar Sesión
                    <LogOut className="ml-auto h-4 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/auth"
                className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden">
            {user ? (
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
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/arbol-genealogico')}>
                    Árbol Genealógico
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                    Cerrar Sesión
                    <LogOut className="ml-auto h-4 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/auth"
                className="text-gray-900 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
