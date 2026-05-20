import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import DocumentHeader from '@/components/DocumentHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ClassicFamilyTree from '@/components/ClassicFamilyTree';
import { familyData } from '@/data/familyData';

const DeterminacionHerederos = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generatePDF = async () => {
    if (!contentRef.current || !treeRef.current) return;

    toast({
      title: "Generando PDF",
      description: "Por favor espere mientras se genera el documento...",
    });

    try {
      // Configurar el documento PDF en formato carta (8.5 x 11 pulgadas)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [8.5, 11]
      });
      
      // Capturar la parte de determinación de herederos con mejor calidad
      const content = contentRef.current;
      const contentCanvas = await html2canvas(content, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        logging: false,
      });
      
      const contentImgData = contentCanvas.toDataURL('image/png');
      
      // Calcular dimensiones para la parte de contenido
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = contentCanvas.width;
      const contentHeight = contentCanvas.height;
      const contentRatio = Math.min(pdfWidth / contentWidth, 8 / contentHeight);
      
      // Asegurarnos de que las dimensiones sean valores positivos válidos
      const contentImgWidth = Math.max(contentWidth * contentRatio, 0.1); // Mínimo 0.1 pulgada
      const contentImgHeight = Math.max(contentHeight * contentRatio, 0.1); // Mínimo 0.1 pulgada
      const contentX = Math.max((pdfWidth - contentImgWidth) / 2, 0); // No debe ser negativo
      
      // Añadir la primera página (contenido) con coordenadas seguras
      pdf.addImage(contentImgData, 'PNG', contentX, 0.5, contentImgWidth, contentImgHeight);
      
      // Añadir una nueva página en orientación paisaje para el árbol
      pdf.addPage([11, 8.5]); // Formato carta en orientación paisaje
      
      // Añadir título para la página del árbol con coordenadas seguras
      const landscapePdfWidth = pdf.internal.pageSize.getWidth();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Árbol Genealógico Familiar", landscapePdfWidth / 2, 0.5, { align: "center" });
      
      try {
        // Capturar el árbol con un tamaño fijo para evitar problemas
        const tree = treeRef.current;
        
        const treeCanvas = await html2canvas(tree, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          logging: true,
        });
        
        const treeImgData = treeCanvas.toDataURL('image/png');
        
        // Configurar dimensiones seguras para el árbol
        const landscapePdfHeight = pdf.internal.pageSize.getHeight();
        const availableWidth = landscapePdfWidth - 1; // 0.5 pulgada de margen a cada lado
        const availableHeight = landscapePdfHeight - 1.5; // 0.5 margen arriba + 1 abajo
        
        // Asegurarnos de tener dimensiones razonables y seguras
        const treeWidth = treeCanvas.width || 1000; // Valor predeterminado si no hay ancho
        const treeHeight = treeCanvas.height || 800; // Valor predeterminado si no hay altura
        
        // Calcular ratio para ajustar el árbol al espacio disponible
        const treeRatio = Math.min(
          availableWidth / treeWidth,
          availableHeight / treeHeight
        );
        
        // Asegurarnos de que las dimensiones sean positivas
        const treeImgWidth = Math.max(treeWidth * treeRatio, 0.1);
        const treeImgHeight = Math.max(treeHeight * treeRatio, 0.1);
        
        // Calcular posición centrada y asegurarnos de que esté dentro de los límites
        const treeX = Math.max((landscapePdfWidth - treeImgWidth) / 2, 0);
        const treeY = Math.max(1, 0); // Al menos 1 pulgada desde el tope para dejar espacio para el título
        
        // Añadir la imagen con coordenadas seguras
        pdf.addImage(treeImgData, 'PNG', treeX, treeY, treeImgWidth, treeImgHeight);
      } catch (treeError) {
        console.error('Error al procesar el árbol:', treeError);
        
        // Si falla la captura del árbol, agregar un texto de error
        pdf.setFontSize(14);
        pdf.setTextColor(255, 0, 0);
        pdf.text("No se pudo generar la visualización del árbol genealógico.", 0.5, 3);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Por favor, visite la sección 'Ver Árbol Completo' para visualizarlo.", 0.5, 3.5);
      }

      // Guardar PDF
      pdf.save('determinacion_herederos_completa.pdf');

      toast({
        title: "PDF generado con éxito",
        description: "El documento completo ha sido descargado",
        variant: "default",
      });
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: "Hubo un problema al crear el documento. Por favor intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="app-shell py-8">
      <DocumentHeader
        title="Determinación de Herederos"
        subtitle="Alessandro de Paola Sangiovanni"
        helpKey="determinacion-herederos"
      />
      
      <div className="max-w-5xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6" ref={contentRef}>
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
        
        {/* Árbol genealógico para el PDF */}
        <div className="hidden">
          <div ref={treeRef} className="p-8 bg-white">
            <h2 className="text-2xl font-serif font-bold text-legal-blue mb-4 text-center">
              Árbol Genealógico Clásico - Familia Sangiovanni
            </h2>
            <div className="classic-family-tree-container overflow-visible" style={{ width: '1200px', height: '800px' }}>
              <ClassicFamilyTree rootPerson={familyData} />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Link to="/lineas-familiares">
            <Button variant="outline" className="w-full md:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Líneas Familiares
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              className="bg-legal-gold hover:bg-legal-gold/90 text-white"
              onClick={generatePDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar Documento PDF
            </Button>
            
            <Link to="/arbol-genealogico-clasico">
              <Button className="bg-legal-blue hover:bg-legal-blue/90 text-white w-full">
                <Users className="mr-2 h-4 w-4" />
                Ver Árbol Completo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeterminacionHerederos;
