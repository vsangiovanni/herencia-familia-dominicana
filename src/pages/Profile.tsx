import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Key, LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import BackButton from '@/components/BackButton';

const Profile = () => {
  const { user, userProfile, refreshUserProfile, isAdmin, signOut } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await api.updateProfile({ full_name: fullName });

      await refreshUserProfile();
      setIsEditingName(false);
      toast({
        title: "Perfil actualizado",
        description: "Tu nombre ha sido actualizado exitosamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el nombre.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    try {
      await api.updatePassword(newPassword);

      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cambiar contraseña",
        description: error.message || "No se pudo cambiar la contraseña.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Ocurrió un error al cerrar la sesión.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      
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
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm font-medium text-gray-500 block">
                    Nombre Completo
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFullName(userProfile?.full_name || '');
                      setIsEditingName(true);
                    }}
                    className="h-8 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                {isEditingName ? (
                  <div className="space-y-2">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ingresa tu nombre completo"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={loading}
                        className="text-xs"
                      >
                        {loading ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingName(false)}
                        className="text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm md:text-base text-gray-900">
                    {userProfile?.full_name || 'No especificado'}
                  </p>
                )}
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

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-900">Seguridad</h3>
              
              <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Key className="mr-2 h-4 w-4" />
                    Cambiar Contraseña
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                      Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva Contraseña</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingresa tu nueva contraseña"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={loading || !newPassword || !confirmPassword}
                    >
                      {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="destructive" 
                className="w-full justify-start text-sm"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
