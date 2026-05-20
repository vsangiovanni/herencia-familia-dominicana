import React, { useState } from 'react';
import DocumentHeader from '@/components/DocumentHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FamilyMember from '@/components/FamilyMember';
import BackButton from '@/components/BackButton';

const LineasFamiliares = () => {
  const [activeTab, setActiveTab] = useState("primera-generacion");

  return (
    <div className="app-shell py-8">
      <BackButton />
      
      <DocumentHeader
        title="Líneas Familiares"
        subtitle="Análisis Detallado por Generación"
        helpKey="lineas-familiares"
      />
      
      <div className="max-w-5xl mx-auto">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
            <TabsTrigger value="primera-generacion">Primera Generación</TabsTrigger>
            <TabsTrigger value="segunda-generacion">Segunda Generación</TabsTrigger>
            <TabsTrigger value="tercera-generacion">Tercera Generación</TabsTrigger>
          </TabsList>
          
          <TabsContent value="primera-generacion" className="mt-6">
            <Card>
              <CardHeader className="bg-legal-blue/5 border-b">
                <CardTitle className="text-xl font-serif text-legal-blue">Primera Generación (Raíces Familiares)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <FamilyMember
                    name="Domenico (Domingo) Sangiovanni"
                    birth="17/12/1845"
                    spouse="María Rosa Grisolia"
                    className="w-full md:w-auto"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-legal-blue mb-2">Información Principal</h3>
                    <p className="text-gray-700 mb-4">
                      Domenico (Domingo) Sangiovanni, nacido el 17 de diciembre de 1845 en Italia, contrajo matrimonio con 
                      María Rosa Grisolia, nacida el 18 de julio de 1852 también en Italia. Esta unión representa 
                      las raíces de la familia Sangiovanni en la República Dominicana.
                    </p>
                    
                    <h4 className="font-medium text-legal-blue mt-4 mb-2">Hijos del matrimonio:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>María Magdalena Sangiovanni (n. 27/04/1874 - m. 07/05/1935)</li>
                      <li>Vincenzo (Vicente) Sangiovanni (n. 13/08/1880 - m. 07/02/1958)</li>
                      <li>Paolo (Paulino) Sangiovanni (n. 17/01/1885 - m. 31/03/1936)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4 mt-4">
                  <h3 className="text-lg font-medium text-legal-blue mb-2">Relevancia para el Caso</h3>
                  <p className="text-gray-700">
                    Esta generación establece la línea familiar original desde la cual se trazarán 
                    los vínculos de parentesco para la determinación de herederos de Alessandro de Paola Sangiovanni.
                    Los tres hijos del matrimonio originario representan las tres ramas principales de la familia.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="segunda-generacion" className="mt-6">
            <Card>
              <CardHeader className="bg-legal-blue/5 border-b">
                <CardTitle className="text-xl font-serif text-legal-blue">Segunda Generación (Descendencia Directa)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-medium text-legal-blue">
                      1. María Magdalena Sangiovanni
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 border-l-2 border-legal-gold/30">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <FamilyMember
                            name="María Magdalena Sangiovanni"
                            birth="27/04/1874"
                            death="07/05/1935"
                            spouse="Vincenzo de Paola"
                          />
                          
                          <div className="flex-1">
                            <p className="text-gray-700 mb-4">
                              María Magdalena Sangiovanni contrajo matrimonio con Vincenzo de Paola. 
                              De esta unión nació Alessandro de Paola Sangiovanni, el causante de la 
                              presente determinación de herederos.
                            </p>
                            
                            <h4 className="font-medium text-legal-blue mb-2">Descendencia:</h4>
                            <ul className="list-disc pl-5">
                              <li>
                                <strong>Alessandro de Paola Sangiovanni</strong> (n. 18/10/1911 - m. 14/01/1998) 
                                <span className="text-legal-blue"> (Falleció sin descendencia directa)</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-medium text-legal-blue">
                      2. Vincenzo (Vicente) Sangiovanni
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 border-l-2 border-legal-gold/30">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <FamilyMember
                            name="Vincenzo (Vicente) Sangiovanni"
                            birth="13/08/1880"
                            death="07/02/1958"
                            spouse="María Balbina Pérez Álvarez"
                          />
                          
                          <div className="flex-1">
                            <p className="text-gray-700 mb-4">
                              Vincenzo (Vicente) Sangiovanni contrajo matrimonio con María Balbina Pérez Álvarez.
                              Esta rama familiar tiene relevancia directa en la determinación de herederos
                              ya que sus descendientes tienen derecho a la herencia de Alessandro de Paola Sangiovanni.
                            </p>
                            
                            <h4 className="font-medium text-legal-blue mb-2">Descendencia:</h4>
                            <ul className="list-disc pl-5">
                              <li>María Rosa Sangiovanni Pérez (n. 18/02/1906 - m. 07/08/1981)</li>
                              <li>Domingo Ramón Sangiovanni Pérez (n. 11/07/1907 - m. 03/08/1981)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-medium text-legal-blue">
                      3. Paolo (Paulino) Sangiovanni
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 border-l-2 border-legal-gold/30">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <FamilyMember
                            name="Paolo (Paulino) Sangiovanni"
                            birth="17/01/1885"
                            death="31/03/1936"
                            spouse="Simona Simo"
                          />
                          
                          <div className="flex-1">
                            <p className="text-gray-700 mb-4">
                              Paolo (Paulino) Sangiovanni contrajo matrimonio con Simona Simo. Al igual que la rama de Vincenzo (Vicente),
                              los descendientes de Paolo (Paulino) tienen relevancia en la determinación de herederos del causante.
                            </p>
                            
                            <h4 className="font-medium text-legal-blue mb-2">Descendencia:</h4>
                            <ul className="list-disc pl-5">
                              <li>Pedro Pablo Sangiovanni Simo (n. 29/10/1906 - m. 04/10/1986)</li>
                            </ul>
                            
                            <div className="mt-4 bg-legal-beige/30 p-3 rounded-md">
                              <p className="text-sm">
                                <strong>Nota:</strong> Pedro Pablo Sangiovanni Simo se casó con María Rosa Sangiovanni Pérez,
                                su prima, hija de Vincenzo (Vicente) Sangiovanni, creando así un vínculo familiar complejo.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4 mt-6">
                  <h3 className="text-lg font-medium text-legal-blue mb-2">Relevancia para el Caso</h3>
                  <p className="text-gray-700">
                    Esta generación es clave para la determinación de herederos, ya que incluye a Alessandro 
                    de Paola Sangiovanni (el causante) y a sus primos, cuyos descendientes serían los 
                    herederos legales según el orden sucesoral establecido en la legislación dominicana.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tercera-generacion" className="mt-6">
            <Card>
              <CardHeader className="bg-legal-blue/5 border-b">
                <CardTitle className="text-xl font-serif text-legal-blue">Tercera Generación (Posibles Herederos)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-legal-blue mb-4">Descendientes de María Rosa Sangiovanni Pérez y Pedro Pablo Sangiovanni Simo</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <FamilyMember
                        name="Víctor Manuel Sangiovanni Sangiovanni"
                        birth="29/10/1932"
                        death="21/10/2007"
                        spouse="Ana Julia Rodríguez"
                        className="w-full"
                      />
                      
                      <div className="mt-4 pl-8">
                        <h4 className="font-medium text-legal-gray mb-2">Descendientes:</h4>
                        <ul className="list-disc pl-5 space-y-3">
                          <li>
                            <strong>Rosa Julia Sangiovanni Rodríguez</strong> (n. 15/04/1963 - m. 04/10/2024)
                            <br /><span className="text-sm text-legal-gray">Casada con Francisco Brea</span>
                            <ul className="list-circle pl-5 mt-1">
                              <li><strong>Perla Rosa Brea Sangiovanni</strong> (n. 30/04/1989)</li>
                            </ul>
                          </li>
                          <li><strong>Víctor Manuel Martín Sangiovanni Rodríguez</strong> (n. 08/11/1966)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-legal-blue mb-4">Descendientes de Domingo Ramón Sangiovanni Pérez</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FamilyMember
                        name="María Amparo Sangiovanni Gesualdo"
                        birth="30/10/1929"
                        death="15/01/2004"
                        spouse="Bernardo Edmundo Lizardo Fernández"
                        className="w-full"
                      />
                      
                      <div className="mt-4 pl-8">
                        <h4 className="font-medium text-legal-gray mb-2">Descendientes:</h4>
                        <ul className="list-disc pl-5">
                          <li><strong>Bernardo Martín Lizardo Sangiovanni</strong> (n. 28/10/1966)</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <FamilyMember
                        name="José Vicente Sangiovanni Gesualdo"
                        birth="19/04/1932"
                        death="24/04/1976"
                        spouse="Ozema Báez"
                        className="w-full"
                      />
                      
                      <div className="mt-4 pl-8">
                        <h4 className="font-medium text-legal-gray mb-2">Descendientes:</h4>
                        <ul className="list-disc pl-5">
                          <li><strong>Jocelyn del Jesús Sangiovanni Báez</strong> (n. 06/10/1963)</li>
                          <li><strong>Mayra Josefina Sangiovanni Báez</strong> (n. 20/11/1965)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4 mt-6">
                  <h3 className="text-lg font-medium text-legal-blue mb-2">Relevancia para el Caso</h3>
                  <p className="text-gray-700 mb-4">
                    Los miembros de esta tercera generación son los herederos legales más cercanos de Alessandro 
                    de Paola Sangiovanni, puesto que él falleció sin descendencia directa. Según el Código Civil 
                    Dominicano, estos parientes colaterales tienen derecho a la herencia.
                  </p>
                  <p className="text-gray-700">
                    Específicamente, los cinco miembros vivos de esta generación son quienes deben ser considerados 
                    para la determinación oficial de herederos por parte del tribunal.
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

export default LineasFamiliares;
