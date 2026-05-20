import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { api, ConfirmedHeir, SiennaFamilyMember } from '@/lib/api';
import { buildDominicanInheritancePlan, normalizeName } from '@/lib/dominicanInheritance';
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
import { GitBranch, Scale, UserCheck } from 'lucide-react';

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

const CalculoFiliacion = () => {
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [estateAmount, setEstateAmount] = useState(0);
  const [confirmedHeirs, setConfirmedHeirs] = useState<ConfirmedHeir[]>([]);

  useEffect(() => {
    Promise.all([api.listSiennaFamilyMembers(), api.listConfirmedHeirs()])
      .then(([membersResponse, heirsResponse]) => {
        setMembers(membersResponse.members);
        setConfirmedHeirs(heirsResponse.heirs);
      })
      .catch(() => {
        setMembers([]);
        setConfirmedHeirs([]);
      });
  }, []);

  const inheritancePlan = useMemo(() => buildDominicanInheritancePlan(members), [members]);

  const distributionLines = useMemo<DistributionLine[]>(
    () =>
      inheritancePlan.activeHeirs
        .flatMap((share) =>
          share.sourceBreakdown.map((segment) => ({
            line: segment.source,
            branch: extractBranch(segment.routes),
            memberId: share.member.id,
            heir: share.member.name,
            route: prettyRoute(segment.routes),
            percentage: segment.share,
          }))
        )
        .sort((left, right) => right.percentage - left.percentage || left.line.localeCompare(right.line, 'es')),
    [inheritancePlan.activeHeirs]
  );

  const totalsByHeir = useMemo(() => {
    const totals = new Map<string, { heir: string; percentage: number; amount: number; routes: number }>();

    distributionLines.forEach((item) => {
      const current = totals.get(item.heir) || {
        heir: item.heir,
        percentage: 0,
        amount: 0,
        routes: 0,
      };

      current.percentage += item.percentage;
      current.amount += estateAmount * (item.percentage / 100);
      current.routes += 1;
      totals.set(item.heir, current);
    });

    return Array.from(totals.values()).sort((a, b) => b.percentage - a.percentage || a.heir.localeCompare(b.heir, 'es'));
  }, [distributionLines, estateAmount]);

  const totalsByLine = useMemo(() => {
    const totals = new Map<string, number>();
    distributionLines.forEach((item) => {
      totals.set(item.line, (totals.get(item.line) || 0) + item.percentage);
    });

    return Array.from(totals.entries())
      .map(([line, percentage]) => ({ line, percentage }))
      .sort((a, b) => b.percentage - a.percentage || a.line.localeCompare(b.line, 'es'));
  }, [distributionLines]);

  const totalPercentage = totalsByHeir.reduce((sum, item) => sum + item.percentage, 0);
  const totalAmount = totalsByHeir.reduce((sum, item) => sum + item.amount, 0);

  const heirEvidenceByMemberId = new Map(
    confirmedHeirs.filter((heir) => heir.sienna_member_id).map((heir) => [String(heir.sienna_member_id), heir])
  );
  const heirEvidenceByName = new Map(confirmedHeirs.map((heir) => [normalizeName(heir.heir_name), heir]));

  return (
    <div className="app-shell py-8">
      <BackButton />

      <DocumentHeader
        title="Cálculo por Filiación"
        subtitle="Distribución por línea familiar y acumulado por heredero"
        helpKey="calculo-filiacion"
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Scale className="h-5 w-5" />
              Supuesto de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-700">
              Este cálculo usa la misma fuente de verdad del árbol Sienna y separa la herencia por líneas activas
              detectadas en tiempo real. Si se agregan o ajustan miembros que cambien el reparto, esta tabla se actualiza
              automáticamente sin reglas quemadas.
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
                <Label htmlFor="estateAmount">Monto total</Label>
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
                <p className="text-sm text-legal-gray">Total calculado</p>
                <p className="text-2xl font-bold text-legal-blue">{formatMoney(totalAmount)}</p>
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
          <CardContent className="p-6 overflow-x-auto">
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
                {distributionLines.map((item) => {
                  const evidence =
                    heirEvidenceByMemberId.get(item.memberId) || heirEvidenceByName.get(normalizeName(item.heir));

                  return (
                    <TableRow key={`${item.line}-${item.memberId}`}>
                      <TableCell className="font-medium text-legal-blue">{item.line}</TableCell>
                      <TableCell>{item.branch}</TableCell>
                      <TableCell>{item.heir}</TableCell>
                      <TableCell>
                        <Badge variant={evidence?.status === 'confirmado' ? 'default' : 'secondary'}>
                          {evidence?.status || 'sin confirmar'}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[280px] text-sm text-gray-600">{item.route || 'Ruta pendiente en árbol'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{formatPercent(item.percentage)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(estateAmount * (item.percentage / 100))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="text-legal-blue">Resultado Acumulado por Heredero</CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
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
                {totalsByHeir.map((item) => (
                  <TableRow key={item.heir}>
                    <TableCell className="font-medium">{item.heir}</TableCell>
                    <TableCell>{item.routes}</TableCell>
                    <TableCell>{heirEvidenceByName.get(normalizeName(item.heir))?.evidence_count || 0}</TableCell>
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
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardContent className="p-6">
            <h3 className="text-lg font-serif font-bold text-legal-blue mb-2">
              Nota de Validación
            </h3>
            <p className="text-gray-700">
              Esta vista ya no usa supuestos fijos: refleja en tiempo real la misma estructura y cálculo sucesoral del
              módulo Sienna. El porcentaje final siempre debe validarse con criterio jurídico, actas y estrategia procesal
              antes de emitir una distribución definitiva.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalculoFiliacion;
