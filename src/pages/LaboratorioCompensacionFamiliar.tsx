import { useMemo, useState } from 'react';
import { Calculator, FlaskConical, Plane, RefreshCw, Scale, Star, Users } from 'lucide-react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSiennaCalculation } from '@/hooks/useSiennaData';

type AllocationMethod = 'proporcional' | 'igualitario' | 'proporcional_sin_compensados' | 'umbral';

type ManagementParticipant = {
  key: string;
  memberId: string;
  name: string;
  match: RegExp;
  fixedAmount: number;
  percentOfEstate: number;
  enabled: boolean;
};

type ExpenseKey = 'pasajes' | 'hospedaje' | 'transporte' | 'audiencias' | 'otros';

const expenseLabels: Record<ExpenseKey, string> = {
  pasajes: 'Pasajes aéreos',
  hospedaje: 'Hospedaje',
  transporte: 'Transporte local',
  audiencias: 'Audiencias / diligencias',
  otros: 'Otros gastos comprobables',
};

const defaultExpenses: Record<ExpenseKey, number> = {
  pasajes: 0,
  hospedaje: 0,
  transporte: 0,
  audiencias: 0,
  otros: 0,
};

const defaultParticipants: ManagementParticipant[] = [
  {
    key: 'joselyn',
    memberId: 'jocelyn',
    name: 'Jocelyn del Jesús Sangiovanni Báez',
    match: /joselyn|jocelyn/i,
    fixedAmount: 0,
    percentOfEstate: 0,
    enabled: true,
  },
  {
    key: 'bernardo',
    memberId: 'bernardo-martin',
    name: 'Bernardo Martín Lizardo Sangiovanni',
    match: /bernardo/i,
    fixedAmount: 0,
    percentOfEstate: 0,
    enabled: true,
  },
  {
    key: 'victor',
    memberId: 'victor-manuel-martin',
    name: 'Víctor Manuel Martín Sangiovanni Rodríguez',
    match: /victor manuel martin|víctor manuel martín|victor/i,
    fixedAmount: 0,
    percentOfEstate: 0,
    enabled: true,
  },
];

const parseAmount = (value: string) => {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(0, next) : 0;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount || 0);

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value || 0)}%`;

const LaboratorioCompensacionFamiliar = () => {
  const { data, isFetching, refetch } = useSiennaCalculation();
  const calculation = data?.calculation;
  const heirs = calculation?.active_heirs ?? [];
  const distributableAmount = Number(calculation?.estate.distributableAmount || 0);

  const [expenses, setExpenses] = useState<Record<ExpenseKey, number>>(defaultExpenses);
  const [participants, setParticipants] = useState<ManagementParticipant[]>(defaultParticipants);
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>('proporcional_sin_compensados');
  const [thresholdAmount, setThresholdAmount] = useState(0);

  const joselynExpenseTotal = useMemo(
    () => Object.values(expenses).reduce((sum, value) => sum + Number(value || 0), 0),
    [expenses]
  );

  const participantCompensations = useMemo(() => {
    return participants.map((participant) => {
      const amount = participant.enabled
        ? participant.fixedAmount + distributableAmount * (participant.percentOfEstate / 100)
        : 0;
      const matchingHeir = heirs.find((row) => row.member_id === participant.memberId)
        ?? heirs.find((row) => participant.match.test(row.heir_name));
      return {
        ...participant,
        amount,
        officialMemberId: matchingHeir?.member_id ?? participant.memberId,
        officialName: matchingHeir?.heir_name ?? participant.name,
      };
    });
  }, [distributableAmount, heirs, participants]);

  const managementTotal = participantCompensations.reduce((sum, item) => sum + item.amount, 0);
  const totalCompensationPool = joselynExpenseTotal + managementTotal;
  const compensatedMemberIds = useMemo(
    () =>
      new Set(
        participantCompensations
          .filter((item) => item.enabled)
          .map((item) => item.officialMemberId)
      ),
    [participantCompensations]
  );
  const compensatedDisplayOrder = useMemo(() => {
    const order = new Map<string, number>();
    participantCompensations.forEach((item, index) => {
      order.set(item.officialMemberId, index);
    });
    return order;
  }, [participantCompensations]);

  const contributionBase = useMemo(() => {
    return heirs.filter((heir) => {
      if (allocationMethod === 'proporcional') return heir.member_id !== 'jocelyn';
      if (allocationMethod === 'proporcional_sin_compensados') return !compensatedMemberIds.has(heir.member_id);
      if (allocationMethod === 'umbral') return Number(heir.amount || 0) >= thresholdAmount;
      return true;
    });
  }, [allocationMethod, compensatedMemberIds, heirs, thresholdAmount]);

  const contributionBaseAmount = contributionBase.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const equalContribution = contributionBase.length > 0 ? totalCompensationPool / contributionBase.length : 0;

  const rows = useMemo(() => {
    return heirs
      .map((heir) => {
        const originalAmount = Number(heir.amount || 0);
        const isContributor = contributionBase.some((row) => row.member_id === heir.member_id);
        let contribution = 0;

        if (isContributor && totalCompensationPool > 0) {
          contribution = allocationMethod === 'igualitario'
            ? equalContribution
            : contributionBaseAmount > 0
              ? totalCompensationPool * (originalAmount / contributionBaseAmount)
              : 0;
        }

        const managementReceived = participantCompensations
          .filter((item) => item.officialMemberId === heir.member_id)
          .reduce((sum, item) => sum + item.amount, 0);
        const reimbursementReceived = participantCompensations.find((item) => item.key === 'joselyn' && item.officialMemberId === heir.member_id)
          ? joselynExpenseTotal
          : 0;
        const totalReceived = managementReceived + reimbursementReceived;
        const simulatedAmount = originalAmount - contribution + totalReceived;

        return {
          ...heir,
          originalAmount,
          contribution,
          managementReceived,
          reimbursementReceived,
          totalReceived,
          simulatedAmount,
          delta: simulatedAmount - originalAmount,
        };
      })
      .sort((left, right) => {
        const leftPriority = compensatedDisplayOrder.get(left.member_id);
        const rightPriority = compensatedDisplayOrder.get(right.member_id);
        if (leftPriority !== undefined || rightPriority !== undefined) {
          return (leftPriority ?? 999) - (rightPriority ?? 999);
        }
        return Math.abs(right.delta) - Math.abs(left.delta) || left.heir_name.localeCompare(right.heir_name, 'es');
      });
  }, [
    allocationMethod,
    compensatedDisplayOrder,
    contributionBase,
    contributionBaseAmount,
    equalContribution,
    heirs,
    joselynExpenseTotal,
    participantCompensations,
    totalCompensationPool,
  ]);

  const totals = rows.reduce(
    (acc, row) => ({
      original: acc.original + row.originalAmount,
      contributions: acc.contributions + row.contribution,
      received: acc.received + row.totalReceived,
      simulated: acc.simulated + row.simulatedAmount,
    }),
    { original: 0, contributions: 0, received: 0, simulated: 0 }
  );

  const updateExpense = (key: ExpenseKey, value: string) => {
    setExpenses((current) => ({ ...current, [key]: parseAmount(value) }));
  };

  const updateParticipant = (key: string, field: 'fixedAmount' | 'percentOfEstate' | 'enabled', value: string | boolean) => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.key === key
          ? {
              ...participant,
              [field]: field === 'enabled' ? Boolean(value) : parseAmount(String(value)),
            }
          : participant
      )
    );
  };

  return (
    <SiennaPageLayout>
      <BackButton />
      <DocumentHeader
        title="Laboratorio de Compensación Familiar"
        subtitle="Simulador independiente para evaluar reembolsos, compensaciones de gestión e impacto por heredero"
        helpKey="sienna-laboratorio-compensacion"
      />

      <div className="space-y-6">
        <Card className="border border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-950">
            Pantalla experimental. No guarda datos, no modifica Settings, no altera el cálculo oficial y solo usa la
            distribución vigente de la API como punto de comparación.
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Scale className="h-8 w-8 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Base oficial API</p>
                <p className="text-xl font-bold text-legal-blue">{formatMoney(distributableAmount)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Plane className="h-8 w-8 text-sky-700" />
              <div>
                <p className="text-sm text-legal-gray">Reembolso Joselyn</p>
                <p className="text-xl font-bold text-sky-800">{formatMoney(joselynExpenseTotal)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Users className="h-8 w-8 text-emerald-700" />
              <div>
                <p className="text-sm text-legal-gray">Gestión familiar</p>
                <p className="text-xl font-bold text-emerald-800">{formatMoney(managementTotal)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Calculator className="h-8 w-8 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Fondo simulado</p>
                <p className="text-xl font-bold text-legal-blue">{formatMoney(totalCompensationPool)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <Card className="border border-legal-gold/20">
              <CardHeader className="border-b bg-legal-blue/5">
                <CardTitle className="flex items-center gap-2 text-legal-blue">
                  <Plane className="h-5 w-5" />
                  Reembolso de gastos de Joselyn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                {(Object.keys(expenseLabels) as ExpenseKey[]).map((key) => (
                  <div key={key}>
                    <Label>{expenseLabels[key]}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={expenses[key] || ''}
                      onChange={(event) => updateExpense(key, event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-legal-gold/20">
              <CardHeader className="border-b bg-legal-blue/5">
                <CardTitle className="flex items-center gap-2 text-legal-blue">
                  <FlaskConical className="h-5 w-5" />
                  Método de prorrateo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <Label>Cómo repartir el costo</Label>
                  <Select value={allocationMethod} onValueChange={(value) => setAllocationMethod(value as AllocationMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proporcional">Proporcional al monto heredado, excepto Jocelyn</SelectItem>
                      <SelectItem value="igualitario">Igualitario entre todos</SelectItem>
                      <SelectItem value="proporcional_sin_compensados">Proporcional excluyendo compensados</SelectItem>
                      <SelectItem value="umbral">Solo herederos sobre un umbral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {allocationMethod === 'umbral' && (
                  <div>
                    <Label>Monto mínimo para aportar</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={thresholdAmount || ''}
                      onChange={(event) => setThresholdAmount(parseAmount(event.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                )}
                <p className="rounded-md bg-legal-blue/5 p-3 text-xs leading-relaxed text-legal-gray">
                  Recomendación inicial: proporcional al monto heredado. Es el criterio más defendible porque cada
                  heredero aporta según el beneficio económico que recibe del reparto oficial.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-legal-gold/20">
            <CardHeader className="border-b bg-legal-blue/5">
              <CardTitle className="flex items-center gap-2 text-legal-blue">
                <Users className="h-5 w-5" />
                Compensación por gestión principal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {participantCompensations.map((participant) => (
                <div key={participant.key} className="grid gap-3 rounded-md border border-legal-gold/20 p-4 md:grid-cols-[1fr_130px_130px_95px] md:items-end">
                  <div>
                    <p className="font-semibold text-legal-blue">{participant.name}</p>
                    <p className="text-xs text-legal-gray">
                      Vinculado a: {participant.officialName}
                    </p>
                  </div>
                  <div>
                    <Label>Monto fijo</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={participant.fixedAmount || ''}
                      onChange={(event) => updateParticipant(participant.key, 'fixedAmount', event.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>% del neto</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={participant.percentOfEstate || ''}
                      onChange={(event) => updateParticipant(participant.key, 'percentOfEstate', event.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant={participant.enabled ? 'default' : 'outline'}
                    onClick={() => updateParticipant(participant.key, 'enabled', !participant.enabled)}
                  >
                    {participant.enabled ? 'Activo' : 'Inactivo'}
                  </Button>
                </div>
              ))}

              <div className="rounded-md border border-legal-blue/15 bg-white p-4">
                <p className="text-xs uppercase text-legal-gray">Total gestión simulada</p>
                <p className="text-2xl font-bold text-legal-blue">{formatMoney(managementTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-legal-gold/20">
          <CardHeader className="border-b bg-legal-blue/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-legal-blue">Comparación por heredero</CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isFetching ? 'Actualizando...' : 'Actualizar base API'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heredero</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Aporta</TableHead>
                  <TableHead className="text-right">Recibe</TableHead>
                  <TableHead className="text-right">Simulado</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.member_id}>
                    <TableCell className="min-w-[260px] font-medium">
                      <span className="inline-flex items-center gap-2">
                        {compensatedDisplayOrder.has(row.member_id) && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-label="Compensado" />
                        )}
                        {row.heir_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(Number(row.share_percent || 0))}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.originalAmount)}</TableCell>
                    <TableCell className="text-right text-red-700">{formatMoney(row.contribution)}</TableCell>
                    <TableCell className="text-right text-emerald-700">{formatMoney(row.totalReceived)}</TableCell>
                    <TableCell className="text-right font-semibold text-legal-blue">{formatMoney(row.simulatedAmount)}</TableCell>
                    <TableCell className={row.delta >= 0 ? 'text-right font-semibold text-emerald-700' : 'text-right font-semibold text-red-700'}>
                      {formatMoney(row.delta)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-legal-blue/5 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{formatMoney(totals.original)}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.contributions)}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.received)}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.simulated)}</TableCell>
                  <TableCell className="text-right">{formatMoney(totals.simulated - totals.original)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SiennaPageLayout>
  );
};

export default LaboratorioCompensacionFamiliar;
