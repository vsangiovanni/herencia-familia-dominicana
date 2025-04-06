
import React from 'react';
import DocumentHeader from '@/components/DocumentHeader';
import ClassicFamilyTree from '@/components/ClassicFamilyTree';
import { familyData } from '@/data/familyData';
import { Card, CardContent } from '@/components/ui/card';

const ArbolGenealogicoClasico = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <DocumentHeader 
        title="Árbol Genealógico Clásico" 
        subtitle="Visualización Tradicional de la Familia Sangiovanni - de Paola" 
      />
      
      <div className="max-w-[95%] mx-auto">
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="bg-white p-4 rounded-md shadow mb-6">
              <h3 className="text-lg font-medium text-legal-blue mb-2">Visualización Clásica:</h3>
              <p className="text-gray-700 mb-2">
                Esta vista presenta el árbol genealógico en formato tradicional vertical, 
                mostrando las relaciones familiares con mayor claridad generacional.
              </p>
              <p className="text-sm text-legal-gray">
                <strong>Nota:</strong> Puede desplazarse horizontalmente para ver todas las ramas familiares.
              </p>
            </div>
            
            <div className="overflow-x-auto w-full bg-legal-beige/20 rounded-md p-4">
              <div className="min-w-max">
                <ClassicFamilyTree rootPerson={familyData} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArbolGenealogicoClasico;
