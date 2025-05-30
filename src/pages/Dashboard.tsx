
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calculator, Users, FileText, TreePine } from 'lucide-react';

const Dashboard = () => {
  const { user, userProfile, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenido, {userProfile?.full_name || user?.email}
          </h1>
          <p className="text-gray-600">Panel de control - HerenciaRD</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-blue-600" />
                Árbol Genealógico
              </CardTitle>
              <CardDescription>
                Visualiza y gestiona árboles genealógicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/arbol-genealogico">Ver Árbol</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Determinación de Herederos
              </CardTitle>
              <CardDescription>
                Documentación legal para herederos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/determinacion-herederos">Generar Documento</Link>
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  Cálculo de Herencias
                </CardTitle>
                <CardDescription>
                  Calcula distribución de bienes heredados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/calculo-herencias">Calcular</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Administrar Usuarios
                </CardTitle>
                <CardDescription>
                  Gestiona usuarios del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin-users">Administrar</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Usuario</p>
                <p className="font-medium">{userProfile?.full_name || user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de cuenta</p>
                <p className="font-medium">{isAdmin ? 'Administrador' : 'Usuario'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
