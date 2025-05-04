
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart4, FileText, LucideTree, Users, Shield, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const Landing = () => {
  const { user, isApproved, userPages } = useAuth();
  
  const features = [
    {
      icon: <LucideTree className="h-8 w-8 text-legal-blue" />,
      title: "Árbol Genealógico Interactivo",
      description: "Visualice su árbol genealógico de manera interactiva con opciones de zoom y navegación intuitiva."
    },
    {
      icon: <Workflow className="h-8 w-8 text-legal-blue" />,
      title: "Líneas Familiares",
      description: "Análisis detallado de las líneas familiares para identificar parentescos y relaciones."
    },
    {
      icon: <BarChart4 className="h-8 w-8 text-legal-blue" />,
      title: "Determinación de Herederos",
      description: "Herramienta legal para la determinación precisa de herederos según la legislación dominicana."
    },
    {
      icon: <FileText className="h-8 w-8 text-legal-blue" />,
      title: "Documentación Legal",
      description: "Generación de informes y documentación legal lista para presentar ante los tribunales."
    },
    {
      icon: <Users className="h-8 w-8 text-legal-blue" />,
      title: "Colaboración",
      description: "Comparta y colabore con otros profesionales en casos complejos de determinación de herederos."
    },
    {
      icon: <Shield className="h-8 w-8 text-legal-blue" />,
      title: "Seguridad Garantizada",
      description: "Sus datos están protegidos con los más altos estándares de seguridad y confidencialidad."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-legal-blue/90 to-legal-blue py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Sistema Genealógico y Determinación de Herederos
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Herramienta especializada para profesionales del derecho en la República Dominicana.
            Un enfoque moderno para la determinación de herederos y análisis genealógico.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-legal-blue hover:bg-white/90 font-medium">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/auth?tab=register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Registrarse
                </Button>
              </Link>
            </div>
          ) : !isApproved ? (
            <div className="bg-white/10 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-white">
                Su cuenta está pendiente de aprobación. Un administrador revisará su solicitud pronto.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-medium text-white">Sus páginas disponibles:</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {userPages.map(page => (
                  <Link to={page.path} key={page.id}>
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      {page.name} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-legal-blue text-center mb-12">
            Características y Beneficios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="bg-legal-beige/50 p-4 rounded-full mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-legal-blue mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-legal-blue text-center mb-8">
            Sobre HerenciaRD
          </h2>
          
          <Card className="border-none shadow-md">
            <CardContent className="p-8">
              <p className="mb-4 text-gray-700">
                HerenciaRD es una plataforma diseñada específicamente para profesionales legales en la República Dominicana
                que trabajan en casos de determinación de herederos y análisis genealógico.
              </p>
              <p className="mb-4 text-gray-700">
                Nuestra herramienta facilita la visualización de árboles genealógicos complejos, análisis de líneas familiares
                y generación de documentación legal conforme a las leyes dominicanas de sucesión.
              </p>
              <p className="text-gray-700">
                El sistema ha sido desarrollado en colaboración con abogados especializados para garantizar
                su precisión legal y utilidad práctica en los procedimientos sucesorales.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;
