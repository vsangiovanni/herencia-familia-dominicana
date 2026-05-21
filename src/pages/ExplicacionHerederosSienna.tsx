import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { api, ConfirmedHeir, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  applySiennaCaseConfig,
  buildDominicanInheritancePlan,
  InheritanceShare,
  legalCriterionText,
  normalizeName,
} from '@/lib/dominicanInheritance';
import {
  buildCaseGlossary,
  buildMemberLifeTimeline,
  buildWhyIInheritText,
  downloadHeirBriefPdf,
  evaluateEvidenceSupport,
  formatMoney,
  formatPercent,
  heirPhotoByName,
  routeSteps,
} from '@/lib/siennaHeirExplain';
import { buildCalculationPayload, buildMembersHash, calculateHeirAmount, parseCalculationPayload, resolveHeirSimulatedShare } from '@/lib/siennaCalculation';
import { SiennaGenealogyBundle } from '@/lib/siennaGenealogy';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  FileDown,
  FileText,
  GitBranch,
  Landmark,
  Loader2,
  Printer,
  Route,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

type HeirBrief = {
  share: InheritanceShare;
  documents: EvidenceDocument[];
  simulatedShare: number;
  simulatedAmount: number;
  photo?: ConfirmedHeir | null;
  traffic: ReturnType<typeof evaluateEvidenceSupport>;
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const ExplicacionHerederosSienna = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [genealogy, setGenealogy] = useState<SiennaGenealogyBundle>({ unions: [], parent_links: [] });
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [heirs, setHeirs] = useState<ConfirmedHeir[]>([]);
  const [estateAmount, setEstateAmount] = useState('');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [snapshotNote, setSnapshotNote] = useState('');
  const [excludedHeirs, setExcludedHeirs] = useState<string[]>([]);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos y cálculos de explicación...');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingMessage('Consultando miembros, documentos, herederos y settings...');
      try {
        const [membersResponse, documentsResponse, settingsResponse, heirsResponse] = await Promise.all([
          api.listSiennaFamilyMembers(),
          api.listEvidenceDocuments(),
          api.getSettings(),
          api.listConfirmedHeirs(),
        ]);
        setLoadingMessage('Aplicando configuración y preparando explicaciones...');
        setMembers(membersResponse.members);
        setGenealogy({
          unions: membersResponse.unions || [],
          parent_links: membersResponse.parent_links || [],
        });
        applySiennaCaseConfig(settingsResponse.settings.sienna_case_config);
        setDocuments(documentsResponse.documents);
        setHeirs(heirsResponse.heirs);
        setLawyerFeePercentage(String(settingsResponse.settings.lawyer_fee_percentage ?? 0));
        try {
          setLoadingMessage('Validando snapshot y simulación previa...');
          const latestSnapshotResponse = await api.getLatestSiennaCalculationSnapshot();
          if (latestSnapshotResponse.snapshot) {
            const currentMembersHash = buildMembersHash(membersResponse.members.map((member) => member.id));
            if (
              latestSnapshotResponse.snapshot.members_hash &&
              latestSnapshotResponse.snapshot.members_hash !== currentMembersHash
            ) {
              toast({
                title: 'Snapshot desactualizado',
                description: 'El último snapshot no coincide con los miembros actuales. Ajusta y guarda uno nuevo.',
                variant: 'destructive',
              });
            }
            const parsedPayload = parseCalculationPayload(latestSnapshotResponse.snapshot.payload_json);
            if (parsedPayload?.excluded_heir_ids?.length) {
              setExcludedHeirs(parsedPayload.excluded_heir_ids);
            } else {
              setExcludedHeirs([]);
            }
            if (parsedPayload?.notes) {
              setSnapshotNote(parsedPayload.notes);
            }
            setEstateAmount(String(latestSnapshotResponse.snapshot.estate_amount ?? 0));
            setLawyerFeePercentage(String(latestSnapshotResponse.snapshot.lawyer_fee_percentage ?? 0));
            setLastSnapshotAt(latestSnapshotResponse.snapshot.created_at || null);
          } else {
            setLastSnapshotAt(null);
          }
        } catch {
          // Snapshot endpoint puede no existir temporalmente en backend local viejo.
          setLastSnapshotAt(null);
        }
        setLoadingMessage('Renderizando panel de explicación...');
      } catch (error) {
        toast({
          title: 'No se pudo cargar la explicación Sienna',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const grossAmount = Number(estateAmount || 0);
  const feePercentage = Math.min(100, Math.max(0, Number(lawyerFeePercentage || 0)));
  const lawyerFee = grossAmount * (feePercentage / 100);
  const netAmount = Math.max(0, grossAmount - lawyerFee);
  const plan = useMemo(() => buildDominicanInheritancePlan(members, genealogy), [genealogy, members]);
  const photosByName = useMemo(() => heirPhotoByName(heirs), [heirs]);

  const documentsByHeir = useMemo(() => {
    const grouped = new Map<string, EvidenceDocument[]>();
    documents.forEach((document) => {
      const key = document.related_member_id
        ? `member:${document.related_member_id}`
        : document.related_heir_name
          ? `name:${normalizeName(document.related_heir_name)}`
          : null;
      if (!key) return;
      grouped.set(key, [...(grouped.get(key) || []), document]);
    });
    return grouped;
  }, [documents]);

  const includedTotal = plan.activeHeirs
    .filter((share) => !excludedHeirs.includes(share.member.id))
    .reduce((sum, share) => sum + share.share, 0);
  const distributedTotal = plan.activeHeirs.reduce((sum, share) => sum + share.share, 0);
  const isRenormalizedSimulation = excludedHeirs.length > 0;

  const briefs = useMemo<HeirBrief[]>(
    () =>
      plan.activeHeirs.map((share) => {
        const excluded = excludedHeirs.includes(share.member.id);
        const simulatedShare = resolveHeirSimulatedShare(share.share, {
          excluded,
          excludedHeirIds: excludedHeirs,
          includedTotal,
        });
        const heirDocs =
          documentsByHeir.get(`member:${share.member.id}`) ||
          documentsByHeir.get(`name:${normalizeName(share.member.name)}`) ||
          [];
        return {
          share,
          documents: heirDocs,
          simulatedShare,
          simulatedAmount: calculateHeirAmount(simulatedShare, netAmount),
          photo: photosByName.get(normalizeName(share.member.name)) || null,
          traffic: evaluateEvidenceSupport(heirDocs, share.member, members),
        };
      }),
    [documentsByHeir, excludedHeirs, includedTotal, members, netAmount, photosByName, plan.activeHeirs]
  );

  const trafficSummary = useMemo(
    () => ({
      green: briefs.filter((brief) => brief.traffic.level === 'green').length,
      amber: briefs.filter((brief) => brief.traffic.level === 'amber').length,
      red: briefs.filter((brief) => brief.traffic.level === 'red').length,
    }),
    [briefs]
  );

  const toggleHeir = (id: string) => {
    setExcludedHeirs((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const saveSnapshot = async () => {
    setSnapshotSaving(true);
    try {
      if (isAdmin) {
        await api.updateSettings({ lawyer_fee_percentage: feePercentage });
      }
      await api.saveSiennaCalculationSnapshot({
        estate_amount: grossAmount,
        lawyer_fee_percentage: feePercentage,
        distributable_amount: netAmount,
        members_hash: buildMembersHash(members.map((member) => member.id)),
        payload_json: JSON.stringify(
          buildCalculationPayload(
            plan,
            netAmount,
            snapshotNote || `Snapshot guardado desde Explicación Sienna. Excluidos: ${excludedHeirs.join(', ') || 'ninguno'}.`,
            excludedHeirs
          )
        ),
      });
      const latest = await api.getLatestSiennaCalculationSnapshot();
      setLastSnapshotAt(latest.snapshot?.created_at || null);
      toast({ title: 'Snapshot guardado', description: 'La explicación y el reparto quedaron auditables para futuras reuniones.' });
    } catch (error) {
      toast({
        title: 'No se pudo guardar el snapshot',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSnapshotSaving(false);
    }
  };

  const glossary = useMemo(
    () => buildCaseGlossary(briefs.map((brief) => brief.share.member.name)),
    [briefs]
  );

  return (
    <SiennaPageLayout className={`print:py-2 ${isPresentationMode ? 'max-w-none' : ''}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackButton wrapperClassName="" />
        <div className="flex flex-wrap gap-2">
          <Button variant={isPresentationMode ? 'default' : 'outline'} size="sm" onClick={() => setIsPresentationMode((current) => !current)}>
            {isPresentationMode ? 'Salir modo exposición' : 'Modo exposición'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/sienna/arbol-genealogico">Ver árbol Sienna</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir reunión
          </Button>
        </div>
      </div>

      <DocumentHeader
        title="Explicación Sienna para Herederos"
        subtitle="Por qué heredo, simulación, soporte documental y resumen para reunión"
        helpKey="sienna-explicacion"
      />

      <div className="w-full space-y-6">
        {loading && (
          <Card className="border border-legal-blue/20 bg-legal-blue/5">
            <CardContent className="p-4">
              <p className="inline-flex items-center gap-2 text-sm text-legal-blue">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingMessage}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Users className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Herederos calculados</p>
                <p className="text-2xl font-bold text-legal-blue">{briefs.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <ShieldCheck className="h-9 w-9 text-emerald-600" />
              <div>
                <p className="text-sm text-legal-gray">Sólidos</p>
                <p className="text-2xl font-bold text-emerald-700">{trafficSummary.green}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <AlertTriangle className="h-9 w-9 text-amber-600" />
              <div>
                <p className="text-sm text-legal-gray">En progreso / conflicto</p>
                <p className="text-2xl font-bold text-amber-700">{trafficSummary.amber + trafficSummary.red}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Landmark className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Neto simulado</p>
                <p className="text-2xl font-bold text-legal-blue">{formatMoney(netAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-legal-gold/20" id="resumen-ejecutivo">
          <CardHeader className="border-b bg-legal-blue/5">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Scale className="h-5 w-5" />
              Resumen ejecutivo para reunión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-gray-700">{legalCriterionText}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
              <div>
                <Label>Monto bruto del caso</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estateAmount}
                  onChange={(event) => setEstateAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>% firma de abogados</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={lawyerFeePercentage}
                  onChange={(event) => setLawyerFeePercentage(event.target.value)}
                />
              </div>
              <div className="rounded-md border border-legal-blue/15 bg-white p-3">
                <p className="text-xs uppercase text-legal-gray">Neto a repartir</p>
                <p className="font-bold text-legal-blue">{formatMoney(netAmount)}</p>
                <p className="text-xs text-legal-gray">Firma: {formatMoney(lawyerFee)}</p>
              </div>
              <Button variant="outline" onClick={saveSnapshot} disabled={snapshotSaving}>
                {snapshotSaving ? 'Guardando...' : 'Guardar snapshot Sienna'}
              </Button>
            </div>
            <div>
              <Label>Nota del snapshot (auditoría de reunión)</Label>
              <Input
                value={snapshotNote}
                onChange={(event) => setSnapshotNote(event.target.value)}
                placeholder="Ej: Escenario presentado a primos con exclusión temporal."
              />
            </div>
            <p className="text-xs text-legal-gray">
              Último snapshot: {lastSnapshotAt ? new Date(lastSnapshotAt).toLocaleString('es-DO') : 'sin registro'}
            </p>
            {isRenormalizedSimulation && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                Hay herederos excluidos en la simulación: los porcentajes se recalculan repartiendo el 100% del neto solo
                entre los incluidos. Debe coincidir con el árbol solo cuando no hay exclusiones.
              </p>
            )}
            {!isRenormalizedSimulation && distributedTotal < 99.95 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                El cálculo reparte {formatPercent(distributedTotal)} del caudal; el resto queda sin heredero vivo en alguna
                rama. Los montos usan ese porcentaje real (igual que en el árbol Sienna).
              </p>
            )}

            <div className="overflow-x-auto rounded-md border border-legal-blue/15">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-legal-blue/5 text-left text-legal-blue">
                  <tr>
                    <th className="p-3">Heredero</th>
                    <th className="p-3">%</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Ramas</th>
                    <th className="p-3">Cadena de pago</th>
                    <th className="p-3">Soporte</th>
                  </tr>
                </thead>
                <tbody>
                  {briefs.map((brief) => (
                    <tr key={brief.share.member.id} className="border-t border-legal-blue/10">
                      <td className="p-3 font-medium text-legal-blue">{brief.share.member.name}</td>
                      <td className="p-3">{formatPercent(brief.simulatedShare)}</td>
                      <td className="p-3">{formatMoney(brief.simulatedAmount)}</td>
                      <td className="p-3 text-xs text-legal-gray">{brief.share.sources.join(', ') || '-'}</td>
                      <td className="p-3 text-xs text-legal-gray">{routeSteps(brief.share).join(' -> ')}</td>
                      <td className="p-3">
                        <Badge className={brief.traffic.className}>{brief.traffic.label}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="por-que" className="space-y-4">
          <TabsList className="sienna-tabs-scroll h-auto">
            <TabsTrigger value="por-que" className="shrink-0 text-xs sm:text-sm">
              Por qué heredo
            </TabsTrigger>
            <TabsTrigger value="simulador" className="shrink-0 text-xs sm:text-sm">
              Simulador
            </TabsTrigger>
            <TabsTrigger value="documentos" className="shrink-0 text-xs sm:text-sm">
              Semáforo
            </TabsTrigger>
            <TabsTrigger value="tiempo" className="shrink-0 text-xs sm:text-sm">
              Línea de tiempo
            </TabsTrigger>
            <TabsTrigger value="glosario" className="shrink-0 text-xs sm:text-sm">
              Glosario
            </TabsTrigger>
            <TabsTrigger value="resumen" className="shrink-0 text-xs sm:text-sm">
              Reparto final
            </TabsTrigger>
          </TabsList>

          <TabsContent value="por-que" className="space-y-4">
            {loading && (
              <Card>
                <CardContent className="p-8 text-center text-legal-gray">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-legal-blue" />
                    {loadingMessage}
                  </span>
                </CardContent>
              </Card>
            )}
            {!loading &&
              briefs.map((brief) => (
                <Card key={brief.share.member.id} className="border border-legal-gold/20">
                  <CardContent className="grid gap-5 p-4 sm:p-5 sm:grid-cols-2 xl:grid-cols-[auto_1.2fr_1fr_minmax(0,220px)]">
                    <Avatar className="h-20 w-20 border-2 border-legal-gold/40">
                      {brief.photo?.photo_data && (
                        <AvatarImage src={brief.photo.photo_data} alt={brief.share.member.name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-legal-blue/10 font-semibold text-legal-blue">
                        {initials(brief.share.member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-xl font-bold text-legal-blue">{brief.share.member.name}</h3>
                        <Badge variant="outline">{formatPercent(brief.simulatedShare)}</Badge>
                        <Badge className={brief.traffic.className}>{brief.traffic.label}</Badge>
                      </div>
                      <p className="mt-3 rounded-md bg-legal-gold/10 p-3 text-sm leading-relaxed text-gray-800">
                        {buildWhyIInheritText(brief.share, brief.simulatedShare, brief.simulatedAmount)}
                      </p>
                      <p className="mt-2 text-xs text-legal-gray">{brief.share.paymentBasis}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-legal-blue">
                        <Route className="h-4 w-4" />
                        Ruta genealógica
                      </p>
                      <ul className="mt-2 space-y-1">
                        {routeSteps(brief.share).map((step, index) => (
                          <li key={`${brief.share.member.id}-route-${index}`} className="flex gap-2 text-sm text-gray-700">
                            <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-legal-gold" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3 rounded-md border border-legal-blue/15 bg-white p-4">
                      <div>
                        <p className="text-xs uppercase text-legal-gray">Monto estimado</p>
                        <p className="text-lg font-bold text-legal-blue">{formatMoney(brief.simulatedAmount)}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          downloadHeirBriefPdf(
                            {
                              ...brief,
                              photoData: brief.photo?.photo_data,
                            },
                            netAmount
                          )
                        }
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        PDF individual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="simulador">
            <Card className="border border-legal-gold/20">
              <CardHeader className="border-b bg-legal-blue/5">
                <CardTitle className="flex items-center gap-2 text-legal-blue">
                  <SlidersHorizontal className="h-5 w-5" />
                  Simulador visual de revisión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-700">
                  Incluya o excluya herederos para ver cómo cambian los porcentajes y montos antes de guardar cambios en el
                  árbol. Para modificar el árbol genealógico use{' '}
                  <Link to="/sienna/miembros-arbol" className="font-medium text-legal-blue underline">
                    Miembros del Árbol
                  </Link>
                  .
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {briefs.map((brief) => {
                    const included = !excludedHeirs.includes(brief.share.member.id);
                    return (
                      <div
                        key={brief.share.member.id}
                        className={`rounded-md border p-3 ${included ? 'border-legal-gold/40 bg-legal-gold/5' : 'border-legal-blue/15 opacity-70'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={included} onCheckedChange={() => toggleHeir(brief.share.member.id)} />
                            <div>
                              <p className="font-medium text-legal-blue">{brief.share.member.name}</p>
                              <p className="text-xs text-legal-gray">Base legal: {formatPercent(brief.share.share)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-legal-blue">{formatPercent(brief.simulatedShare)}</p>
                            <p className="text-xs text-legal-gray">{formatMoney(brief.simulatedAmount)}</p>
                          </div>
                        </div>
                        <Progress className="mt-3 h-2" value={brief.simulatedShare} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <div className="grid gap-4 md:grid-cols-2">
              {briefs.map((brief) => (
                <Card key={brief.share.member.id} className="border border-legal-gold/20">
                  <CardHeader className="border-b bg-legal-blue/5">
                    <CardTitle className="flex items-center justify-between gap-2 text-base text-legal-blue">
                      <span>{brief.share.member.name}</span>
                      <Badge className={brief.traffic.className}>{brief.traffic.label}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    <Progress value={brief.traffic.value} className="h-2" />
                    {brief.traffic.issues.map((issue) => (
                      <p key={issue} className="text-xs text-red-700">
                        {issue}
                      </p>
                    ))}
                    {brief.documents.length === 0 && (
                      <p className="text-sm text-legal-gray">No hay documentos asociados directamente a este heredero.</p>
                    )}
                    {brief.documents.map((document) => (
                      <div key={document.id} className="rounded-md border border-legal-blue/15 p-3">
                        <p className="flex items-center gap-2 font-medium text-legal-blue">
                          <FileText className="h-4 w-4" />
                          {document.title}
                        </p>
                        <p className="mt-1 text-xs text-legal-gray">
                          {document.document_type} · {document.event_date || 'Fecha pendiente'}
                          {document.confirms_heir ? ' · Confirma heredero' : ''}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tiempo">
            <div className="grid gap-4 lg:grid-cols-2">
              {briefs.map((brief) => {
                const timeline = buildMemberLifeTimeline(brief.share.member, brief.share, members, genealogy);
                return (
                  <Card key={brief.share.member.id} className="border border-legal-gold/20">
                    <CardHeader className="border-b bg-legal-blue/5">
                      <CardTitle className="flex items-center gap-2 text-base text-legal-blue">
                        <CalendarDays className="h-5 w-5" />
                        {brief.share.member.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5">
                      {timeline.map((event, index) => (
                        <div key={`${brief.share.member.id}-${index}`} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                event.kind === 'defuncion'
                                  ? 'bg-red-500'
                                  : event.kind === 'matrimonio'
                                    ? 'bg-legal-gold'
                                    : event.kind === 'vinculo'
                                      ? 'bg-legal-blue'
                                      : 'bg-emerald-500'
                              }`}
                            />
                            {index < timeline.length - 1 && <div className="mt-1 w-px flex-1 bg-legal-blue/20" />}
                          </div>
                          <div className="pb-2">
                            <p className="text-xs font-semibold uppercase text-legal-gray">{event.label}</p>
                            <p className="text-sm font-medium text-legal-blue">{event.date}</p>
                            {event.detail && <p className="text-sm text-gray-700">{event.detail}</p>}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="glosario">
            <div className="grid gap-4 md:grid-cols-2">
              {glossary.map((entry) => (
                <Card key={entry.term} className="border border-legal-gold/20">
                  <CardContent className="p-5">
                    <p className="flex items-center gap-2 font-serif text-lg font-bold text-legal-blue">
                      <BookOpen className="h-5 w-5" />
                      {entry.term}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{entry.text}</p>
                    <p className="mt-2 rounded-md bg-legal-blue/5 p-2 text-xs text-legal-gray">
                      <strong>Ejemplo en este caso:</strong> {entry.example}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resumen">
            <Card className="border border-legal-gold/20">
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border p-4">
                    <p className="text-xs uppercase text-legal-gray">Bruto</p>
                    <p className="text-xl font-bold text-legal-blue">{formatMoney(grossAmount)}</p>
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-xs uppercase text-legal-gray">Firma ({formatPercent(feePercentage)})</p>
                    <p className="text-xl font-bold text-legal-blue">{formatMoney(lawyerFee)}</p>
                  </div>
                  <div className="rounded-md border border-legal-gold/30 bg-legal-gold/5 p-4">
                    <p className="text-xs uppercase text-legal-gray">Neto final explicado</p>
                    <p className="text-xl font-bold text-legal-blue">{formatMoney(netAmount)}</p>
                  </div>
                </div>
                <p className="text-sm text-legal-gray">
                  {briefs.filter((b) => !excludedHeirs.includes(b.share.member.id)).length} herederos incluidos en el
                  reparto simulado.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SiennaPageLayout>
  );
};

export default ExplicacionHerederosSienna;
