
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DocumentHeader from '@/components/DocumentHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const UserProfile = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, profileForm]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name || null,
          phone: data.phone || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserProfile();
      
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido actualizada exitosamente.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormValues) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ 
        password: data.password 
      });

      if (error) throw error;
      
      // Cerrar diálogo de cambio de contraseña
      setPasswordDialogOpen(false);
      
      // Abrir diálogo de éxito
      setSuccessDialogOpen(true);
      
      // Reiniciar formulario
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cambiar la contraseña',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-legal-blue"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar pantalla especial para usuarios pendientes de aprobación
  if (!userProfile.is_approved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DocumentHeader 
          title="Perfil de Usuario" 
          subtitle="Cuenta pendiente de aprobación"
        />
        
        <div className="max-w-2xl mx-auto">
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="rounded-full bg-yellow-100 p-2">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-yellow-800">Cuenta pendiente de aprobación</h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    Tu cuenta está pendiente de aprobación por un administrador. Una vez aprobada, 
                    podrás acceder a todas las funcionalidades del sistema.
                  </p>
                  <p className="mt-4 text-sm text-yellow-700">
                    Mientras tanto, puedes completar tu perfil para facilitar el proceso de aprobación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-serif font-bold text-legal-blue mb-4">
                Información Personal
              </h2>
              
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      Cambiar contraseña
                    </Button>
                    
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Perfil de Usuario" 
        subtitle="Administra tu información personal"
      />
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-serif font-bold text-legal-blue mb-4">
              Información Personal
            </h2>
            
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-4 rounded bg-gray-50 mb-4">
                  <p className="text-gray-600"><span className="font-medium">Correo electrónico:</span> {user.email}</p>
                  <p className="text-gray-600 mt-1"><span className="font-medium">Rol:</span> {userProfile.role === 'admin' ? 'Administrador' : 'Usuario Regular'}</p>
                </div>
                
                <FormField
                  control={profileForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between items-center pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    Cambiar contraseña
                  </Button>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo de cambio de contraseña */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Introduce tu nueva contraseña. Debe tener al menos 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Cambiar contraseña'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de éxito */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contraseña actualizada</DialogTitle>
            <DialogDescription>
              Tu contraseña ha sido cambiada exitosamente.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
