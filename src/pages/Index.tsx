
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import DocumentHeader from '@/components/DocumentHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Árbol Genealógico y Determinación de Herederos" 
        subtitle="Caso Alessandro de Paola Sangiovanni" 
      />
      
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-serif font-bold text-legal-blue mb-4">
              Presentación del Caso
            </h2>
            <p className="mb-4 text-gray-700">
              Este documento presenta un análisis genealógico completo para la determinación 
              de herederos legítimos de <strong>Alessandro de Paola Sangiovanni</strong>, 
              quien falleció sin descendencia directa el 14 de enero de 1998.
            </p>
            <p className="mb-4 text-gray-700">
              La investigación genealógica se remonta a tres generaciones para establecer 
              claramente los vínculos de parentesco y determinar quiénes tienen derecho legal 
              a la herencia según las leyes dominicanas de sucesión.
            </p>
            
            <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4 mb-4">
              <h3 className="text-lg font-medium text-legal-dark mb-2">
                Objetivo del Documento
              </h3>
              <p className="text-gray-700">
                Presentar ante el Tribunal de Tierras de la República Dominicana la evidencia 
                genealógica que sustenta la determinación de herederos legítimos, siguiendo el 
                orden sucesoral establecido por la ley.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-serif font-bold text-legal-blue mb-3">
                Contenido del Documento
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Árbol genealógico interactivo</li>
                <li>Análisis de líneas familiares</li>
                <li>Determinación legal de herederos</li>
                <li>Documentación de respaldo</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-serif font-bold text-legal-blue mb-3">
                Base Legal
              </h3>
              <p className="text-gray-700">
                Este análisis se fundamenta en el Código Civil Dominicano, específicamente en 
                los artículos relacionados con la sucesión intestada y el orden de los 
                herederos cuando no existe descendencia directa.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
          <Link to="/arbol-genealogico">
            <Button className="w-full md:w-auto bg-legal-blue hover:bg-legal-blue/90 text-white">
              Ver Árbol Genealógico
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link to="/lineas-familiares">
            <Button className="w-full md:w-auto bg-legal-gold hover:bg-legal-gold/90 text-white">
              Explorar Líneas Familiares
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link to="/determinacion-herederos">
            <Button className="w-full md:w-auto border border-legal-blue text-legal-blue bg-white hover:bg-legal-beige">
              Determinación Final
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
