import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { api, ConfirmedHeir, EvidenceDocument } from '@/lib/api';
import { useConfirmedHeirs, useSiennaCalculation, useSiennaWorkspace } from '@/hooks/useSiennaData';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  applySiennaCaseConfig,
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
import { buildInheritancePlanFromApiRows } from '@/lib/siennaCalculation';
import { buildSiennaDocumentSupportHref } from '@/lib/siennaSupportLinks';
import { resolveConfirmedHeirPhotoData } from '@/lib/memberPhotos';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  FileDown,
  FileText,
  GitBranch,
  GitMerge,
  Landmark,
  Loader2,
  Printer,
  Route,
  Scale,
  ShieldCheck,
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

const lineageRouteGroups = (share: InheritanceShare) => {
  if (share.sourceBreakdown.length) {
    return share.sourceBreakdown.map((segment) => ({
      source: segment.source,
      share: segment.share,
      routes: segment.routes.length ? segment.routes : [share.route],
    }));
  }

  return [
    {
      source: share.sources.join(' + ') || 'Ruta sucesoral',
      share: share.share,
      routes: [share.route],
    },
  ];
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const supportDocumentHref = (brief: HeirBrief) =>
  buildSiennaDocumentSupportHref(brief.share.member.id, 'heir-support');

const noDirectDocumentationNote =
  'Se mantiene considerado por el vínculo familiar y consanguíneo identificado en el expediente. Aún no cuenta con documentación directa asociada, por lo que el soporte debe completarse sin desconocer el reconocimiento provisional de su relación familiar.';

const PaymentChain = ({ steps }: { steps: string[] }) => {
  if (!steps.length) return <span className="text-legal-gray">Ruta pendiente</span>;
  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];
  const summary = steps.length > 1 ? `${firstStep} -> ${lastStep}` : firstStep;
  const generationCount = Math.max(steps.length - 1, 0);

  return (
    <details className="group max-w-[360px] rounded-md border border-legal-blue/15 bg-white open:bg-legal-blue/[0.03]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-legal-blue [&::-webkit-details-marker]:hidden">
        <Route className="h-3.5 w-3.5 shrink-0 text-legal-gold" />
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <span className="shrink-0 rounded-full bg-legal-gold/10 px-2 py-0.5 text-[11px] text-legal-blue">
          {generationCount} {generationCount === 1 ? 'generacion' : 'generaciones'}
        </span>
      </summary>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-legal-blue/10 px-3 py-2">
        {steps.map((step, index) => (
          <React.Fragment key={step + '-' + index}>
            <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-legal-blue/15 bg-legal-blue/5 px-2.5 py-1 text-xs font-medium text-legal-blue">
              {index === 0 ? (
                <Landmark className="h-3.5 w-3.5 shrink-0 text-legal-gold" />
              ) : index === steps.length - 1 ? (
                <Users className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <GitBranch className="h-3.5 w-3.5 shrink-0 text-legal-gold" />
              )}
              <span className="truncate">{step}</span>
            </span>
            {index < steps.length - 1 && <GitMerge className="h-4 w-4 shrink-0 text-legal-gold" />}
          </React.Fragment>
        ))}
      </div>
    </details>
  );
};

const SupportBadge = ({ brief, canOpenSupport = true }: { brief: HeirBrief; canOpenSupport?: boolean }) => {
  const needsSupport = brief.traffic.label === 'Falta soporte' || brief.traffic.label === 'En progreso';
  const badge = <Badge className={brief.traffic.className}>{brief.traffic.label}</Badge>;

  if (!needsSupport || !canOpenSupport) return badge;

  return (
    <Link
      to={supportDocumentHref(brief)}
      className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-gold focus-visible:ring-offset-2"
      title={brief.traffic.label === 'Falta soporte' ? 'Cargar soporte documental' : 'Completar soporte documental'}
    >
      {badge}
    </Link>
  );
};

const ExplicacionHerederosSienna = () => {
  const { hasAccess } = useAuth();
  const { data: workspace, isLoading, isFetching, refetch } = useSiennaWorkspace(false);
  const { data: heirsWithMedia } = useConfirmedHeirs(false);
  const members = workspace?.members ?? [];
  const documents = workspace?.documents ?? [];
  const heirs = heirsWithMedia?.heirs ?? workspace?.heirs ?? [];
  const canOpenDocumentSupport = hasAccess('/sienna/documentos');
  const genealogy = useMemo(
    () => ({
      unions: workspace?.unions ?? [],
      parent_links: workspace?.parent_links ?? [],
    }),
    [workspace]
  );
  const [estateAmount, setEstateAmount] = useState('');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [appliedEstateAmount, setAppliedEstateAmount] = useState('');
  const [appliedLawyerFeePercentage, setAppliedLawyerFeePercentage] = useState('0');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [workspaceInitialized, setWorkspaceInitialized] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos y cálculos de explicación...');

  useEffect(() => {
    if (!workspace || workspaceInitialized) return;

    applySiennaCaseConfig(workspace.settings.sienna_case_config);
    const defaultEstateAmount = String(workspace.settings.estate_amount ?? 0);
    const defaultLawyerFeePercentage = String(workspace.settings.lawyer_fee_percentage ?? 0);
    setEstateAmount(defaultEstateAmount);
    setLawyerFeePercentage(defaultLawyerFeePercentage);
    setAppliedEstateAmount(defaultEstateAmount);
    setAppliedLawyerFeePercentage(defaultLawyerFeePercentage);
    setWorkspaceInitialized(true);
  }, [workspace, workspaceInitialized]);

  useEffect(() => {
    if (isLoading) {
      setLoadingMessage('Consultando miembros, documentos, herederos y settings...');
      return;
    }
    if (isFetching) {
      setLoadingMessage('Actualizando datos de explicación...');
      return;
    }
    if (workspace) {
      setLoadingMessage('Renderizando panel de explicación...');
    }
  }, [isFetching, isLoading, workspace]);

  const loading = isLoading || !workspaceInitialized;

  const { data: realtimeCalculationData, isFetching: isFetchingCalculation, refetch: refetchCalculation } = useSiennaCalculation(
    appliedEstateAmount,
    appliedLawyerFeePercentage
  );
  const realtimeCalculation = realtimeCalculationData?.calculation;
  const {
    grossAmount = 0,
    lawyerFeePercentage: feePercentage = 0,
    lawyerFeeAmount: lawyerFee = 0,
    distributableAmount: netAmount = 0,
  } = realtimeCalculation?.estate ?? {};
  const apiRowsByMemberId = useMemo(
    () => new Map((realtimeCalculation?.active_heirs ?? []).map((row) => [row.member_id, row])),
    [realtimeCalculation?.active_heirs]
  );
  const plan = useMemo(
    () => buildInheritancePlanFromApiRows(realtimeCalculation?.active_heirs ?? [], members),
    [members, realtimeCalculation?.active_heirs]
  );
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

  const distributedTotal = Number(realtimeCalculation?.total_share ?? 0);

  const briefs = useMemo<HeirBrief[]>(
    () =>
      plan.activeHeirs.map((share) => {
        const apiRow = apiRowsByMemberId.get(share.member.id);
        const realtimeShare = Number(apiRow?.share_percent ?? share.share);
        const apiBackedShare: InheritanceShare = {
          ...share,
          share: realtimeShare,
          reason: apiRow?.reason ?? share.reason,
          route: apiRow?.route ?? share.route,
          paymentBasis: apiRow?.payment_basis ?? share.paymentBasis,
          sources: apiRow?.sources ?? share.sources,
          sourceBreakdown: apiRow?.source_breakdown ?? share.sourceBreakdown,
        };
        const heirDocs =
          documentsByHeir.get(`member:${share.member.id}`) ||
          documentsByHeir.get(`name:${normalizeName(share.member.name)}`) ||
          [];
        return {
          share: apiBackedShare,
          documents: heirDocs,
          simulatedShare: realtimeShare,
          simulatedAmount: Number(apiRow?.amount ?? 0),
          photo: photosByName.get(normalizeName(share.member.name)) || null,
          traffic: evaluateEvidenceSupport(heirDocs, share.member, members),
        };
      }).sort((left, right) => left.share.member.name.localeCompare(right.share.member.name, 'es', { sensitivity: 'base' })),
    [apiRowsByMemberId, documentsByHeir, members, photosByName, plan.activeHeirs]
  );

  const trafficSummary = useMemo(
    () => ({
      green: briefs.filter((brief) => brief.traffic.level === 'green').length,
      amber: briefs.filter((brief) => brief.traffic.level === 'amber').length,
      red: briefs.filter((brief) => brief.traffic.level === 'red').length,
    }),
    [briefs]
  );
  const hasPendingSimulationChanges =
    estateAmount !== appliedEstateAmount || lawyerFeePercentage !== appliedLawyerFeePercentage;

  const saveCalculationSettings = async () => {
    setSettingsSaving(true);
    try {
      const shouldRefetchCalculation =
        estateAmount === appliedEstateAmount && lawyerFeePercentage === appliedLawyerFeePercentage;
      setAppliedEstateAmount(estateAmount);
      setAppliedLawyerFeePercentage(lawyerFeePercentage);
      await refetch();
      if (shouldRefetchCalculation) {
        await refetchCalculation();
      }
      toast({ title: 'Cálculo actualizado', description: 'La explicación usa estos parámetros solo para esta pantalla.' });
    } catch (error) {
      toast({
        title: 'No se pudo actualizar el cálculo',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const downloadBriefPdf = async (brief: HeirBrief) => {
    try {
      const documentsWithMedia = await Promise.all(
        brief.documents.map(async (document) => {
          if (!document.id || document.file_data) return document;
          try {
            const response = await api.getEvidenceDocument(document.id);
            return response.document || document;
          } catch {
            return document;
          }
        })
      );

      await downloadHeirBriefPdf(
        {
          ...brief,
          documents: documentsWithMedia,
          photoData: resolveConfirmedHeirPhotoData(brief.photo),
        },
        netAmount
      );
    } catch (error) {
      toast({
        title: 'No se pudo generar el PDF',
        description: error instanceof Error ? error.message : 'Intente nuevamente.',
        variant: 'destructive',
      });
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
            <Link to="/sienna/arbol-genealogico">Ver árbol del caso</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir reunión
          </Button>
        </div>
      </div>

      <DocumentHeader
        title="Explicación para Herederos"
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
                <p className="text-sm text-legal-gray">Pendientes de documentación</p>
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
                <p className="mt-1 text-xs text-legal-gray">
                  Sobre el bruto. El default global se cambia solo en Settings.
                </p>
              </div>
              <div className="rounded-md border border-legal-blue/15 bg-white p-3">
                <p className="text-xs uppercase text-legal-gray">Neto a repartir</p>
                <p className="font-bold text-legal-blue">{formatMoney(netAmount)}</p>
                <p className="text-xs text-legal-gray">Firma: {formatMoney(lawyerFee)}</p>
              </div>
              <Button
                variant="outline"
                onClick={saveCalculationSettings}
                disabled={settingsSaving || isFetchingCalculation}
              >
                {settingsSaving ? 'Actualizando...' : 'Actualizar esta vista'}
              </Button>
            </div>
            <p className="text-xs text-legal-gray">
              Cálculo aplicado: {isFetchingCalculation
                ? 'actualizando desde la API...'
                : realtimeCalculation?.generated_at
                  ? new Date(realtimeCalculation.generated_at).toLocaleString('es-DO')
                  : 'pendiente de respuesta de la API'}
              {hasPendingSimulationChanges ? ' · cambios pendientes de aplicar' : ''}
            </p>
            {distributedTotal < 99.95 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                El cálculo reparte {formatPercent(distributedTotal)} del caudal; el resto queda sin heredero vivo en alguna
                rama. Los montos usan ese porcentaje real (igual que en el árbol del caso).
              </p>
            )}

            <div className="overflow-x-auto rounded-md border border-legal-blue/15">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-legal-blue/5 text-left text-legal-blue">
                  <tr>
                    <th className="min-w-[320px] p-3">Heredero</th>
                    <th className="p-3">%</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Ramas</th>
                    <th className="min-w-[280px] p-3">Cadena de pago</th>
                    <th className="min-w-[150px] p-3">Soporte</th>
                  </tr>
                </thead>
                <tbody>
                  {briefs.map((brief) => (
                    <tr key={brief.share.member.id} className="border-t border-legal-blue/10">
                      <td className="min-w-[320px] p-3">
                        <div className="flex items-center gap-2">
                          <MemberPhoto
                            name={brief.share.member.name}
                            memberId={brief.share.member.id}
                            photoData={resolveConfirmedHeirPhotoData(brief.photo)}
                            size="sm"
                            verificationStatus={brief.photo?.status === 'confirmado' ? 'verified' : 'pending'}
                          />
                          <span className="font-medium text-legal-blue">{brief.share.member.name}</span>
                        </div>
                      </td>
                      <td className="p-3">{formatPercent(brief.simulatedShare)}</td>
                      <td className="p-3">{formatMoney(brief.simulatedAmount)}</td>
                      <td className="p-3 text-xs text-legal-gray">{brief.share.sources.join(', ') || '-'}</td>
                      <td className="min-w-[280px] p-3 align-top">
                        <PaymentChain steps={routeSteps(brief.share)} />
                      </td>
                      <td className="min-w-[150px] p-3 align-top">
                        <SupportBadge brief={brief} canOpenSupport={canOpenDocumentSupport} />
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

          <TabsContent value="por-que" className="space-y-4 pb-24 sm:pb-0">
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
                  <CardContent className="grid items-start gap-5 p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(180px,auto)]">
                    <MemberPhoto
                      name={brief.share.member.name}
                      memberId={brief.share.member.id}
                      photoData={resolveConfirmedHeirPhotoData(brief.photo)}
                      size="lg"
                      className="border-2 border-legal-gold/40"
                      verificationStatus={brief.photo?.status === 'confirmado' ? 'verified' : 'pending'}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-serif text-xl font-bold leading-tight text-legal-blue">{brief.share.member.name}</h3>
                        {brief.share.member.death && (
                          <Badge variant="outline" className="border-gray-400 bg-gray-50 text-gray-800">
                            Fallecido
                          </Badge>
                        )}
                        <Badge variant="outline">{formatPercent(brief.simulatedShare)}</Badge>
                        <SupportBadge brief={brief} canOpenSupport={canOpenDocumentSupport} />
                      </div>
                      <p className="mt-3 whitespace-normal break-words rounded-md bg-legal-gold/10 p-3 text-sm leading-relaxed text-gray-800">
                        {buildWhyIInheritText(brief.share, brief.simulatedShare, brief.simulatedAmount)}
                      </p>
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-legal-blue">
                          Ver ruta genealógica y base
                        </summary>
                        <p className="mt-2 text-xs text-legal-gray">{brief.share.paymentBasis}</p>
                        <div className="mt-2 space-y-3">
                        {lineageRouteGroups(brief.share).map((group, groupIndex) => (
                          <div
                            key={`${brief.share.member.id}-lineage-${group.source}-${groupIndex}`}
                            className={brief.share.sourceBreakdown.length > 1 ? 'rounded-md border border-legal-gold/30 bg-legal-gold/5 p-2' : ''}
                          >
                            {(brief.share.sourceBreakdown.length > 1 || brief.share.sources.length > 1) && (
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <Badge variant={groupIndex === 0 ? 'default' : 'outline'}>{group.source}</Badge>
                                <Badge variant="outline">{formatPercent(group.share)}</Badge>
                              </div>
                            )}
                            {group.routes.map((route, routeIndex) => (
                              <ul key={`${brief.share.member.id}-lineage-route-${groupIndex}-${routeIndex}`} className="space-y-1">
                                {route
                                  .split('->')
                                  .map((step) => step.trim())
                                  .filter(Boolean)
                                  .map((step, stepIndex) => (
                                    <li
                                      key={`${brief.share.member.id}-lineage-step-${groupIndex}-${routeIndex}-${stepIndex}`}
                                      className="flex gap-2 text-sm text-gray-700"
                                    >
                                      <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-legal-gold" />
                                      {step}
                                    </li>
                                  ))}
                              </ul>
                            ))}
                          </div>
                        ))}
                        </div>
                      </details>
                    </div>
                    <div className="w-full space-y-3 rounded-md border border-legal-blue/15 bg-white p-4 md:w-auto md:min-w-[190px]">
                      <div>
                        <p className="text-xs uppercase text-legal-gray">Monto estimado</p>
                        <p className="text-lg font-bold text-legal-blue">{formatMoney(brief.simulatedAmount)}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="h-auto min-h-10 w-full whitespace-normal text-center leading-snug"
                        onClick={() => void downloadBriefPdf(brief)}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        PDF individual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="documentos">
            <div className="grid gap-4 md:grid-cols-2">
              {briefs.map((brief) => (
                <Card key={brief.share.member.id} className="border border-legal-gold/20">
                  <CardHeader className="border-b bg-legal-blue/5">
                    <CardTitle className="flex items-center justify-between gap-2 text-base text-legal-blue">
                      <span>{brief.share.member.name}</span>
                      <SupportBadge brief={brief} canOpenSupport={canOpenDocumentSupport} />
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
                      <div className="space-y-1 text-sm text-legal-gray">
                        <p>No hay documentos asociados directamente a este heredero.</p>
                        <p>{noDirectDocumentationNote}</p>
                        {canOpenDocumentSupport ? (
                          <Link to={supportDocumentHref(brief)} className="font-medium text-legal-blue underline">
                            Cargar soporte
                          </Link>
                        ) : (
                          <p className="text-xs font-medium text-legal-gray">Acceso a carga de soporte no disponible para este usuario.</p>
                        )}
                      </div>
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
                  {briefs.length} herederos incluidos por el cálculo sucesoral vigente de la API.
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
