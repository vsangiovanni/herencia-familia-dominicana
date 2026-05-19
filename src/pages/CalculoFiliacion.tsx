import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { api, ConfirmedHeir } from '@/lib/api';
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
  heir: string;
  route: string;
  percentage: number;
};

const distributionLines: DistributionLine[] = [
  {
    line: 'Vincenzo / Vicente Sangiovanni',
    branch: 'María Rosa Sangiovanni Pérez',
    heir: 'Víctor Manuel Martín Sangiovanni Rodríguez',
    route: 'Vincenzo → María Rosa → Víctor Manuel Sangiovanni Sangiovanni → Víctor Manuel Martín',
    percentage: 12.5,
  },
  {
    line: 'Vincenzo / Vicente Sangiovanni',
    branch: 'María Rosa Sangiovanni Pérez',
    heir: 'Perla Rosa Brea Sangiovanni',
    route: 'Vincenzo → María Rosa → Víctor Manuel Sangiovanni Sangiovanni → Rosa Julia → Perla Rosa',
    percentage: 12.5,
  },
  {
    line: 'Vincenzo / Vicente Sangiovanni',
    branch: 'Domingo Ramón Sangiovanni Pérez',
    heir: 'Bernardo Martín Lizardo Sangiovanni',
    route: 'Vincenzo → Domingo Ramón → María Amparo → Bernardo Martín',
    percentage: 12.5,
  },
  {
    line: 'Vincenzo / Vicente Sangiovanni',
    branch: 'Domingo Ramón Sangiovanni Pérez',
    heir: 'Jocelyn del Jesús Sangiovanni Báez',
    route: 'Vincenzo → Domingo Ramón → José Vicente → Jocelyn',
    percentage: 6.25,
  },
  {
    line: 'Vincenzo / Vicente Sangiovanni',
    branch: 'Domingo Ramón Sangiovanni Pérez',
    heir: 'Mayra Josefina Sangiovanni Báez',
    route: 'Vincenzo → Domingo Ramón → José Vicente → Mayra Josefina',
    percentage: 6.25,
  },
  {
    line: 'Paolo / Paulino Sangiovanni',
    branch: 'Pedro Pablo Sangiovanni Simo',
    heir: 'Víctor Manuel Martín Sangiovanni Rodríguez',
    route: 'Paolo → Pedro Pablo → Víctor Manuel Sangiovanni Sangiovanni → Víctor Manuel Martín',
    percentage: 25,
  },
  {
    line: 'Paolo / Paulino Sangiovanni',
    branch: 'Pedro Pablo Sangiovanni Simo',
    heir: 'Perla Rosa Brea Sangiovanni',
    route: 'Paolo → Pedro Pablo → Víctor Manuel Sangiovanni Sangiovanni → Rosa Julia → Perla Rosa',
    percentage: 25,
  },
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;

const CalculoFiliacion = () => {
  const [estateAmount, setEstateAmount] = useState(0);
  const [confirmedHeirs, setConfirmedHeirs] = useState<ConfirmedHeir[]>([]);

  useEffect(() => {
    api.listConfirmedHeirs()
      .then((response) => setConfirmedHeirs(response.heirs))
      .catch(() => setConfirmedHeirs([]));
  }, []);

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

    return Array.from(totals.values()).sort((a, b) => b.percentage - a.percentage);
  }, [estateAmount]);

  const totalPercentage = totalsByHeir.reduce((sum, item) => sum + item.percentage, 0);
  const totalAmount = totalsByHeir.reduce((sum, item) => sum + item.amount, 0);
  const heirEvidence = new Map(confirmedHeirs.map((heir) => [heir.heir_name, heir]));

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />

      <DocumentHeader
        title="Cálculo por Filiación"
        subtitle="Distribución por línea familiar y acumulado por heredero"
        helpKey="calculo-filiacion"
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Scale className="h-5 w-5" />
              Supuesto de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-700">
              Este cálculo separa la herencia por filiación para visualizar cuánto recibe cada persona
              por cada ruta familiar. Parte del supuesto de revisión de que las líneas activas de
              Vincenzo/Vicente y Paolo/Paulino se ponderan por estirpes y que los herederos con doble
              entrada acumulan lo que les corresponda por cada vía.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Línea Vincenzo/Vicente</p>
                <p className="text-2xl font-bold text-legal-blue">50%</p>
              </div>
              <div className="bg-legal-beige/50 border-l-4 border-legal-gold p-4">
                <p className="text-sm text-legal-gray">Línea Paolo/Paulino</p>
                <p className="text-2xl font-bold text-legal-blue">50%</p>
              </div>
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
                {distributionLines.map((item) => (
                  <TableRow key={`${item.line}-${item.heir}-${item.percentage}`}>
                    <TableCell className="font-medium text-legal-blue">{item.line}</TableCell>
                    <TableCell>{item.branch}</TableCell>
                    <TableCell>{item.heir}</TableCell>
                    <TableCell>
                      <Badge variant={heirEvidence.get(item.heir)?.status === 'confirmado' ? 'default' : 'secondary'}>
                        {heirEvidence.get(item.heir)?.status || 'mencionado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[280px] text-sm text-gray-600">{item.route}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{formatPercent(item.percentage)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(estateAmount * (item.percentage / 100))}
                    </TableCell>
                  </TableRow>
                ))}
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
                    <TableCell>{heirEvidence.get(item.heir)?.evidence_count || 0}</TableCell>
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
              Esta página es una herramienta de análisis para revisar el efecto de la doble filiación.
              El porcentaje final debe validarse contra el criterio jurídico aplicable, las actas y la
              estrategia procesal antes de usarse como distribución definitiva.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalculoFiliacion;
