
import React, { useState } from 'react';
import DocumentHeader from '@/components/DocumentHeader';
import FamilyTree, { Person } from '@/components/FamilyTree';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Datos del árbol genealógico
const familyData: Person = {
  id: "domenico",
  name: "Domenico Sangiovanni",
  birth: "17/12/1845",
  spouse: "María Rosa Grisolia",
  spouseBirth: "18/07/1852",
  children: [
    {
      id: "maria-magdalena",
      name: "María Magdalena Sangiovanni",
      birth: "27/04/1874",
      death: "07/05/1935",
      spouse: "Vincenzo de Paola",
      parentId: "domenico",
      children: [
        {
          id: "alessandro",
          name: "Alessandro de Paola Sangiovanni",
          birth: "18/10/1911",
          death: "14/01/1998",
          isHighlightedAncestor: true,
          parentId: "maria-magdalena"
        }
      ]
    },
    {
      id: "vincenzo",
      name: "Vincenzo Sangiovanni",
      birth: "18/08/1880",
      death: "07/03/1958",
      spouse: "María Balbina Pérez Álvarez",
      parentId: "domenico",
      children: [
        {
          id: "maria-rosa",
          name: "María Rosa Sangiovanni Pérez",
          birth: "18/02/1906",
          death: "07/08/1981",
          spouse: "Pedro Pablo Sangiovanni Simo",
          parentId: "vincenzo",
          children: [
            {
              id: "victor-manuel",
              name: "Víctor Manuel Sangiovanni Sangiovanni",
              birth: "29/10/1932",
              death: "21/10/2007",
              spouse: "Ana Julia Rodríguez",
              parentId: "maria-rosa",
              children: [
                {
                  id: "rosa-julia",
                  name: "Rosa Julia Sangiovanni Rodríguez",
                  birth: "15/04/1963",
                  death: "04/10/2024",
                  spouse: "Francisco Brea",
                  parentId: "victor-manuel",
                  children: [
                    {
                      id: "perla-rosa",
                      name: "Perla Rosa Brea Sangiovanni",
                      birth: "30/04/1989",
                      parentId: "rosa-julia"
                    }
                  ]
                },
                {
                  id: "victor-manuel-martin",
                  name: "Víctor Manuel Martín Sangiovanni Rodríguez",
                  birth: "08/11/1966",
                  parentId: "victor-manuel"
                }
              ]
            }
          ]
        },
        {
          id: "domingo-ramon",
          name: "Domingo Ramón Sangiovanni Pérez",
          birth: "11/07/1907",
          death: "03/08/1981",
          spouse: "María Francisca Gesualdo",
          parentId: "vincenzo",
          children: [
            {
              id: "maria-amparo",
              name: "María Amparo Sangiovanni Gesualdo",
              birth: "30/10/1929",
              death: "15/01/2004",
              spouse: "Bernardo Edmundo Lizardo Fernández",
              parentId: "domingo-ramon",
              children: [
                {
                  id: "bernardo-martin",
                  name: "Bernardo Martín Lizardo Sangiovanni",
                  birth: "28/10/1966",
                  parentId: "maria-amparo"
                }
              ]
            },
            {
              id: "jose-vicente",
              name: "José Vicente Sangiovanni Gesualdo",
              birth: "19/04/1932",
              death: "24/04/1976",
              spouse: "Ozema Báez",
              parentId: "domingo-ramon",
              children: [
                {
                  id: "jocelyn",
                  name: "Jocelyn del Jesús Sangiovanni Báez",
                  birth: "06/10/1963",
                  parentId: "jose-vicente"
                },
                {
                  id: "mayra",
                  name: "Mayra Josefina Sangiovanni Báez",
                  birth: "20/11/1965",
                  parentId: "jose-vicente"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "paolo",
      name: "Paolo Sangiovanni",
      birth: "17/01/1885",
      death: "31/03/1936",
      spouse: "Simona Simo",
      parentId: "domenico",
      children: [
        {
          id: "pedro-pablo",
          name: "Pedro Pablo Sangiovanni Simo",
          birth: "29/10/1906",
          death: "04/10/1986",
          parentId: "paolo"
        }
      ]
    }
  ]
};

const ArbolGenealogico = () => {
  const [highlightedPerson, setHighlightedPerson] = useState<string>("alessandro");

  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Árbol Genealógico" 
        subtitle="Familia Sangiovanni - de Paola" 
      />
      
      <Tabs defaultValue="arbol" className="max-w-4xl mx-auto">
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
  );
};

export default ArbolGenealogico;
