
import React, { useState } from 'react';
import DocumentHeader from '@/components/DocumentHeader';
import FamilyTree from '@/components/FamilyTree';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { familyData } from '@/data/familyData';

const ArbolGenealogico = () => {
  const [highlightedPerson, setHighlightedPerson] = useState<string>("alessandro");

  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Árbol Genealógico" 
        subtitle="Familia Sangiovanni - de Paola" 
      />
      
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="arbol" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="arbol">Árbol Completo</TabsTrigger>
            <TabsTrigger value="info">Información del Caso</TabsTrigger>
          </TabsList>
          
          <TabsContent value="arbol" className="mt-6">
            <div className="bg-white p-4 rounded-md shadow mb-6">
              <h3 className="text-lg font-medium text-legal-blue mb-2">Instrucciones:</h3>
              <p className="text-gray-700 mb-2">
                Haga clic en cada miembro para expandir su descendencia. El árbol muestra tres generaciones 
                completas de la familia Sangiovanni, destacando la línea de Alessandro de Paola Sangiovanni.
              </p>
              <p className="text-sm text-legal-gray">
                <strong>Nota:</strong> El miembro resaltado en dorado es Alessandro de Paola Sangiovanni, 
                cuyos herederos estamos determinando.
              </p>
            </div>
            
            <div className="bg-white rounded-md shadow p-2 overflow-x-auto mb-8">
              <FamilyTree rootPerson={familyData} highlightedPerson={highlightedPerson} />
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-serif font-bold text-legal-blue mb-4">
                  Caso Alessandro de Paola Sangiovanni
                </h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-legal-blue mb-2">Datos Principales</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Fallecido:</strong> Alessandro de Paola Sangiovanni</li>
                    <li><strong>Fecha de nacimiento:</strong> 18 de octubre de 1911</li>
                    <li><strong>Fecha de fallecimiento:</strong> 14 de enero de 1998</li>
                    <li><strong>Condición:</strong> Falleció sin descendencia directa</li>
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-legal-blue mb-2">Fundamentos del Caso</h3>
                  <p className="text-gray-700 mb-4">
                    Al no existir descendencia directa, sus herederos legítimos son los parientes 
                    colaterales más cercanos, siguiendo las líneas familiares establecidas en el 
                    artículo 742 y subsiguientes del Código Civil Dominicano.
                  </p>
                  <p className="text-gray-700">
                    La investigación genealógica se ha realizado para determinar con precisión todos 
                    los vínculos familiares y establecer quiénes son los herederos legítimos según el 
                    orden sucesoral establecido por la ley.
                  </p>
                </div>
                
                <div className="bg-legal-beige p-4 rounded-md">
                  <h3 className="text-lg font-medium text-legal-blue mb-2">Objetivo del Análisis</h3>
                  <p className="text-gray-700">
                    Presentar evidencia documental sobre los vínculos familiares para la determinación 
                    oficial de herederos por parte del Tribunal de Tierras de la República Dominicana.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArbolGenealogico;
