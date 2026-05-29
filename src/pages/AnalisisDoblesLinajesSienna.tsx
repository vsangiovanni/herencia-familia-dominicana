import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import MemberVerificationBadge from '@/components/sienna/MemberVerificationBadge';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import MemberDetailSheet from '@/components/sienna/MemberDetailSheet';
import { MemberNameWithDeceased } from '@/components/sienna/MemberDeceasedIndicator';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { useConfirmedHeirs, useSiennaWorkspace } from '@/hooks/useSiennaData';
import { api, DualLineageCase, DualLineageIssue, DualLineageRoute, SiennaFamilyMember } from '@/lib/api';
import { buildMemberPhotoLookup, MemberPhotoLookup } from '@/lib/memberPhotos';
import { SiennaGenealogyBundle } from '@/lib/siennaGenealogy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatMoney, formatPercent } from '@/lib/siennaHeirExplain';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitMerge,
  Landmark,
  Link2,
  Network,
  Pencil,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  Split,
  Users,
} from 'lucide-react';

type InheritanceFilter = 'all' | 'heirs' | 'link';

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

const formatDate = (value: string) =>
  new Date(value).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });

const resolveSourceAmounts = (item: DualLineageCase) =>
  item.source_amounts?.length ? item.source_amounts : [];

const KpiTile = ({
  label,
  className,
  children,
  tone = 'default',
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
  tone?: 'default' | 'gold';
}) => (
  <div
    className={cn(
      'flex h-full min-h-[5.5rem] flex-col rounded-md border p-3 sm:min-h-[6rem] sm:p-4',
      tone === 'gold'
        ? 'border-legal-gold/30 bg-legal-gold/5'
        : 'border-legal-blue/15 bg-white',
      className
    )}
  >
    <p className="text-[11px] font-medium uppercase tracking-wide text-legal-gray sm:text-xs">{label}</p>
    <div className="mt-1 flex flex-1 flex-col justify-center">{children}</div>
  </div>
);

const BranchRepartitionPanel = ({ item, className }: { item: DualLineageCase; className?: string }) => {
  const rows = resolveSourceAmounts(item);

  return (
    <KpiTile label="Reparto por rama" className={cn('min-h-0', className)}>
      {rows.length ? (
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.source}
              className="rounded-md border border-legal-blue/10 bg-legal-blue/[0.02] p-2.5 sm:p-3"
            >
              <Badge variant="outline" className={cn('max-w-full truncate', sourceClass(row.source))}>
                {row.source}
              </Badge>
              <p className="mt-1.5 break-words text-base font-bold leading-tight text-legal-blue sm:text-lg">
                {row.amount > 0 ? formatMoney(row.amount) : '—'}
              </p>
              <p className="text-[11px] text-legal-gray sm:text-xs">
                {formatPercent(row.share_percent)} del caudal neto
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-legal-gray">Sin cuota activa en el cálculo</p>
      )}
    </KpiTile>
  );
};

const TotalInheritanceKpi = ({ item, className }: { item: DualLineageCase; className?: string }) => (
  <KpiTile label="Monto total heredado" tone="gold" className={className}>
    {item.inheritance_amount != null && item.inheritance_amount > 0 ? (
      <>
        <p className="break-words text-xl font-bold leading-tight text-legal-blue sm:text-2xl">
          {formatMoney(item.inheritance_amount)}
        </p>
        <p className="mt-1 text-[11px] text-legal-gray sm:text-xs">
          {item.inheritance_share != null
            ? `${formatPercent(item.inheritance_share)} del caudal neto`
            : 'Cuota activa'}
        </p>
      </>
    ) : (
      <p className="text-sm font-semibold text-legal-blue sm:text-base">Vínculo sin cuota</p>
    )}
  </KpiTile>
);

const ConvergenceKpi = ({ item, className }: { item: DualLineageCase; className?: string }) => (
  <KpiTile label="Convergencia" className={className}>
    <div className="grid h-full grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="flex flex-col justify-center rounded-md border border-legal-blue/10 bg-legal-blue/[0.02] p-2.5 sm:p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-legal-gray sm:text-xs">
          Rutas detectadas
        </p>
        <p className="mt-1 text-xl font-bold text-legal-blue sm:text-2xl">{item.route_count}</p>
      </div>
      <div className="flex flex-col justify-center rounded-md border border-legal-blue/10 bg-legal-blue/[0.02] p-2.5 sm:p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-legal-gray sm:text-xs">
          Punto de convergencia
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-legal-blue sm:text-base">
          {item.convergence_point?.name || 'Por revisar'}
        </p>
      </div>
    </div>
  </KpiTile>
);

const dualCaseInherits = (item: DualLineageCase) =>
  item.inherits ?? Boolean(item.calculation_routes?.length);

const matchesInheritanceFilter = (item: DualLineageCase, filter: InheritanceFilter) => {
  if (filter === 'all') return true;
  if (filter === 'heirs') return dualCaseInherits(item);
  return !dualCaseInherits(item);
};

const InheritanceRoleBadge = ({ item, className }: { item: DualLineageCase; className?: string }) =>
  dualCaseInherits(item) ? (
    <Badge className={cn('max-w-full whitespace-normal bg-legal-gold text-white hover:bg-legal-gold/90', className)}>
      <Landmark className="mr-1 h-3 w-3 shrink-0" />
      Hereda
      {item.inheritance_share != null ? ` · ${formatPercent(item.inheritance_share)}` : ''}
    </Badge>
  ) : (
    <Badge variant="secondary" className={cn('max-w-full whitespace-normal bg-legal-blue/10 text-legal-blue', className)}>
      <Link2 className="mr-1 h-3 w-3 shrink-0" />
      Vínculo
    </Badge>
  );

const RouteRail = ({ route, photoLookup }: { route: DualLineageRoute; photoLookup?: MemberPhotoLookup }) => (
  <div className="min-w-0 rounded-md border border-legal-blue/15 bg-white p-3 sm:p-4">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <Badge variant="outline" className={cn('max-w-full whitespace-normal', sourceClass(route.source))}>
        {route.source}
      </Badge>
      <span className="text-xs font-medium text-legal-gray">{route.depth} generaciones</span>
    </div>
    <div className="space-y-2">
      {route.path.map((node, index) => (
        <div key={route.source + '-' + node.id + '-' + index} className="flex min-w-0 items-start gap-2">
          <div
            className={
              'mt-1.5 h-3 w-3 shrink-0 rounded-full ' +
              (index === 0 ? 'bg-legal-blue' : node.is_deceased ? 'bg-gray-500' : 'bg-legal-gold')
            }
          />
          <div className="min-w-0 flex-1 rounded-md border border-legal-blue/10 bg-legal-blue/[0.025] px-2.5 py-1.5">
            <div className="flex items-start gap-2">
              <MemberPhoto
                name={node.name}
                memberId={node.id}
                lookup={photoLookup}
                size="xs"
              />
              <div className="min-w-0 flex-1">
            <MemberNameWithDeceased
              name={node.name}
              isDeceased={node.is_deceased}
              death={node.death}
              compact
              wrap
              nameClassName="text-sm font-medium text-legal-blue"
            />
            {(node.birth || node.death) && (
              <p className="text-[11px] text-legal-gray">
                {node.birth ? 'n. ' + node.birth : ''}
                {node.birth && node.death ? ' · ' : ''}
                {node.death ? 'm. ' + node.death : ''}
              </p>
            )}
              </div>
            </div>
          </div>
          {index < route.path.length - 1 && (
            <ArrowRight className="mt-1.5 hidden h-3.5 w-3.5 shrink-0 text-legal-gold sm:block" />
          )}
        </div>
      ))}
    </div>
  </div>
);

const IssueList = ({ issues }: { issues: DualLineageIssue[] }) => {
  if (!issues.length) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        No hay inconsistencias directas marcadas.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className={'rounded-md border p-3 ' + (severityClass[issue.severity] || severityClass.info)}
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            {issue.severity === 'critical' ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
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

const CaseDetail = ({
  item,
  members,
  genealogy,
  photoLookup,
  onOpenMember,
}: {
  item: DualLineageCase;
  members: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
  photoLookup?: MemberPhotoLookup;
  onOpenMember: (memberId: string) => void;
}) => {
  const left = item.routes[0];
  const right = item.routes[1];
  const memberRecord = members.find((row) => row.id === item.member.id);

  return (
    <Card className="overflow-hidden border border-legal-gold/25 shadow-sm">
      <CardHeader className="border-b bg-legal-blue/5 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex gap-3">
              <MemberPhoto
                name={item.member.name}
                memberId={item.member.id}
                lookup={photoLookup}
                size="lg"
                rounded="xl"
              />
              <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
              <MemberNameWithDeceased
                name={item.member.name}
                isDeceased={item.member.is_deceased}
                death={item.member.death}
                wrap
                nameClassName="font-serif text-lg font-bold text-legal-blue sm:text-xl"
                className="w-full min-w-0 sm:flex-1"
              />
              <InheritanceRoleBadge item={item} className="self-start text-xs sm:text-sm" />
            </div>
            {memberRecord && (
              <MemberVerificationBadge
                member={memberRecord}
                members={members}
                genealogy={genealogy}
                className="mt-1"
              />
            )}
            <p className="text-sm leading-relaxed text-legal-gray">{item.explanation}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button asChild variant="outline" size="sm" className="h-9 w-full justify-center">
              <Link to={item.tree_href}>
                <Network className="mr-2 h-4 w-4 shrink-0" />
                Abrir en árbol
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-center"
              onClick={() => onOpenMember(item.member.id)}
            >
              <Users className="mr-2 h-4 w-4 shrink-0" />
              Ficha
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 w-full justify-center">
              <Link to={item.edit_href}>
                <Pencil className="mr-2 h-4 w-4 shrink-0" />
                Editar vínculos
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 lg:grid-cols-3">
          <BranchRepartitionPanel item={item} className="md:col-span-2 lg:col-span-1" />
          <TotalInheritanceKpi item={item} />
          <ConvergenceKpi item={item} className="md:col-span-2 lg:col-span-1" />
        </div>

        <div className="rounded-md border border-legal-gold/30 bg-legal-gold/5 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-legal-blue">
            <GitMerge className="h-4 w-4" />
            Comparación visual de rutas
          </p>
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
            {left ? (
              <RouteRail route={left} photoLookup={photoLookup} />
            ) : (
              <div className="rounded-md border p-4 text-sm text-legal-gray">Ruta A no disponible.</div>
            )}
            <div className="hidden h-full min-h-32 items-center justify-center xl:flex">
              <div className="rounded-full border border-legal-gold/40 bg-white p-3 text-legal-gold shadow-sm">
                <Split className="h-6 w-6" />
              </div>
            </div>
            {right ? (
              <RouteRail route={right} photoLookup={photoLookup} />
            ) : (
              <div className="rounded-md border p-4 text-sm text-legal-gray">Ruta B no disponible.</div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-legal-blue">Ancestros compartidos</p>
            <div className="flex flex-wrap gap-2">
              {item.shared_ancestors.length ? (
                item.shared_ancestors.map((ancestor) => (
                  <div
                    key={ancestor.id}
                    className="inline-flex w-full max-w-full flex-wrap items-center gap-2 rounded-md border border-legal-blue/20 bg-white px-2.5 py-1.5 sm:w-auto"
                  >
                    <MemberPhoto
                      name={ancestor.name}
                      memberId={ancestor.id}
                      lookup={photoLookup}
                      size="xs"
                    />
                    <MemberNameWithDeceased
                      name={ancestor.name}
                      isDeceased={ancestor.is_deceased}
                      death={ancestor.death}
                      compact
                      wrap
                      nameClassName="text-xs font-medium text-legal-blue"
                      className="min-w-0 flex-1"
                    />
                    <Badge variant="outline" className="text-[10px]">
                      {ancestor.route_count} rutas
                    </Badge>
                  </div>
                ))
              ) : (
                <span className="text-sm text-legal-gray">Sin ancestro compartido calculado.</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-legal-blue">Inconsistencias directas</p>
            <IssueList issues={item.issues} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const filterOptions: Array<{ id: InheritanceFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'heirs', label: 'Heredan' },
  { id: 'link', label: 'No heredan / Vínculo' },
];

const AnalisisDoblesLinajesSienna = () => {
  const { data: workspace } = useSiennaWorkspace(false);
  const { data: heirsData } = useConfirmedHeirs(false);
  const photoLookup = useMemo(
    () => buildMemberPhotoLookup(heirsData?.heirs ?? workspace?.heirs ?? []),
    [heirsData?.heirs, workspace?.heirs]
  );
  const members = workspace?.members ?? [];
  const genealogy = useMemo<SiennaGenealogyBundle>(
    () => ({
      unions: workspace?.unions ?? [],
      parent_links: workspace?.parent_links ?? [],
    }),
    [workspace?.parent_links, workspace?.unions]
  );
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sienna-dual-lineage-analysis'],
    queryFn: () => api.getSiennaDualLineageAnalysis(),
    staleTime: 30000,
  });
  const analysis = data?.analysis;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [inheritanceFilter, setInheritanceFilter] = useState<InheritanceFilter>('all');

  const searchFilteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    const cases = analysis?.dual_cases ?? [];
    const matchedCases = !query ? cases : cases.filter(
      (item) =>
        item.member.name.toLowerCase().includes(query) ||
        item.sources.join(' ').toLowerCase().includes(query) ||
        item.shared_ancestors.some((ancestor) => ancestor.name.toLowerCase().includes(query)) ||
        item.member.id.toLowerCase().includes(query)
    );
    return matchedCases.sort((left, right) =>
      left.member.name.localeCompare(right.member.name, 'es', { sensitivity: 'base' })
    );
  }, [analysis?.dual_cases, search]);

  const filterCounts = useMemo(
    () => ({
      all: searchFilteredCases.length,
      heirs: searchFilteredCases.filter((item) => dualCaseInherits(item)).length,
      link: searchFilteredCases.filter((item) => !dualCaseInherits(item)).length,
    }),
    [searchFilteredCases]
  );

  const filteredCases = useMemo(
    () => searchFilteredCases
      .filter((item) => matchesInheritanceFilter(item, inheritanceFilter))
      .sort((left, right) => left.member.name.localeCompare(right.member.name, 'es', { sensitivity: 'base' })),
    [inheritanceFilter, searchFilteredCases]
  );

  const selectedCase = useMemo(
    () => filteredCases.find((item) => item.member.id === selectedId) || filteredCases[0] || null,
    [filteredCases, selectedId]
  );
  const detailMember = useMemo(
    () => members.find((member) => member.id === detailMemberId) || null,
    [detailMemberId, members]
  );

  useEffect(() => {
    if (selectedId && filteredCases.some((item) => item.member.id === selectedId)) return;
    setSelectedId(filteredCases[0]?.member.id ?? null);
  }, [filteredCases, selectedId]);

  return (
    <SiennaPageLayout className="py-8">
      <BackButton />
      <DocumentHeader
        title="Análisis de Dobles Linajes"
        subtitle="Consola de auditoría visual para convergencias, rutas duplicadas, ancestros compartidos e inconsistencias"
        helpKey="sienna-dobles-linajes"
      />
      <SoftLoadingIndicator
        active={isLoading || isFetching}
        message="Analizando convergencias desde la base de datos..."
      />

      <div className="space-y-6">
        <section className="rounded-md border border-legal-blue/15 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-legal-gold/30 bg-white px-3 py-1 text-xs font-semibold uppercase text-legal-blue">
                <Sparkles className="h-3.5 w-3.5 text-legal-gold" />
                Auditoría genealógica del caso
              </p>
              <p className="max-w-3xl text-sm leading-relaxed text-gray-700">
                Esta sección no reemplaza el árbol. Usa el backend para auditar rutas, comparar linajes y
                dirigir correcciones controladas hacia Miembros del Árbol.
              </p>
            </div>
            <details className="rounded-md border border-legal-blue/10 bg-legal-blue/[0.02] px-3 py-2">
              <summary className="cursor-pointer list-none text-xs font-semibold uppercase text-legal-blue">Política de edición</summary>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-700">
                {analysis?.audit_policy.message ||
                  'Las correcciones se hacen desde Miembros del Árbol, sin modificar relaciones automáticamente.'}
              </p>
            </details>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {[
            ['Personas', analysis?.summary.members_total ?? 0, Users],
            ['Doble linaje', analysis?.summary.dual_lineage_total ?? 0, GitMerge],
            ['Inconsistencias', analysis?.summary.suspicious_total ?? 0, AlertTriangle],
            ['Críticas', analysis?.summary.critical_total ?? 0, ShieldAlert],
          ].map(([label, value, Icon]) => (
            <Card key={String(label)} className="border border-legal-gold/20">
              <CardContent className="flex min-h-[4.75rem] items-center gap-2 p-3 sm:min-h-[5.5rem] sm:gap-3 sm:p-4">
                <Icon className="h-6 w-6 shrink-0 text-legal-blue sm:h-8 sm:w-8" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-legal-gray sm:text-xs">{label as string}</p>
                  <p className="text-xl font-bold text-legal-blue sm:text-2xl">{String(value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-legal-blue/15">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-legal-gray" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, apellido, rama, ancestro o ID interno..."
                />
              </div>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={'mr-2 h-4 w-4 ' + (isFetching ? 'animate-spin' : '')} />
                Reanalizar DB
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={inheritanceFilter === option.id ? 'default' : 'outline'}
                  className={cn(
                    inheritanceFilter === option.id && option.id === 'heirs' && 'bg-legal-gold hover:bg-legal-gold/90',
                    inheritanceFilter === option.id && option.id === 'link' && 'bg-legal-blue hover:bg-legal-blue/90'
                  )}
                  onClick={() => setInheritanceFilter(option.id)}
                >
                  {option.label}
                  <Badge
                    variant="secondary"
                    className={cn(
                      'ml-2 border-0 bg-white/20 text-inherit',
                      inheritanceFilter !== option.id && 'bg-legal-blue/10 text-legal-blue'
                    )}
                  >
                    {filterCounts[option.id]}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {filteredCases.map((item) => (
                <button
                  key={item.member.id}
                  type="button"
                  onClick={() => setSelectedId(item.member.id)}
                  className={cn(
                    'w-full min-w-0 rounded-md border p-3 text-left transition sm:p-4',
                    selectedCase?.member.id === item.member.id
                      ? 'border-legal-gold bg-legal-gold/10 shadow-sm dark:bg-[#1B2A44]'
                      : 'border-legal-blue/15 bg-white hover:border-legal-gold/60 dark:bg-[#162338]'
                  )}
                >
                  <div className="flex gap-3">
                    <MemberPhoto
                      name={item.member.name}
                      memberId={item.member.id}
                      lookup={photoLookup}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <MemberNameWithDeceased
                          name={item.member.name}
                          isDeceased={item.member.is_deceased}
                          death={item.member.death}
                          compact
                          wrap
                          nameClassName="font-semibold text-legal-blue"
                          className="w-full min-w-0"
                        />
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                          {item.inheritance_amount != null && item.inheritance_amount > 0 ? (
                            <Badge
                              variant="outline"
                              className="max-w-full whitespace-normal border-legal-gold/50 bg-legal-gold/15 font-bold text-legal-blue dark:border-[#D4AF37]/70 dark:bg-[#D4AF37] dark:text-[#08101F] dark:shadow-[0_0_18px_rgb(212_175_55_/_0.24)]"
                            >
                              {formatMoney(item.inheritance_amount)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-legal-blue/10 text-legal-blue dark:bg-white/10 dark:text-[#F5F7FA]">
                              Vínculo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <InheritanceRoleBadge item={item} className="text-[11px] sm:text-xs" />
                        {item.sources.map((source) => (
                          <Badge
                            key={source}
                            variant="outline"
                            className={cn('max-w-full whitespace-normal text-[11px] sm:text-xs', sourceClass(source))}
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-legal-gray">
                        {item.route_count} rutas · {item.generation_depth} generaciones · {item.issues.length}{' '}
                        alerta(s)
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {!filteredCases.length && (
              <p className="rounded-md border border-dashed border-legal-blue/20 bg-legal-blue/[0.02] p-4 text-sm text-legal-gray">
                No hay casos de doble linaje con el filtro seleccionado.
              </p>
            )}
          </CardContent>
        </Card>

        {selectedCase ? (
          <CaseDetail
            item={selectedCase}
            members={members}
            genealogy={genealogy}
            photoLookup={photoLookup}
            onOpenMember={setDetailMemberId}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-legal-gray">
              No hay dobles linajes detectados con los filtros actuales.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-legal-blue/15">
            <CardHeader className="border-b bg-legal-blue/5">
              <CardTitle className="flex items-center gap-2 text-base text-legal-blue">
                <Route className="h-5 w-5" />
                Ancestros con más cruces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {(analysis?.top_ancestors ?? []).map((ancestor) => (
                <div
                  key={ancestor.id}
                  className="flex flex-col gap-2 rounded-md border border-legal-blue/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <MemberPhoto
                      name={ancestor.name}
                      memberId={ancestor.id}
                      lookup={photoLookup}
                      size="sm"
                    />
                    <span className="min-w-0 break-words font-medium leading-snug text-legal-blue">{ancestor.name}</span>
                  </div>
                  <Badge variant="outline" className="self-start sm:shrink-0">
                    {ancestor.count} cruce(s)
                  </Badge>
                </div>
              ))}
              {!analysis?.top_ancestors?.length && (
                <p className="text-sm text-legal-gray">Sin cruces acumulados.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-legal-blue/15">
            <CardHeader className="border-b bg-legal-blue/5">
              <CardTitle className="flex items-center gap-2 text-base text-legal-blue">
                <AlertTriangle className="h-5 w-5" />
                Alertas globales
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[420px] space-y-2 overflow-auto p-4">
              <IssueList issues={analysis?.inconsistencies ?? []} />
            </CardContent>
          </Card>
        </div>

        {analysis?.generated_at && (
          <p className="text-xs text-legal-gray">Análisis generado: {formatDate(analysis.generated_at)}</p>
        )}
      </div>
      <MemberDetailSheet
        member={detailMember}
        members={members}
        genealogy={genealogy}
        heirs={heirsData?.heirs ?? workspace?.heirs ?? []}
        documents={workspace?.documents ?? []}
        photoLookup={photoLookup}
        open={Boolean(detailMember)}
        onOpenChange={(open) => !open && setDetailMemberId(null)}
      />
    </SiennaPageLayout>
  );
};

export default AnalisisDoblesLinajesSienna;
