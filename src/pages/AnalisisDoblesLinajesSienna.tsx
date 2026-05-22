import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { api, DualLineageCase, DualLineageIssue, DualLineageRoute } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ArrowRight, CheckCircle2, GitMerge, Network, Pencil, RefreshCw, Route, Search, ShieldAlert, Sparkles, Split, Users } from 'lucide-react';

const sourceClass = (source: string) => {
  const value = source.toLowerCase();
  if (value.includes('paolo') || value.includes('paulino')) return 'border-sky-300 bg-sky-50 text-sky-800';
  if (value.includes('vincenzo') || value.includes('vicente')) return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  return 'border-legal-gold/40 bg-legal-gold/10 text-legal-blue';
};

const severityClass: Record<string, string> = {
  critical: 'border-red-300 bg-red-50 text-red-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  info: 'border-legal-blue/20 bg-legal-blue/5 text-legal-blue',
};

const complexityClass: Record<string, string> = {
  alta: 'border-red-300 bg-red-50 text-red-800',
  media: 'border-amber-300 bg-amber-50 text-amber-900',
  baja: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });

const RouteRail = ({ route }: { route: DualLineageRoute }) => (
  <div className="rounded-md border border-legal-blue/15 bg-white p-3">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Badge variant="outline" className={sourceClass(route.source)}>{route.source}</Badge>
      <span className="text-xs font-medium text-legal-gray">{route.depth} generaciones</span>
    </div>
    <div className="space-y-2">
      {route.path.map((node, index) => (
        <div key={route.source + '-' + node.id + '-' + index} className="flex items-center gap-2">
          <div className={'h-3 w-3 shrink-0 rounded-full ' + (index === 0 ? 'bg-legal-blue' : node.is_deceased ? 'bg-gray-500' : 'bg-legal-gold')} />
          <div className="min-w-0 flex-1 rounded-md border border-legal-blue/10 bg-legal-blue/[0.025] px-2 py-1">
            <p className="truncate text-sm font-medium text-legal-blue">{node.name}</p>
            {(node.birth || node.death) && (
              <p className="text-[11px] text-legal-gray">
                {node.birth ? 'n. ' + node.birth : ''}
                {node.birth && node.death ? ' · ' : ''}
                {node.death ? 'm. ' + node.death : ''}
              </p>
            )}
          </div>
          {index < route.path.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-legal-gold" />}
        </div>
      ))}
    </div>
  </div>
);

const IssueList = ({ issues }: { issues: DualLineageIssue[] }) => {
  if (!issues.length) {
    return <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">No hay inconsistencias directas marcadas.</div>;
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div key={issue.id} className={'rounded-md border p-3 ' + (severityClass[issue.severity] || severityClass.info)}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            {issue.severity === 'critical' ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {issue.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed">{issue.detail}</p>
          {issue.action_href && (
            <Button asChild variant="outline" size="sm" className="mt-2 h-8 bg-white/70">
              <Link to={issue.action_href}>Corregir relación</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

const CaseDetail = ({ item }: { item: DualLineageCase }) => {
  const left = item.routes[0];
  const right = item.routes[1];

  return (
    <Card className="border border-legal-gold/25 shadow-sm">
      <CardHeader className="border-b bg-legal-blue/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-serif text-xl text-legal-blue">{item.member.name}</CardTitle>
            <p className="mt-1 text-sm text-legal-gray">{item.explanation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to={item.tree_href}><Network className="mr-2 h-4 w-4" />Abrir en árbol</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to={item.edit_href}><Pencil className="mr-2 h-4 w-4" />Editar vínculos</Link></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-legal-blue/15 bg-white p-3"><p className="text-xs uppercase text-legal-gray">Rutas detectadas</p><p className="text-2xl font-bold text-legal-blue">{item.route_count}</p></div>
          <div className="rounded-md border border-legal-blue/15 bg-white p-3"><p className="text-xs uppercase text-legal-gray">Profundidad</p><p className="text-2xl font-bold text-legal-blue">{item.generation_depth}</p></div>
          <div className="rounded-md border border-legal-blue/15 bg-white p-3"><p className="text-xs uppercase text-legal-gray">Convergencia</p><p className="text-sm font-semibold text-legal-blue">{item.convergence_point?.name || 'Por revisar'}</p></div>
          <div className={'rounded-md border p-3 ' + complexityClass[item.complexity_level]}><p className="text-xs uppercase">Complejidad</p><p className="text-xl font-bold capitalize">{item.complexity_level}</p><Progress value={item.complexity_score} className="mt-2 h-2 bg-white/70" /></div>
        </div>

        <div className="rounded-md border border-legal-gold/30 bg-legal-gold/5 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-legal-blue"><GitMerge className="h-4 w-4" />Comparación visual de rutas</p>
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
            {left ? <RouteRail route={left} /> : <div className="rounded-md border p-4 text-sm text-legal-gray">Ruta A no disponible.</div>}
            <div className="hidden h-full min-h-32 items-center justify-center xl:flex"><div className="rounded-full border border-legal-gold/40 bg-white p-3 text-legal-gold shadow-sm"><Split className="h-6 w-6" /></div></div>
            {right ? <RouteRail route={right} /> : <div className="rounded-md border p-4 text-sm text-legal-gray">Ruta B no disponible.</div>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-legal-blue">Ancestros compartidos</p>
            <div className="flex flex-wrap gap-2">
              {item.shared_ancestors.length ? item.shared_ancestors.map((ancestor) => (
                <Badge key={ancestor.id} variant="outline" className="border-legal-blue/20 bg-white text-legal-blue">{ancestor.name} · {ancestor.route_count} rutas</Badge>
              )) : <span className="text-sm text-legal-gray">Sin ancestro compartido calculado.</span>}
            </div>
          </div>
          <div><p className="mb-2 text-sm font-semibold text-legal-blue">Inconsistencias directas</p><IssueList issues={item.issues} /></div>
        </div>
      </CardContent>
    </Card>
  );
};

const AnalisisDoblesLinajesSienna = () => {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sienna-dual-lineage-analysis'],
    queryFn: () => api.getSiennaDualLineageAnalysis(),
    staleTime: 30000,
  });
  const analysis = data?.analysis;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    const cases = analysis?.dual_cases ?? [];
    if (!query) return cases;
    return cases.filter((item) =>
      item.member.name.toLowerCase().includes(query) ||
      item.sources.join(' ').toLowerCase().includes(query) ||
      item.shared_ancestors.some((ancestor) => ancestor.name.toLowerCase().includes(query)) ||
      item.member.id.toLowerCase().includes(query)
    );
  }, [analysis?.dual_cases, search]);

  const selectedCase = useMemo(
    () => filteredCases.find((item) => item.member.id === selectedId) || filteredCases[0] || null,
    [filteredCases, selectedId]
  );

  return (
    <SiennaPageLayout className="py-8">
      <BackButton />
      <DocumentHeader title="Análisis de Dobles Linajes" subtitle="Consola de auditoría visual para convergencias, rutas duplicadas, ancestros compartidos e inconsistencias" helpKey="sienna-dobles-linajes" />
      <SoftLoadingIndicator active={isLoading || isFetching} message="Analizando convergencias desde la base de datos..." />

      <div className="space-y-6">
        <section className="rounded-md border border-legal-blue/15 bg-gradient-to-br from-white via-legal-blue/[0.03] to-legal-gold/[0.08] p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-legal-gold/30 bg-white px-3 py-1 text-xs font-semibold uppercase text-legal-blue"><Sparkles className="h-3.5 w-3.5 text-legal-gold" />Debugger genealógico Sienna</p>
              <h2 className="font-serif text-2xl font-bold text-legal-blue md:text-3xl">Dobles rutas, convergencias y validación familiar en una sola vista</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">Esta sección no reemplaza el árbol. Usa el backend para auditar rutas, comparar linajes y dirigir correcciones controladas hacia Miembros del Árbol.</p>
            </div>
            <div className="rounded-md border border-legal-blue/10 bg-white p-4">
              <p className="text-xs uppercase text-legal-gray">Política de edición</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{analysis?.audit_policy.message || 'Las correcciones se hacen desde Miembros del Árbol, sin modificar relaciones automáticamente.'}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ['Personas', analysis?.summary.members_total ?? 0, Users],
            ['Doble linaje', analysis?.summary.dual_lineage_total ?? 0, GitMerge],
            ['Convergencias', analysis?.summary.convergence_total ?? 0, Network],
            ['Inconsistencias', analysis?.summary.suspicious_total ?? 0, AlertTriangle],
            ['Críticas', analysis?.summary.critical_total ?? 0, ShieldAlert],
            ['Pendientes', analysis?.summary.pending_validation_total ?? 0, CheckCircle2],
          ].map(([label, value, Icon]) => (
            <Card key={String(label)} className="border border-legal-gold/20">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-8 w-8 text-legal-blue" />
                <div><p className="text-xs text-legal-gray">{label as string}</p><p className="text-2xl font-bold text-legal-blue">{String(value)}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-legal-blue/15">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-legal-gray" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, apellido, rama, ancestro o ID interno..." />
              </div>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={'mr-2 h-4 w-4 ' + (isFetching ? 'animate-spin' : '')} />Reanalizar DB</Button>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredCases.map((item) => (
                <button key={item.member.id} type="button" onClick={() => setSelectedId(item.member.id)} className={'rounded-md border p-3 text-left transition ' + (selectedCase?.member.id === item.member.id ? 'border-legal-gold bg-legal-gold/10 shadow-sm' : 'border-legal-blue/15 bg-white hover:border-legal-gold/60')}>
                  <div className="flex items-start justify-between gap-2"><p className="font-semibold leading-tight text-legal-blue">{item.member.name}</p><Badge variant="outline" className={complexityClass[item.complexity_level]}>{item.complexity_level}</Badge></div>
                  <div className="mt-2 flex flex-wrap gap-1">{item.sources.map((source) => <Badge key={source} variant="outline" className={sourceClass(source)}>{source}</Badge>)}</div>
                  <p className="mt-2 text-xs text-legal-gray">{item.route_count} rutas · {item.generation_depth} generaciones · {item.issues.length} alerta(s)</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCase ? <CaseDetail item={selectedCase} /> : <Card><CardContent className="p-8 text-center text-legal-gray">No hay dobles linajes detectados con los filtros actuales.</CardContent></Card>}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-legal-blue/15">
            <CardHeader className="border-b bg-legal-blue/5"><CardTitle className="flex items-center gap-2 text-base text-legal-blue"><Route className="h-5 w-5" />Ancestros con más cruces</CardTitle></CardHeader>
            <CardContent className="space-y-2 p-4">
              {(analysis?.top_ancestors ?? []).map((ancestor) => (
                <div key={ancestor.id} className="flex items-center justify-between rounded-md border border-legal-blue/10 bg-white p-3"><span className="font-medium text-legal-blue">{ancestor.name}</span><Badge variant="outline">{ancestor.count} cruce(s)</Badge></div>
              ))}
              {!analysis?.top_ancestors?.length && <p className="text-sm text-legal-gray">Sin cruces acumulados.</p>}
            </CardContent>
          </Card>

          <Card className="border border-legal-blue/15">
            <CardHeader className="border-b bg-legal-blue/5"><CardTitle className="flex items-center gap-2 text-base text-legal-blue"><AlertTriangle className="h-5 w-5" />Alertas globales</CardTitle></CardHeader>
            <CardContent className="max-h-[420px] space-y-2 overflow-auto p-4"><IssueList issues={analysis?.inconsistencies ?? []} /></CardContent>
          </Card>
        </div>

        {analysis?.generated_at && <p className="text-xs text-legal-gray">Análisis generado: {formatDate(analysis.generated_at)}</p>}
      </div>
    </SiennaPageLayout>
  );
};

export default AnalisisDoblesLinajesSienna;

