import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { api, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle, BookOpen, CalendarDays, FileDown, FileText, Landmark, Printer, Route, Scale, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import { buildDominicanInheritancePlan, InheritanceShare, legalCriterionText, normalizeName } from '@/lib/dominicanInheritance';

type HeirBrief = {
  share: InheritanceShare;
  documents: EvidenceDocument[];
  simulatedShare: number;
  simulatedAmount: number;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount || 0);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value || 0) + '%';

const evidenceState = (documents: EvidenceDocument[]) => {
  if (documents.length >= 2) return { label: 'Sólido', value: 100, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (documents.length === 1) return { label: 'En progreso', value: 62, className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'Falta soporte', value: 28, className: 'border-red-200 bg-red-50 text-red-700' };
};

const glossary = [
  ['Causante', 'Persona cuyo patrimonio se distribuye. En este expediente, Alessandro de Paola Sangiovanni.'],
  ['Representación', 'Un descendiente ocupa el lugar de su ascendiente fallecido dentro de una rama familiar.'],
  ['Estirpe', 'Rama familiar que recibe una cuota y luego la divide entre sus descendientes llamados a heredar.'],
  ['Vocación sucesoral', 'Razón familiar y jurídica por la que una persona puede recibir una parte de la herencia.'],
  ['Rama colateral', 'Línea que no baja directamente del causante, pero puede entrar cuando no hay descendencia directa documentada.'],
];

const routeSteps = (share: InheritanceShare) =>
  share.route
    .split('|')
    .flatMap((route) => route.split('->').map((item) => item.trim()))
    .filter(Boolean);

const printBrief = (brief: HeirBrief, netAmount: number) => {
  const documentLines = brief.documents.length
    ? brief.documents.map((document) => '- ' + document.title + ' (' + document.document_type + ')').join('\n')
    : '- Documentos pendientes de asociar en el expediente.';
  const content = [
    'Ficha explicativa de heredero',
    '',
    'Heredero: ' + brief.share.member.name,
    'Porcentaje: ' + formatPercent(brief.simulatedShare),
    'Monto estimado: ' + formatMoney(brief.simulatedAmount),
    'Neto usado: ' + formatMoney(netAmount),
    '',
    'Base de cálculo:',
    brief.share.reason,
    brief.share.paymentBasis,
    '',
    'Ruta genealógica:',
    brief.share.route,
    '',
    'Documentos:',
    documentLines,
  ].join('\n');
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write('<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.5;">' + content + '</pre>');
  printWindow.document.close();
  printWindow.print();
};

const ExplicacionHerederosSienna = () => {
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [estateAmount, setEstateAmount] = useState('');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [excludedHeirs, setExcludedHeirs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [membersResponse, documentsResponse, settingsResponse] = await Promise.all([
          api.listSiennaFamilyMembers(),
          api.listEvidenceDocuments(),
          api.getSettings(),
        ]);
        setMembers(membersResponse.members);
        setDocuments(documentsResponse.documents);
        setLawyerFeePercentage(String(settingsResponse.settings.lawyer_fee_percentage ?? 0));
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
  const plan = useMemo(() => buildDominicanInheritancePlan(members), [members]);

  const documentsByHeir = useMemo(() => {
    const grouped = new Map<string, EvidenceDocument[]>();
    documents.forEach((document) => {
      if (!document.related_heir_name) return;
      const key = normalizeName(document.related_heir_name);
      grouped.set(key, [...(grouped.get(key) || []), document]);
    });
    return grouped;
  }, [documents]);

  const includedTotal = plan.activeHeirs
    .filter((share) => !excludedHeirs.includes(share.member.id))
    .reduce((sum, share) => sum + share.share, 0);

  const briefs = useMemo<HeirBrief[]>(
    () =>
      plan.activeHeirs.map((share) => {
        const excluded = excludedHeirs.includes(share.member.id);
        const simulatedShare = excluded || includedTotal <= 0 ? 0 : (share.share / includedTotal) * 100;
        return {
          share,
          documents: documentsByHeir.get(normalizeName(share.member.name)) || [],
          simulatedShare,
          simulatedAmount: netAmount * (simulatedShare / 100),
        };
      }),
    [documentsByHeir, excludedHeirs, includedTotal, netAmount, plan.activeHeirs]
  );

  const supportedCount = briefs.filter((brief) => brief.documents.length > 0).length;
  const pendingSupport = Math.max(0, briefs.length - supportedCount);

  const toggleHeir = (id: string) => {
    setExcludedHeirs((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>

      <DocumentHeader
        title="Explicación Sienna para Herederos"
        subtitle="Resumen claro, fichas individuales, simulación y soporte documental del reparto"
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-legal-gold/20"><CardContent className="flex items-center gap-3 p-5"><Users className="h-9 w-9 text-legal-blue" /><div><p className="text-sm text-legal-gray">Herederos calculados</p><p className="text-2xl font-bold text-legal-blue">{briefs.length}</p></div></CardContent></Card>
          <Card className="border border-legal-gold/20"><CardContent className="flex items-center gap-3 p-5"><ShieldCheck className="h-9 w-9 text-legal-blue" /><div><p className="text-sm text-legal-gray">Con soporte</p><p className="text-2xl font-bold text-legal-blue">{supportedCount}</p></div></CardContent></Card>
          <Card className="border border-legal-gold/20"><CardContent className="flex items-center gap-3 p-5"><AlertTriangle className="h-9 w-9 text-legal-blue" /><div><p className="text-sm text-legal-gray">Pendientes</p><p className="text-2xl font-bold text-legal-blue">{pendingSupport}</p></div></CardContent></Card>
          <Card className="border border-legal-gold/20"><CardContent className="flex items-center gap-3 p-5"><Landmark className="h-9 w-9 text-legal-blue" /><div><p className="text-sm text-legal-gray">Neto simulado</p><p className="text-2xl font-bold text-legal-blue">{formatMoney(netAmount)}</p></div></CardContent></Card>
        </div>

        <Card className="border border-legal-gold/20">
          <CardHeader className="border-b bg-legal-blue/5">
            <CardTitle className="flex items-center gap-2 text-legal-blue"><Scale className="h-5 w-5" />Resumen ejecutivo del reparto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-gray-700">{legalCriterionText}</p>
            <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
              <div>
                <Label>Monto bruto para explicar</Label>
                <Input type="number" min="0" step="0.01" value={estateAmount} onChange={(event) => setEstateAmount(event.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>% firma de abogados</Label>
                <Input type="number" min="0" max="100" step="0.01" value={lawyerFeePercentage} onChange={(event) => setLawyerFeePercentage(event.target.value)} />
              </div>
              <div className="rounded-md border border-legal-blue/15 bg-white p-3">
                <p className="text-xs uppercase text-legal-gray">Neto explicado</p>
                <p className="font-bold text-legal-blue">{formatMoney(netAmount)}</p>
                <p className="text-xs text-legal-gray">Firma: {formatMoney(lawyerFee)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="herederos" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="herederos">Herederos</TabsTrigger>
            <TabsTrigger value="simulador">Simulador</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="tiempo">Tiempo</TabsTrigger>
            <TabsTrigger value="glosario">Glosario</TabsTrigger>
          </TabsList>

          <TabsContent value="herederos" className="space-y-4">
            {loading && <Card><CardContent className="p-8 text-center text-legal-gray">Cargando explicación...</CardContent></Card>}
            {!loading && briefs.map((brief) => {
              const state = evidenceState(brief.documents);
              return (
                <Card key={brief.share.member.id} className="border border-legal-gold/20">
                  <CardContent className="grid gap-5 p-5 lg:grid-cols-[1.1fr_1fr_220px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-xl font-bold text-legal-blue">{brief.share.member.name}</h3>
                        <Badge variant="outline">{formatPercent(brief.simulatedShare)}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{brief.share.reason}</p>
                      <div className="mt-3 rounded-md bg-legal-blue/5 p-3 text-sm text-legal-gray">{brief.share.paymentBasis}</div>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-legal-blue"><Route className="h-4 w-4" />Ruta genealógica</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{brief.share.route}</p>
                    </div>
                    <div className="space-y-3 rounded-md border border-legal-blue/15 bg-white p-4">
                      <div><p className="text-xs uppercase text-legal-gray">Monto estimado</p><p className="text-lg font-bold text-legal-blue">{formatMoney(brief.simulatedAmount)}</p></div>
                      <div><div className="mb-2 flex items-center justify-between"><span className="text-xs uppercase text-legal-gray">Soporte</span><Badge className={state.className}>{state.label}</Badge></div><Progress value={state.value} /></div>
                      <Button variant="outline" className="w-full" onClick={() => printBrief(brief, netAmount)}><Printer className="mr-2 h-4 w-4" />Imprimir ficha</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="simulador">
            <Card className="border border-legal-gold/20">
              <CardHeader className="border-b bg-legal-blue/5"><CardTitle className="flex items-center gap-2 text-legal-blue"><SlidersHorizontal className="h-5 w-5" />Simulador de revisión</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-700">Marca temporalmente un heredero como incluido o no incluido para explicar una revisión sin guardar cambios.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {briefs.map((brief) => (
                    <div key={brief.share.member.id} className="flex items-center justify-between rounded-md border border-legal-blue/15 p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={!excludedHeirs.includes(brief.share.member.id)} onCheckedChange={() => toggleHeir(brief.share.member.id)} />
                        <div><p className="font-medium text-legal-blue">{brief.share.member.name}</p><p className="text-xs text-legal-gray">Base: {formatPercent(brief.share.share)}</p></div>
                      </div>
                      <div className="text-right"><p className="font-semibold text-legal-blue">{formatPercent(brief.simulatedShare)}</p><p className="text-xs text-legal-gray">{formatMoney(brief.simulatedAmount)}</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <div className="grid gap-4 md:grid-cols-2">
              {briefs.map((brief) => {
                const state = evidenceState(brief.documents);
                return (
                  <Card key={brief.share.member.id} className="border border-legal-gold/20">
                    <CardHeader className="border-b bg-legal-blue/5"><CardTitle className="flex items-center justify-between gap-2 text-base text-legal-blue"><span>{brief.share.member.name}</span><Badge className={state.className}>{state.label}</Badge></CardTitle></CardHeader>
                    <CardContent className="space-y-3 p-5">
                      {brief.documents.length === 0 && <p className="text-sm text-legal-gray">No hay documentos asociados directamente a este heredero.</p>}
                      {brief.documents.map((document) => (
                        <div key={document.id} className="rounded-md border border-legal-blue/15 p-3">
                          <p className="flex items-center gap-2 font-medium text-legal-blue"><FileText className="h-4 w-4" />{document.title}</p>
                          <p className="mt-1 text-xs text-legal-gray">{document.document_type} · {document.event_date || 'Fecha pendiente'}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="tiempo">
            <div className="grid gap-4 lg:grid-cols-2">
              {briefs.map((brief) => (
                <Card key={brief.share.member.id} className="border border-legal-gold/20">
                  <CardHeader className="border-b bg-legal-blue/5"><CardTitle className="flex items-center gap-2 text-base text-legal-blue"><CalendarDays className="h-5 w-5" />{brief.share.member.name}</CardTitle></CardHeader>
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      {routeSteps(brief.share).map((item, index) => (
                        <div key={brief.share.member.id + '-' + index} className="flex gap-3"><div className="mt-1 h-3 w-3 rounded-full bg-legal-gold" /><p className="text-sm text-gray-700">{item}</p></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="glosario">
            <div className="grid gap-4 md:grid-cols-2">
              {glossary.map(([term, text]) => (
                <Card key={term} className="border border-legal-gold/20"><CardContent className="p-5"><p className="flex items-center gap-2 font-serif text-lg font-bold text-legal-blue"><BookOpen className="h-5 w-5" />{term}</p><p className="mt-2 text-sm leading-relaxed text-gray-700">{text}</p></CardContent></Card>
              ))}
              <Card className="border border-legal-gold/20 md:col-span-2"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-serif text-lg font-bold text-legal-blue">Paquete para reunión</p><p className="text-sm text-legal-gray">Fichas individuales, resumen ejecutivo, semáforo documental y línea de tiempo.</p></div><Button variant="outline" onClick={() => window.print()}><FileDown className="mr-2 h-4 w-4" />Imprimir pantalla</Button></CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExplicacionHerederosSienna;
