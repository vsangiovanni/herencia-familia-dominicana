
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DocumentHeader from "@/components/DocumentHeader";

const UserProfile = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Get first letter of email for avatar fallback
  const userInitial = user.email?.[0]?.toUpperCase() || "U";
  const username = user.email?.split("@")[0] || "Usuario";

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
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Esta es la información básica de su cuenta. Próximamente habilitaremos más opciones
                    de personalización de perfil.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
