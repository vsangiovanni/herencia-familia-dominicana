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
import { CalendarDays, Edit, Key, LogOut, Mail, Shield, UserRound } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';

const Profile = () => {
  const { user, userProfile, refreshUserProfile, isAdmin, signOut } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error instanceof Error ? error.message : "No se pudo actualizar el nombre.",
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
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cambiar contraseña",
        description: error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error instanceof Error ? error.message : "Ocurrió un error al cerrar la sesión.",
      });
    }
  };

  return (
    <div className="app-shell py-8">
      <BackButton />
      <div className="mx-auto max-w-4xl">
        <DocumentHeader
          title="Mi Perfil"
          subtitle="Gestiona tu identidad de usuario y la seguridad de tu cuenta"
          helpKey="perfil"
        />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border border-legal-gold/20 shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-legal-blue/5 via-white to-legal-gold/10">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-legal-gold/30 shadow-sm md:h-24 md:w-24">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email} />
                  <AvatarFallback className="text-lg md:text-2xl">
                    {userProfile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl text-legal-blue md:text-2xl">{userProfile?.full_name || 'Usuario'}</CardTitle>
                  <CardDescription className="mt-1 break-all text-sm md:text-base">{user?.email}</CardDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs md:text-sm">
                      {isAdmin ? 'Administrador' : 'Usuario'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="rounded-md border bg-white p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </p>
                  <p className="break-all text-sm text-gray-900 md:text-base">{user?.email}</p>
                </div>

                <div className="rounded-md border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <UserRound className="h-3.5 w-3.5" />
                      Nombre completo
                    </p>
                    {!isEditingName && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFullName(userProfile?.full_name || '');
                          setIsEditingName(true);
                        }}
                        className="h-8 px-2"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
                        <Button size="sm" onClick={handleUpdateName} disabled={loading} className="text-xs">
                          {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingName(false)} className="text-xs">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 md:text-base">{userProfile?.full_name || 'No especificado'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-legal-blue">
                <Shield className="h-5 w-5" />
                Seguridad y sesión
              </CardTitle>
              <CardDescription>Protege tu cuenta y gestiona el acceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-white p-4">
                <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Fecha de registro
                </p>
                <p className="text-sm text-gray-900 md:text-base">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                </p>
              </div>

              <Separator />

              <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Key className="mr-2 h-4 w-4" />
                    Cambiar contraseña
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
                    <Button onClick={handleChangePassword} disabled={loading || !newPassword || !confirmPassword}>
                      {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="destructive" className="w-full justify-start text-sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
