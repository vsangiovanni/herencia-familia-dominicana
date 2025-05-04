
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

interface ProfileFormValues {
  full_name: string;
  phone: string;
}

const UserProfile = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: "",
      phone: ""
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
                    
                    <Button onClick={() => setIsEditing(true)} className="mt-4">
                      Editar perfil
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
