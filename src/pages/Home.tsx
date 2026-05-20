
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Users, Calculator, FileText } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="app-shell py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Bienvenido a HerenciaRD
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema especializado en cálculo y determinación de herencias para la República Dominicana. 
            Gestiona procesos sucesorales con tecnología avanzada y precisión legal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Scale className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Cálculo de Herencias</CardTitle>
              <CardDescription>
                Calcula automáticamente la distribución de bienes entre herederos según la ley dominicana
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <FileText className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Determinación de Herederos</CardTitle>
              <CardDescription>
                Genera documentación legal para la determinación oficial de herederos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Gestión Genealógica</CardTitle>
              <CardDescription>
                Administra árboles genealógicos y relaciones familiares complejas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Calculator className="mx-auto h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Herramientas Legales</CardTitle>
              <CardDescription>
                Accede a calculadoras y herramientas especializadas en derecho sucesoral
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link to="/auth">Comenzar Ahora</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
