import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api, ConfirmedHeir, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { AlertTriangle, CheckCircle2, FileSearch, GitBranch, Scale } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type Severity = 'Alta prioridad' | 'Media prioridad' | 'Baja prioridad';

type DynamicFinding = {
  title: string;
  severity: Severity;
  issue: string;
  detail: string;
  suggestion: string;
};

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const Hallazgos = () => {
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [heirs, setHeirs] = useState<ConfirmedHeir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersResponse, documentsResponse, heirsResponse] = await Promise.all([
          api.listSiennaFamilyMembers(),
          api.listEvidenceDocuments(),
          api.listConfirmedHeirs(),
        ]);
        setMembers(membersResponse.members);
        setDocuments(documentsResponse.documents);
        setHeirs(heirsResponse.heirs);
      } catch (error) {
        toast({
          title: 'No se pudo cargar Hallazgos',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const findings = useMemo<DynamicFinding[]>(() => {
    const items: DynamicFinding[] = [];
    const memberNameById = new Map(members.map((member) => [member.id, member.name]));

    const dualLineHeirs = heirs.filter((heir) => heir.line_vincenzo && heir.line_paolo);
    if (dualLineHeirs.length) {
      const sampleNames = dualLineHeirs.slice(0, 4).map((heir) => heir.heir_name).join(', ');
      items.push({
        title: 'Herederos con doble línea familiar',
        severity: 'Alta prioridad',
        issue:
          'Hay herederos llamados simultáneamente por Vincenzo/Vicente y Paolo/Paulino, lo que requiere narrativa jurídica más precisa.',
        detail: `Se detectaron ${dualLineHeirs.length} heredero(s) con doble línea. Ejemplos: ${sampleNames}.`,
        suggestion:
          'Mantener una matriz de doble filiación por heredero y validar en cada actualización que ambas rutas tengan respaldo documental.',
      });
    }

    const membersByName = new Map<string, SiennaFamilyMember[]>();
    members.forEach((member) => {
      const key = normalizeName(member.name);
      const list = membersByName.get(key) || [];
      list.push(member);
      membersByName.set(key, list);
    });

    const duplicatedNames = Array.from(membersByName.entries()).filter(([, list]) => list.length > 1);
    if (duplicatedNames.length) {
      items.push({
        title: 'Nombres repetidos en el árbol',
        severity: 'Media prioridad',
        issue: 'Existen personas con el mismo nombre y esto puede confundir relaciones o documentos asociados.',
        detail: `Se detectaron ${duplicatedNames.length} nombre(s) duplicado(s) en miembros del árbol.`,
        suggestion:
          'Agregar identificadores de contexto en las fichas (rama, padre/madre o fecha) para evitar ambigüedad al cargar y validar evidencias.',
      });
    }

    const deathDateConflicts = duplicatedNames
      .map(([, list]) => {
        const deaths = Array.from(
          new Set(list.map((member) => (member.death || '').trim()).filter(Boolean))
        );
        return deaths.length > 1 ? { name: list[0].name, deaths } : null;
      })
      .filter(Boolean) as Array<{ name: string; deaths: string[] }>;

    if (deathDateConflicts.length) {
      const sampleConflict = deathDateConflicts[0];
      items.push({
        title: 'Fechas de defunción inconsistentes',
        severity: 'Alta prioridad',
        issue: 'Hay personas con más de una fecha de defunción registrada.',
        detail: `Se encontraron ${deathDateConflicts.length} conflicto(s). Ejemplo: ${sampleConflict.name} (${sampleConflict.deaths.join(' vs ')}).`,
        suggestion:
          'Verificar actas de defunción para cada conflicto y normalizar una sola fecha válida en todo el expediente.',
      });
    }

    const evidenceMemberIds = new Set(
      documents
        .map((document) => (document.related_member_id || '').trim())
        .filter(Boolean)
    );
    const heirsWithoutEvidence = heirs.filter((heir) => {
      if (!heir.sienna_member_id) return true;
      return !evidenceMemberIds.has(heir.sienna_member_id);
    });
    if (heirsWithoutEvidence.length) {
      items.push({
        title: 'Herederos sin soporte documental vinculado',
        severity: 'Alta prioridad',
        issue: 'Hay herederos sin documentos relacionados directamente en el expediente.',
        detail: `Se detectaron ${heirsWithoutEvidence.length} heredero(s) sin soporte asociado por miembro.`,
        suggestion:
          'Priorizar carga de actas por heredero y activar validación mínima de al menos un documento por cada candidato heredero.',
      });
    }

    const documentsWithoutMember = documents.filter((document) => !document.related_member_id);
    if (documentsWithoutMember.length) {
      items.push({
        title: 'Documentos sin miembro titular asociado',
        severity: 'Media prioridad',
        issue:
          'Existen documentos cargados que no apuntan a un miembro del árbol y su valor probatorio se reduce.',
        detail: `Hay ${documentsWithoutMember.length} documento(s) sin miembro titular asociado.`,
        suggestion:
          'Completar `Miembro titular` en cada documento para que el sistema pueda usarlo en trazabilidad y cálculo.',
      });
    }

    const pendingHeirs = heirs.filter((heir) => heir.status !== 'confirmado');
    if (pendingHeirs.length) {
      items.push({
        title: 'Herederos pendientes de confirmación',
        severity: 'Media prioridad',
        issue: 'Parte de los herederos siguen en estado pendiente o mencionado.',
        detail: `${pendingHeirs.length} heredero(s) no están confirmados todavía.`,
        suggestion:
          'Completar evidencias y actualizar estado para estabilizar cálculos y reportes legales.',
      });
    }

    if (!items.length) {
      items.push({
        title: 'Sin hallazgos críticos activos',
        severity: 'Baja prioridad',
        issue: 'No se detectaron inconsistencias relevantes con la data actual.',
        detail: 'El árbol, herederos y documentos están alineados según las reglas evaluadas.',
        suggestion:
          'Mantener revisión periódica al cargar nuevos documentos o editar miembros para conservar consistencia.',
      });
    }

    return items;
  }, [documents, heirs, members]);

  const actionItems = useMemo(() => {
    const actions = [
      'Revisar y cerrar hallazgos de alta prioridad antes de usar reportes finales.',
      'Validar fechas y parentescos contra actas antes de publicar cambios legales.',
      'Mantener vinculación documento -> miembro titular en cada carga nueva.',
    ];
    if (heirs.some((heir) => heir.status !== 'confirmado')) {
      actions.push('Convertir herederos en estado pendiente a confirmado cuando exista soporte suficiente.');
    }
    if (documents.some((document) => !document.related_member_id)) {
      actions.push('Corregir documentos huérfanos asignando miembro titular desde Documentos Probatorios.');
    }
    return actions;
  }, [documents, heirs]);

  const highPriorityFindings = findings.filter((finding) => finding.severity === 'Alta prioridad').length;
  const focusTitle = findings[0]?.title || 'Revisión general';
  const statusLabel =
    highPriorityFindings > 0
      ? 'Requiere atención prioritaria'
      : findings.some((finding) => finding.severity === 'Media prioridad')
        ? 'En seguimiento'
        : 'Controlado';

  return (
    <div className="app-shell py-8">
      <BackButton />

      <DocumentHeader
        title="Hallazgos"
        subtitle="Inconsistencias, riesgos y sugerencias de revisión"
        helpKey="hallazgos"
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <FileSearch className="h-5 w-5" />
              Resumen de Revisión
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-4">
              Esta página se actualiza de forma dinámica usando miembros, herederos y documentos vigentes.
              No altera cálculos ni decisiones jurídicas: organiza alertas de consistencia para revisión.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Hallazgos registrados</p>
                <p className="text-2xl font-bold text-legal-blue">{loading ? '...' : findings.length}</p>
              </div>
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Foco principal</p>
                <p className="font-medium text-legal-blue">{loading ? 'Cargando...' : focusTitle}</p>
              </div>
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Estado</p>
                <p className="font-medium text-legal-blue">{loading ? 'Cargando...' : statusLabel}</p>
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
                  <Badge
                    variant="outline"
                    className={`w-fit border-legal-gold ${
                      finding.severity === 'Alta prioridad'
                        ? 'text-red-700'
                        : finding.severity === 'Media prioridad'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                    }`}
                  >
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
