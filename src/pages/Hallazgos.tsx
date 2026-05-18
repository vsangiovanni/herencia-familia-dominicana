import React from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, FileSearch, GitBranch, Scale } from 'lucide-react';

const findings = [
  {
    title: 'Doble vínculo de Víctor Manuel Martín Sangiovanni Rodríguez',
    severity: 'Alta prioridad',
    issue:
      'La determinación identifica a Víctor como heredero, pero la narrativa puede quedarse corta si lo presenta solo por una línea familiar.',
    detail:
      'Víctor entra por Vincenzo/Vicente Sangiovanni, padre de María Rosa Sangiovanni Pérez, y también por Paolo/Paulino Sangiovanni, padre de Pedro Pablo Sangiovanni Simo. María Rosa y Pedro Pablo eran primos y abuelos de Víctor por líneas distintas del tronco Sangiovanni.',
    suggestion:
      'Preparar una matriz de doble filiación que muestre ambas rutas desde Domenico Sangiovanni hasta Víctor y validar con actas cada enlace generacional.',
  },
  {
    title: 'Impacto de la doble vocación sucesoral',
    severity: 'Alta prioridad',
    issue:
      'La frase de distribución en partes iguales puede ser una simplificación si el análisis legal debe ponderar estirpes, representación o doble vocación sucesoral por líneas colaterales.',
    detail:
      'El sistema menciona el artículo 742 y habla de partes iguales, pero no desarrolla si la concurrencia de vínculos por dos líneas familiares modifica la cuota hereditaria o solo refuerza la legitimación como heredero.',
    suggestion:
      'Consultar y documentar criterio jurídico específico: si la doble vocación sucesoral solo acredita parentesco por dos vías o si incide en participación, grado o argumentación ante tribunal.',
  },
  {
    title: 'Etiqueta de grado de parentesco',
    severity: 'Media prioridad',
    issue:
      'El grado asignado a Víctor como “sobrino nieto directo” puede no capturar toda la complejidad del vínculo familiar.',
    detail:
      'La etiqueta ayuda visualmente, pero no explica que la conexión viene simultáneamente por María Rosa Sangiovanni Pérez y Pedro Pablo Sangiovanni Simo.',
    suggestion:
      'Definir una nomenclatura legal/genealógica consistente para cada heredero, separando “grado civil”, “ruta genealógica” y “rama familiar”.',
  },
  {
    title: 'Fecha pendiente de validación: Domingo Ramón Sangiovanni Pérez',
    severity: 'Alta prioridad',
    issue:
      'La fecha de fallecimiento de Domingo Ramón aparece distinta entre el árbol y la página de líneas familiares.',
    detail:
      'En el árbol genealógico figura con fallecimiento 03/09/1981, mientras en líneas familiares figura 03/08/1981. A diferencia de Vicente/Vincenzo, este punto todavía no tiene acta revisada dentro de los documentos recibidos en esta sesión.',
    suggestion:
      'Solicitar o localizar el acta de defunción de Domingo Ramón Sangiovanni Pérez antes de corregir esa fecha. Una vez validada, actualizar la matriz documental y luego alinear las secciones públicas.',
  },
  {
    title: 'Perla Rosa también comparte la doble línea',
    severity: 'Media prioridad',
    issue:
      'Perla Rosa Brea Sangiovanni aparece como hija de Rosa Julia, pero su ruta completa también depende del matrimonio María Rosa/Pedro Pablo.',
    detail:
      'Al ser descendiente de Rosa Julia Sangiovanni Rodríguez, Perla hereda la misma doble conexión familiar por Vincenzo y Paolo dentro de esa rama.',
    suggestion:
      'Extender la matriz de doble filiación a Perla y a cualquier otro descendiente de la rama María Rosa/Pedro Pablo.',
  },
  {
    title: 'Ausencia de fuentes visibles por dato',
    severity: 'Alta prioridad',
    issue:
      'El sistema presenta nombres, fechas y vínculos, pero no muestra la fuente documental de cada afirmación.',
    detail:
      'Para uso legal, cada enlace familiar debe poder sostenerse con documentos verificables. La interfaz actual funciona como presentación, pero no como índice probatorio.',
    suggestion:
      'Agregar, en una fase posterior, una tabla de evidencias por persona y relación: documento, fecha, emisor, archivo asociado y estado de validación.',
  },
];

const actionItems = [
  'Levantar matriz persona-rama: Alessandro, ancestros comunes, ramas Vincenzo y Paolo, y cada heredero.',
  'Validar fechas contra actas antes de usar el PDF como pieza final.',
  'Separar la conclusión jurídica de la representación genealógica para que el abogado confirme el efecto sucesoral.',
  'Conservar el backup Supabase y la base MySQL local como evidencia operativa de recuperación de datos.',
];

const Hallazgos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>

      <DocumentHeader
        title="Hallazgos"
        subtitle="Inconsistencias, riesgos y sugerencias de revisión"
      />

      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <FileSearch className="h-5 w-5" />
              Resumen de Revisión
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-4">
              Esta página separa observaciones de control sobre el expediente genealógico y sucesoral.
              No modifica la determinación actual; sirve como lista de revisión para fortalecer el caso
              antes de presentar o actualizar documentación legal.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Hallazgos registrados</p>
                <p className="text-2xl font-bold text-legal-blue">{findings.length}</p>
              </div>
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Foco principal</p>
                <p className="font-medium text-legal-blue">Doble filiación</p>
              </div>
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Estado</p>
                <p className="font-medium text-legal-blue">Pendiente de validación documental</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {findings.map((finding, index) => (
            <Card key={finding.title} className="border border-legal-gold/20 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <CardTitle className="flex items-start gap-2 text-xl text-legal-blue">
                    <AlertTriangle className="h-5 w-5 mt-1 text-legal-gold" />
                    <span>{index + 1}. {finding.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className="w-fit border-legal-gold text-legal-blue">
                    {finding.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-legal-blue mb-1">Inconsistencia o riesgo</h3>
                    <p className="text-gray-700">{finding.issue}</p>
                  </div>
                  <Separator className="bg-legal-gold/20" />
                  <div>
                    <h3 className="font-medium text-legal-blue mb-1">Lectura del hallazgo</h3>
                    <p className="text-gray-700">{finding.detail}</p>
                  </div>
                  <div className="bg-legal-blue/5 border border-legal-blue/20 rounded-md p-4">
                    <h3 className="flex items-center gap-2 font-medium text-legal-blue mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Sugerencia de solución
                    </h3>
                    <p className="text-gray-700">{finding.suggestion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Scale className="h-5 w-5" />
              Próximos Pasos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {actionItems.map((item) => (
                <li key={item} className="flex gap-3 text-gray-700">
                  <GitBranch className="h-5 w-5 text-legal-gold shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Hallazgos;
