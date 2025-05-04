
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DocumentHeader from "@/components/DocumentHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProfileFormValues {
  full_name: string;
  phone: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: "",
      phone: ""
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Get first letter of email for avatar fallback
  const userInitial = user.email?.[0]?.toUpperCase() || "U";
  const username = user.email?.split("@")[0] || "Usuario";

  // Load user data
  useEffect(() => {
    if (userProfile) {
      setValue('full_name', userProfile.full_name || '');
      setValue('phone', userProfile.phone || '');
    }
  }, [userProfile, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Perfil actualizado",
        description: "Sus datos han sido actualizados correctamente.",
      });
      
      // Refresh user data in context
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudieron guardar los cambios.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', {
        type: 'manual',
        message: 'Las contraseñas no coinciden'
      });
      return;
    }

    if (data.newPassword.length < 6) {
      passwordForm.setError('newPassword', {
        type: 'manual',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    setIsPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;
      
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      setIsSuccessDialogOpen(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cambiar contraseña",
        description: error.message || "No se pudo actualizar la contraseña.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Perfil de Usuario" 
        subtitle="Administre su información personal y preferencias" 
      />

      <div className="max-w-3xl mx-auto mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Información de Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-24 h-24">
                <AvatarImage src={`https://avatar.vercel.sh/${user.id}.png`} />
                <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-lg font-medium">{username}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre completo</Label>
                      <Input
                        id="full_name"
                        {...register('full_name')}
                        placeholder="Ingrese su nombre completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="Ingrese su número de teléfono"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar cambios"}
                      </Button>
                      <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Detalles de la cuenta</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">ID de usuario</p>
                          <p className="text-sm">{user.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Estado</p>
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            Activo
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                          <p className="text-sm">
                            {userProfile?.full_name || "No especificado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                          <p className="text-sm">
                            {userProfile?.phone || "No especificado"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={() => setIsEditing(true)}>
                        Editar perfil
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsPasswordDialogOpen(true)}
                      >
                        Cambiar contraseña
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Ingrese su nueva contraseña para actualizar sus credenciales.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register('newPassword')}
                placeholder="Ingrese su nueva contraseña"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm font-medium text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register('confirmPassword')}
                placeholder="Confirme su nueva contraseña"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm font-medium text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  passwordForm.reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contraseña actualizada</AlertDialogTitle>
            <AlertDialogDescription>
              Su contraseña ha sido actualizada exitosamente. Utilice su nueva contraseña la próxima vez que inicie sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsSuccessDialogOpen(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserProfile;
