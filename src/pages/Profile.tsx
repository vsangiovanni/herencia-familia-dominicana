
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const { user, userProfile, isAdmin } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Mi Perfil</h1>
        
        <Card>
          <CardHeader className="text-center pb-6">
            <Avatar className="mx-auto h-20 w-20 md:h-24 md:w-24 mb-4">
              <AvatarImage 
                src={`https://avatar.vercel.sh/${user?.email}.png`} 
                alt={user?.email} 
              />
              <AvatarFallback className="text-lg md:text-2xl">
                {userProfile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg md:text-xl mb-2">
              {userProfile?.full_name || 'Usuario'}
            </CardTitle>
            <CardDescription className="text-sm md:text-base break-all px-2">
              {user?.email}
            </CardDescription>
            {isAdmin && (
              <Badge variant="secondary" className="mt-3 text-xs md:text-sm">
                Administrador
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-gray-500 block">
                  Email
                </label>
                <p className="text-sm md:text-base text-gray-900 break-all">
                  {user?.email}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-gray-500 block">
                  Nombre Completo
                </label>
                <p className="text-sm md:text-base text-gray-900">
                  {userProfile?.full_name || 'No especificado'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-gray-500 block">
                  Tipo de Usuario
                </label>
                <p className="text-sm md:text-base text-gray-900">
                  {isAdmin ? 'Administrador' : 'Usuario'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-gray-500 block">
                  Fecha de Registro
                </label>
                <p className="text-sm md:text-base text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
