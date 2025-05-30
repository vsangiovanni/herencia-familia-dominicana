
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>
        
        <Card>
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24 mb-4">
              <AvatarImage 
                src={`https://avatar.vercel.sh/${user?.email}.png`} 
                alt={user?.email} 
              />
              <AvatarFallback className="text-2xl">
                {userProfile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{userProfile?.full_name || 'Usuario'}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
            {isAdmin && (
              <Badge variant="secondary" className="mt-2">
                Administrador
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                <p className="text-gray-900">{userProfile?.full_name || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo de Usuario</label>
                <p className="text-gray-900">{isAdmin ? 'Administrador' : 'Usuario'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                <p className="text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}
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
