
import React from 'react';
import { Link } from 'react-router-dom';
import DocumentHeader from '@/components/DocumentHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users } from 'lucide-react';

const DeterminacionHerederos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Determinación de Herederos" 
        subtitle="Alessandro de Paola Sangiovanni" 
      />
      
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-legal-blue mb-4">
                Análisis del Caso
              </h2>
              <p className="text-gray-700 mb-4">
                Alessandro de Paola Sangiovanni, nacido el 18 de octubre de 1911 y fallecido el 14 de enero 
                de 1998, no tuvo descendencia directa. Según la legislación dominicana, específicamente 
                el Código Civil en sus artículos 731 a 755, cuando no existe descendencia directa, 
                la herencia debe distribuirse entre los parientes colaterales más cercanos.
              </p>
              <p className="text-gray-700">
                Para este caso, la determinación de herederos se basará en los vínculos familiares establecidos 
                mediante el análisis genealógico completo presentado en las secciones anteriores.
              </p>
            </div>
            
            <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4 mb-6">
              <h3 className="text-lg font-medium text-legal-blue mb-2">Fundamento Legal</h3>
              <p className="text-gray-700">
                De acuerdo con el Código Civil Dominicano, en ausencia de descendientes directos, cónyuge 
                sobreviviente o ascendientes, la sucesión se defiere a los colaterales más próximos dentro 
                del orden establecido por la ley. En este caso, los herederos legítimos son los descendientes 
                de los hermanos o hermanas del padre o la madre del causante.
              </p>
            </div>
            
            <h3 className="text-xl font-serif font-bold text-legal-blue mb-4">
              Herederos Determinados
            </h3>
            <p className="text-gray-700 mb-6">
              Analizando los vínculos familiares desde la perspectiva legal y siguiendo el orden sucesoral 
              establecido en la legislación dominicana, se han determinado los siguientes herederos legítimos 
              de Alessandro de Paola Sangiovanni:
            </p>
            
            <Table>
              <TableCaption>Herederos legítimos de Alessandro de Paola Sangiovanni</TableCaption>
              <TableHeader>
                <TableRow className="bg-legal-blue/5">
                  <TableHead className="w-[250px]">Nombre</TableHead>
                  <TableHead>Fecha de Nacimiento</TableHead>
                  <TableHead>Vínculo Familiar</TableHead>
                  <TableHead className="text-right">Grado de Parentesco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Víctor Manuel Martín Sangiovanni Rodríguez</TableCell>
                  <TableCell>08/11/1966</TableCell>
                  <TableCell>Hijo de Víctor Manuel Sangiovanni Sangiovanni</TableCell>
                  <TableCell className="text-right">Sobrino nieto directo</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Perla Rosa Brea Sangiovanni</TableCell>
                  <TableCell>30/04/1989</TableCell>
                  <TableCell>Hija de Rosa Julia Sangiovanni Rodríguez</TableCell>
                  <TableCell className="text-right">Sobrina bisnieta</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bernardo Martín Lizardo Sangiovanni</TableCell>
                  <TableCell>28/10/1966</TableCell>
                  <TableCell>Hijo de María Amparo Sangiovanni Gesualdo</TableCell>
                  <TableCell className="text-right">Sobrino bisnieto</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Jocelyn del Jesús Sangiovanni Báez</TableCell>
                  <TableCell>06/10/1963</TableCell>
                  <TableCell>Hija de José Vicente Sangiovanni Gesualdo</TableCell>
                  <TableCell className="text-right">Sobrina bisnieta</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Mayra Josefina Sangiovanni Báez</TableCell>
                  <TableCell>20/11/1965</TableCell>
                  <TableCell>Hija de José Vicente Sangiovanni Gesualdo</TableCell>
                  <TableCell className="text-right">Sobrina bisnieta</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-8 bg-legal-blue/5 p-6 rounded-md border border-legal-blue/20">
              <h3 className="text-xl font-serif font-bold text-legal-blue mb-4">
                Conclusión Legal
              </h3>
              <p className="text-gray-700 mb-4">
                De acuerdo con el análisis genealógico completo y siguiendo las disposiciones del Código Civil 
                Dominicano en materia de sucesiones, se determina que los cinco individuos mencionados en la 
                tabla anterior son los herederos legítimos de Alessandro de Paola Sangiovanni.
              </p>
              <p className="text-gray-700 mb-4">
                Estos herederos deberán recibir partes iguales de la herencia, según lo establecido en el 
                artículo 742 del Código Civil, que establece que "la sucesión se divide por estirpes cuando 
                los llamados a suceder lo son por representación".
              </p>
              <p className="font-medium text-legal-blue">
                Esta determinación se presenta ante el Tribunal de Tierras de la República Dominicana para 
                su validación oficial y los trámites legales correspondientes.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Link to="/lineas-familiares">
            <Button variant="outline" className="w-full md:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Líneas Familiares
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Button className="bg-legal-gold hover:bg-legal-gold/90 text-white">
              <FileText className="mr-2 h-4 w-4" />
              Generar Documento PDF
            </Button>
            
            <Button className="bg-legal-blue hover:bg-legal-blue/90 text-white">
              <Users className="mr-2 h-4 w-4" />
              Ver Árbol Completo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeterminacionHerederos;
