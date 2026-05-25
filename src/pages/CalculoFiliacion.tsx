import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import TablePaginationControls from '@/components/TablePaginationControls';
import { useSiennaCalculation, useConfirmedHeirs, useSiennaWorkspace } from '@/hooks/useSiennaData';
import { applySiennaCaseConfig, normalizeName } from '@/lib/dominicanInheritance';
import { buildMemberPhotoLookup } from '@/lib/memberPhotos';
import { countGenealogyInconsistencies } from '@/lib/siennaGenealogy';
import { buildSiennaDocumentSupportHref } from '@/lib/siennaSupportLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GitBranch, Scale, UserCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

type DistributionLine = {
  line: string;
  branch: string;
  memberId: string;
  heir: string;
  route: string;
  percentage: number;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;

const extractBranch = (routes: string[]) => {
  const firstRoute = routes.find(Boolean) || '';
  const steps = firstRoute
    .split('->')
    .map((step) => step.trim())
    .filter(Boolean);
  return steps[1] || steps[0] || 'Sin rama identificada';
};

const prettyRoute = (routes: string[]) =>
  routes
    .map((route) =>
      route
        .split('->')
        .map((step) => step.trim())
        .filter(Boolean)
        .join(' → ')
    )
    .filter(Boolean)
    .join(' | ');

const LinkedSupportBadge = ({
  memberId,
  status,
}: {
  memberId?: string;
  status?: string | null;
}) => {
  const normalizedStatus = status || 'sin confirmar';
  const badge = (
    <Badge variant={normalizedStatus === 'confirmado' ? 'default' : 'secondary'}>
      {normalizedStatus}
    </Badge>
  );

  if (!memberId || normalizedStatus === 'confirmado') return badge;

  return (
    <Link
      to={buildSiennaDocumentSupportHref(memberId, 'heir-support')}
      className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-gold focus-visible:ring-offset-2"
      title="Completar soporte documental del heredero"
    >
      {badge}
    </Link>
  );
};

const CalculoFiliacion = () => {
  const { data: workspace } = useSiennaWorkspace(false);
  const { data: heirsWithPhotos } = useConfirmedHeirs(true);
  const confirmedHeirs = heirsWithPhotos?.heirs ?? workspace?.heirs ?? [];
  const members = workspace?.members ?? [];
  const unions = workspace?.unions ?? [];
  const parentLinks = workspace?.parent_links ?? [];
  const [estateAmount, setEstateAmount] = useState(0);
  const lawyerFeePercentage = Number(workspace?.settings?.lawyer_fee_percentage || 0);
  const { data: realtimeCalculationData, isFetching: isFetchingCalculation } = useSiennaCalculation(
    estateAmount,
    lawyerFeePercentage
  );
  const realtimeCalculation = realtimeCalculationData?.calculation;
  const [distributionPage, setDistributionPage] = useState(1);
  const [distributionPageSize, setDistributionPageSize] = useState(10);
  const [heirTotalsPage, setHeirTotalsPage] = useState(1);
  const [heirTotalsPageSize, setHeirTotalsPageSize] = useState(10);

  const genealogy = useMemo(
    () => ({ unions, parent_links: parentLinks }),
    [parentLinks, unions]
  );

  useEffect(() => {
    if (!workspace) return;
    applySiennaCaseConfig(workspace.settings?.sienna_case_config);
    setEstateAmount(Number(workspace.settings?.estate_amount || 0));
  }, [workspace]);

  const genealogyIssues = useMemo(() => countGenealogyInconsistencies(genealogy), [genealogy]);

  const distributionLines = useMemo<DistributionLine[]>(
    () => {
      return (realtimeCalculation?.active_heirs ?? [])
          .flatMap((row) => {
            const breakdown = row.source_breakdown?.length
              ? row.source_breakdown
              : [{ source: row.sources.join(' + ') || 'Sin línea', share: row.share_percent, routes: [row.route] }];
            return breakdown.map((segment) => ({
              line: segment.source,
              branch: extractBranch(segment.routes),
              memberId: row.member_id,
              heir: row.heir_name,
              route: prettyRoute(segment.routes),
              percentage: segment.share,
            }));
          })
          .sort(
            (left, right) =>
              left.heir.localeCompare(right.heir, 'es') ||
              left.line.localeCompare(right.line, 'es') ||
              right.percentage - left.percentage
          );
    },
    [realtimeCalculation?.active_heirs]
  );

  const totalsByHeir = useMemo(() => {
    return (realtimeCalculation?.active_heirs ?? [])
      .map((row) => ({
        heir: row.heir_name,
        memberId: row.member_id,
        percentage: Number(row.share_percent || 0),
        amount: Number(row.amount || 0),
        routes: row.source_breakdown?.reduce((total, segment) => total + Math.max(1, segment.routes?.length || 0), 0) || 1,
      }))
      .sort((a, b) => a.heir.localeCompare(b.heir, 'es', { sensitivity: 'base' }));
  }, [realtimeCalculation?.active_heirs]);

  const totalsByLine = useMemo(() => {
    const totals = new Map<string, number>();
    distributionLines.forEach((item) => {
      totals.set(item.line, (totals.get(item.line) || 0) + item.percentage);
    });

    return Array.from(totals.entries())
      .map(([line, percentage]) => ({ line, percentage }))
      .sort((a, b) => b.percentage - a.percentage || a.line.localeCompare(b.line, 'es'));
  }, [distributionLines]);

  const distributionTotalPages = Math.max(1, Math.ceil(distributionLines.length / distributionPageSize));
  const paginatedDistributionLines = useMemo(
    () => distributionLines.slice((distributionPage - 1) * distributionPageSize, distributionPage * distributionPageSize),
    [distributionLines, distributionPage, distributionPageSize]
  );
  const heirTotalsTotalPages = Math.max(1, Math.ceil(totalsByHeir.length / heirTotalsPageSize));
  const paginatedTotalsByHeir = useMemo(
    () => totalsByHeir.slice((heirTotalsPage - 1) * heirTotalsPageSize, heirTotalsPage * heirTotalsPageSize),
    [heirTotalsPage, heirTotalsPageSize, totalsByHeir]
  );

  useEffect(() => {
    setDistributionPage((current) => Math.min(current, distributionTotalPages));
  }, [distributionTotalPages]);

  useEffect(() => {
    setHeirTotalsPage((current) => Math.min(current, heirTotalsTotalPages));
  }, [heirTotalsTotalPages]);

  const totalPercentage = Number(realtimeCalculation?.total_share ?? 0);
  const totalAmount = (realtimeCalculation?.active_heirs ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const undistributedPercentage = Math.max(0, 100 - totalPercentage);
  const childrenMissingLinks = useMemo(
    () =>
      members.filter(
        (member) =>
          (member.relationship_to_parent === 'hijo' || member.relationship_to_parent === 'hija') &&
          !parentLinks.some((link) => link.child_member_id === member.id)
      ),
    [members, parentLinks]
  );

  const heirEvidenceByMemberId = new Map(
    confirmedHeirs.filter((heir) => heir.sienna_member_id).map((heir) => [String(heir.sienna_member_id), heir])
  );
  const heirEvidenceByName = new Map(confirmedHeirs.map((heir) => [normalizeName(heir.heir_name), heir]));
  const photoLookup = useMemo(() => buildMemberPhotoLookup(confirmedHeirs), [confirmedHeirs]);

  return (
    <div className="app-shell py-8">
      <BackButton />

      <DocumentHeader
        title="Cálculo por Filiación"
        subtitle="Distribución por línea familiar y acumulado por heredero"
        helpKey="calculo-filiacion"
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {(Math.abs(totalPercentage - 100) > 0.05 || genealogyIssues > 0 || childrenMissingLinks.length > 0) && (
          <Card className="border border-amber-300 bg-amber-50/80 shadow-sm">
            <CardContent className="space-y-2 p-4 text-sm text-amber-950">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Validaciones del cálculo
              </p>
              {Math.abs(totalPercentage - 100) > 0.05 && (
                <p>
                  Solo se distribuye <strong>{formatPercent(totalPercentage)}</strong> del caudal; quedan{' '}
                  <strong>{formatPercent(undistributedPercentage)}</strong> sin heredero vivo registrado en alguna rama
                  (nodos fallecidos sin descendencia documentada).
                </p>
              )}
              {genealogyIssues > 0 && (
                <p>
                  Hay <strong>{genealogyIssues}</strong> vínculo(s) o unión(es) inconsistentes que afectan filiación
                  formal (no incluye cónyuge solo en texto como referencia). Revise Hallazgos antes de usar cifras en
                  reunión.
                </p>
              )}
              {childrenMissingLinks.length > 0 && (
                <p>
                  <strong>{childrenMissingLinks.length}</strong> hijo(s)/hija(s) aún no tienen vínculo de filiación en{' '}
                  <code className="text-xs">member_parent_links</code>:{' '}
                  {childrenMissingLinks
                    .slice(0, 4)
                    .map((member) => member.name)
                    .join(', ')}
                  {childrenMissingLinks.length > 4 ? '…' : ''}. Edítelos y guarde para sincronizar filiación.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Scale className="h-5 w-5" />
              Supuesto de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-700">
              Este cálculo consulta la API del caso en vivo y separa la herencia por líneas activas. Si se agrega,
              modifica o elimina un miembro, la API recalcula y esta tabla refleja la misma realidad que el árbol.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {totalsByLine.map((item) => (
                <div key={item.line} className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                  <p className="text-sm text-legal-gray">Línea {item.line}</p>
                  <p className="text-2xl font-bold text-legal-blue">{formatPercent(item.percentage)}</p>
                </div>
              ))}
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Total distribuido</p>
                <p className="text-2xl font-bold text-legal-blue">{formatPercent(totalPercentage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <UserCheck className="h-5 w-5" />
              Monto de la Herencia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="estateAmount">Monto bruto del caso</Label>
                <Input
                  id="estateAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={estateAmount || ''}
                  onChange={(event) => setEstateAmount(Number(event.target.value))}
                />
              </div>
              <div className="bg-legal-blue/5 border border-legal-blue/20 rounded-md p-4">
                <p className="text-sm text-legal-gray">Total neto calculado</p>
                <p className="text-2xl font-bold text-legal-blue">{formatMoney(totalAmount)}</p>
                <p className="text-xs text-legal-gray">
                  Firma: {formatPercent(lawyerFeePercentage)}
                  {isFetchingCalculation ? ' · recalculando...' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <GitBranch className="h-5 w-5" />
              Detalle por Línea y Filiación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Línea</TableHead>
                  <TableHead>Rama</TableHead>
                  <TableHead>Heredero</TableHead>
                  <TableHead>Estado documental</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDistributionLines.map((item) => {
                  const evidence =
                    heirEvidenceByMemberId.get(item.memberId) || heirEvidenceByName.get(normalizeName(item.heir));

                  return (
                    <TableRow key={`${item.line}-${item.memberId}-${item.route}`}>
                      <TableCell className="font-medium text-legal-blue">{item.line}</TableCell>
                      <TableCell>{item.branch}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MemberPhoto
                            name={item.heir}
                            memberId={item.memberId}
                            lookup={photoLookup}
                            size="sm"
                          />
                          <span>{item.heir}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <LinkedSupportBadge memberId={item.memberId} status={evidence?.status} />
                      </TableCell>
                      <TableCell className="min-w-[220px] max-w-[360px] text-sm text-gray-600">
                        <p className="line-clamp-2">{item.route || 'Ruta pendiente en árbol'}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{formatPercent(item.percentage)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(Number(realtimeCalculation?.estate.distributableAmount || estateAmount) * (item.percentage / 100))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
            <TablePaginationControls
              page={distributionPage}
              pageSize={distributionPageSize}
              totalItems={distributionLines.length}
              totalPages={distributionTotalPages}
              onPageChange={setDistributionPage}
              onPageSizeChange={setDistributionPageSize}
              itemLabel="lineas"
            />
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="text-legal-blue">Resultado Acumulado por Heredero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heredero</TableHead>
                  <TableHead>Entradas por filiación</TableHead>
                  <TableHead>Actas registradas</TableHead>
                  <TableHead className="text-right">Porcentaje total</TableHead>
                  <TableHead className="text-right">Monto total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTotalsByHeir.map((item) => (
                  <TableRow key={item.heir}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MemberPhoto
                          name={item.heir}
                          memberId={item.memberId}
                          lookup={photoLookup}
                          size="sm"
                        />
                        {item.heir}
                      </div>
                    </TableCell>
                    <TableCell>{item.routes}</TableCell>
                    <TableCell>
                      {(() => {
                        const evidenceCount = heirEvidenceByName.get(normalizeName(item.heir))?.evidence_count || 0;
                        if (!item.memberId || evidenceCount > 0) return evidenceCount;
                        return (
                          <Link
                            to={buildSiennaDocumentSupportHref(item.memberId, 'heir-support')}
                            className="font-medium text-legal-blue underline"
                          >
                            0 - cargar soporte
                          </Link>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{formatPercent(item.percentage)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-legal-blue">
                      {formatMoney(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <TablePaginationControls
              page={heirTotalsPage}
              pageSize={heirTotalsPageSize}
              totalItems={totalsByHeir.length}
              totalPages={heirTotalsTotalPages}
              onPageChange={setHeirTotalsPage}
              onPageSizeChange={setHeirTotalsPageSize}
              itemLabel="herederos"
            />
          </CardContent>
        </Card>

        <details className="rounded-md border border-legal-gold/20 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-legal-blue">
            Nota de validación jurídica
          </summary>
          <div className="border-t border-legal-blue/10 p-4">
            <p className="text-sm leading-relaxed text-gray-700">
              Esta vista ya no usa supuestos fijos: refleja en tiempo real la misma estructura y cálculo sucesoral del
              módulo del caso. El porcentaje final siempre debe validarse con criterio jurídico, actas y estrategia procesal
              antes de emitir una distribución definitiva.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CalculoFiliacion;
