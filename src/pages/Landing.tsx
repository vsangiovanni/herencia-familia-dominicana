import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, BarChart4, FileText, TreePine, Users, Shield, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import PageHelp from '@/components/PageHelp';

const Landing = () => {
  const { user, isApproved, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Handle redirection in a more controlled manner
  useEffect(() => {
    // Only redirect if user is authenticated and approved
    if (!loading && user && isApproved) {
      // Small delay to prevent immediate redirection that could cause loops
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [user, isApproved, loading]);
  
  // Only redirect when explicitly ready to redirect
  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const features = [
    {
      icon: <TreePine className="h-8 w-8 text-legal-blue" />,
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
      <section className="relative bg-legal-blue py-16">
        <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-6">
          <PageHelp helpKey="landing" className="text-white hover:bg-white/10 hover:text-white" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Sistema Genealógico y Determinación de Herederos
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Herramienta especializada para profesionales del derecho en la República Dominicana.
            Un enfoque moderno para la determinación de herederos y análisis genealógico.
          </p>
          
          {!user ? (
            <div className="flex justify-center">
              <Link
                to="/auth"
                className="inline-flex flex-col items-center gap-3 rounded-lg border border-legal-gold/40 bg-white/10 px-8 py-6 shadow-lg transition hover:bg-white/15"
              >
                <TreePine className="h-16 w-16 text-legal-gold md:h-20 md:w-20" />
                <span className="font-serif text-lg text-white">Acceder a HerenciaRD</span>
              </Link>
            </div>
          ) : !isApproved ? (
            <div className="bg-white/10 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-white">
                Su cuenta está pendiente de aprobación. Un administrador revisará su solicitud pronto.
              </p>
            </div>
          ) : null}
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 bg-legal-beige">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-legal-blue text-center mb-12">
            Características y Beneficios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border border-legal-gold/20 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="bg-legal-beige p-4 rounded-full mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-legal-blue mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-legal-dark">
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
          
          <Card className="border border-legal-gold/20 shadow-md">
            <CardContent className="p-8">
              <p className="mb-4 text-legal-dark">
                HerenciaRD es una plataforma diseñada específicamente para profesionales legales en la República Dominicana
                que trabajan en casos de determinación de herederos y análisis genealógico.
              </p>
              <p className="mb-4 text-legal-dark">
                Nuestra herramienta facilita la visualización de árboles genealógicos complejos, análisis de líneas familiares
                y generación de documentación legal conforme a las leyes dominicanas de sucesión.
              </p>
              <p className="text-legal-dark">
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
