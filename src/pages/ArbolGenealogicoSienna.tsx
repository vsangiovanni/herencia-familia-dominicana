import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { api, ConfirmedHeir, SiennaFamilyMember } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Calculator, ClipboardCheck, GitBranch, Landmark, Route, Save, Users } from 'lucide-react';

type TreeMember = SiennaFamilyMember & { children: TreeMember[] };

const formatMoney = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const buildForest = (members: SiennaFamilyMember[]) => {
  const byId = new Map<string, TreeMember>();
  members.forEach((member) => {
    byId.set(member.id, { ...member, children: [] });
  });

  const roots: TreeMember[] = [];
  byId.forEach((member) => {
    const parent = member.parent_id ? byId.get(member.parent_id) : null;
    if (parent) {
      parent.children.push(member);
    } else {
      roots.push(member);
    }
  });

  const sortTree = (nodes: TreeMember[]) => {
    nodes.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name));
    nodes.forEach((node) => sortTree(node.children));
    return nodes;
  };

  return sortTree(roots);
};

const caseCausanteName = 'Alessandro de Paola Sangiovanni';

const determinedHeirs = new Map([
  [
    normalizeName('Víctor Manuel Martín Sangiovanni Rodríguez'),
    'Heredero determinado por doble vocación sucesoral: línea Vincenzo/Vicente vía María Rosa y línea Paolo/Paulino vía Pedro Pablo.',
  ],
  [
    normalizeName('Perla Rosa Brea Sangiovanni'),
    'Heredera determinada por representación en la rama de Rosa Julia, con doble línea familiar Vincenzo/Vicente y Paolo/Paulino.',
  ],
  [
    normalizeName('Bernardo Martín Lizardo Sangiovanni'),
    'Heredero determinado por la rama Domingo Ramón -> María Amparo dentro de la línea Vincenzo/Vicente.',
  ],
  [
    normalizeName('Jocelyn del Jesús Sangiovanni Báez'),
    'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.',
  ],
  [
    normalizeName('Mayra Josefina Sangiovanni Báez'),
    'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.',
  ],
]);

const heirCaseDetails = new Map([
  [
    normalizeName('Víctor Manuel Martín Sangiovanni Rodríguez'),
    {
      share: 37.5,
      role: 'Heredero final',
      route: 'Domenico -> María Magdalena -> Alessandro como causante; derecho por ramas Vincenzo/Vicente y Paolo/Paulino vía María Rosa/Pedro Pablo -> Víctor Manuel Sangiovanni Sangiovanni -> Víctor Manuel Martín.',
      paymentBasis: 'Acumula dos entradas: 12.5% por Vincenzo/Vicente y 25% por Paolo/Paulino.',
    },
  ],
  [
    normalizeName('Perla Rosa Brea Sangiovanni'),
    {
      share: 37.5,
      role: 'Heredera final',
      route: 'Domenico -> María Magdalena -> Alessandro como causante; derecho por ramas Vincenzo/Vicente y Paolo/Paulino vía María Rosa/Pedro Pablo -> Víctor Manuel Sangiovanni Sangiovanni -> Rosa Julia -> Perla Rosa.',
      paymentBasis: 'Entra por representación de Rosa Julia y acumula doble línea: 12.5% + 25%.',
    },
  ],
  [
    normalizeName('Bernardo Martín Lizardo Sangiovanni'),
    {
      share: 12.5,
      role: 'Heredero final',
      route: 'Domenico -> Vincenzo/Vicente -> Domingo Ramón -> María Amparo -> Bernardo Martín.',
      paymentBasis: 'Participa por la rama Domingo Ramón / María Amparo dentro de Vincenzo/Vicente.',
    },
  ],
  [
    normalizeName('Jocelyn del Jesús Sangiovanni Báez'),
    {
      share: 6.25,
      role: 'Heredera final',
      route: 'Domenico -> Vincenzo/Vicente -> Domingo Ramón -> José Vicente -> Jocelyn.',
      paymentBasis: 'Comparte la rama José Vicente con Mayra dentro de Vincenzo/Vicente.',
    },
  ],
  [
    normalizeName('Mayra Josefina Sangiovanni Báez'),
    {
      share: 6.25,
      role: 'Heredera final',
      route: 'Domenico -> Vincenzo/Vicente -> Domingo Ramón -> José Vicente -> Mayra.',
      paymentBasis: 'Comparte la rama José Vicente con Jocelyn dentro de Vincenzo/Vicente.',
    },
  ],
]);

const knownIntermediates = new Map([
  [normalizeName('Domenico (Domingo) Sangiovanni'), 'Tronco familiar común; sirve para ubicar ramas, no como heredero final.'],
  [normalizeName('María Magdalena Sangiovanni'), 'Madre del causante Alessandro; rama del causante, no heredera final en este análisis.'],
  [normalizeName('Vincenzo (Vicente) Sangiovanni'), 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
  [normalizeName('Paolo (Paulino) Sangiovanni'), 'Hermano de la madre del causante; abre una rama sucesoral activa por sus descendientes.'],
  [normalizeName('María Rosa Sangiovanni Pérez'), 'Intermedia fallecida en rama Vincenzo/Vicente y vínculo hacia la doble filiación.'],
  [normalizeName('Pedro Pablo Sangiovanni Simo'), 'Intermedio fallecido en rama Paolo/Paulino y vínculo hacia la doble filiación.'],
  [normalizeName('Domingo Ramón Sangiovanni Pérez'), 'Intermedio fallecido en rama Vincenzo/Vicente; transmite representación a sus descendientes.'],
  [normalizeName('Víctor Manuel Sangiovanni Sangiovanni'), 'Intermedio fallecido; conecta a Víctor Manuel Martín y a Rosa Julia/Perla.'],
  [normalizeName('Rosa Julia Sangiovanni Rodríguez'), 'Intermedia fallecida; Perla Rosa entra por representación en su rama.'],
  [normalizeName('María Amparo Sangiovanni Gesualdo'), 'Intermedia fallecida; Bernardo Martín entra por representación en su rama.'],
  [normalizeName('José Vicente Sangiovanni Gesualdo'), 'Intermedio fallecido; Jocelyn y Mayra entran por representación en su rama.'],
]);

const explanationRole = (status?: string | null) => {
  if (status === 'confirmado' || status === 'posible_heredero') return 'Heredero final';
  if (status === 'no_hereda') return 'Enlace genealógico';
  return 'Pendiente de explicar';
};

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;

const classifyExistingMember = (member: SiennaFamilyMember): Pick<SiennaFamilyMember, 'inheritance_status' | 'inheritance_reason'> => {
  const name = normalizeName(member.name);

  if (name === normalizeName(caseCausanteName)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: 'Es el causante del expediente; no se clasifica como heredero.',
    };
  }

  if (determinedHeirs.has(name)) {
    return {
      inheritance_status: 'posible_heredero',
      inheritance_reason: determinedHeirs.get(name),
    };
  }

  if (knownIntermediates.has(name)) {
    return {
      inheritance_status: 'no_hereda',
      inheritance_reason: knownIntermediates.get(name),
    };
  }

  return {
    inheritance_status: member.inheritance_status || 'requiere_revision',
    inheritance_reason: member.inheritance_reason || 'No hay suficiente información del expediente para clasificarlo automáticamente.',
  };
};

const ClassicNode = ({
  member,
  heirsByName,
  total,
  estateAmount,
}: {
  member: TreeMember;
  heirsByName: Map<string, ConfirmedHeir>;
  total: number;
  estateAmount: number;
}) => {
  const heir = heirsByName.get(normalizeName(member.name));
  const savedAmount = Number(heir?.inheritance_amount || 0);
  const isHeir = Boolean(heir);
  const automaticClassification = classifyExistingMember(member);
  const inheritanceStatus = heir ? 'confirmado' : automaticClassification.inheritance_status;
  const inheritanceReason = heir?.relationship_summary || automaticClassification.inheritance_reason;
  const caseDetail = heirCaseDetails.get(normalizeName(member.name));
  const role = caseDetail?.role || explanationRole(inheritanceStatus);
  const calculatedAmount = estateAmount > 0 && caseDetail ? estateAmount * (caseDetail.share / 100) : 0;
  const amount = calculatedAmount || savedAmount;
  const referenceTotal = estateAmount > 0 ? estateAmount : total;
  const share = caseDetail?.share || (referenceTotal > 0 && amount > 0 ? (amount / referenceTotal) * 100 : 0);

  return (
    <li className="relative">
      <div className="relative flex flex-col items-center pt-6">
        <div
          className={cn(
            'relative mb-3 min-w-[230px] max-w-[270px] rounded-md border-2 bg-white p-3 text-center shadow-sm',
            member.is_highlighted_ancestor && !isHeir ? 'border-legal-gold bg-legal-beige' : 'border-legal-blue/30',
            isHeir && 'border-legal-gold bg-legal-gold/5 shadow-md'
          )}
        >
          {isHeir && (
            <div className="mb-2 flex justify-center">
              <Avatar className="h-16 w-16 border-2 border-legal-gold/50">
                {heir?.photo_data && <AvatarImage src={heir.photo_data} alt={member.name} className="object-cover" />}
                <AvatarFallback className="bg-legal-blue/10 text-legal-blue font-semibold">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          <h3 className="font-serif text-sm font-bold leading-tight text-legal-blue">{member.name}</h3>

          <div className="mt-1 text-xs text-gray-600">
            {member.birth && <span>n. {member.birth}</span>}
            {member.birth && member.death && <span> - </span>}
            {member.death && <span>m. {member.death}</span>}
          </div>

          {member.spouse && (
            <div className="mt-1 text-xs">
              <span className="text-legal-gray">Cónyuge: </span>
              {member.spouse}
            </div>
          )}

          <div className="mt-3 space-y-2 border-t border-legal-blue/10 pt-3">
            <div className="flex flex-wrap justify-center gap-1">
              <Badge variant={inheritanceStatus === 'posible_heredero' || inheritanceStatus === 'confirmado' ? 'default' : 'secondary'}>
                {role}
              </Badge>
              {inheritanceStatus && (
                <Badge variant="outline">{inheritanceStatus.replace(/_/g, ' ')}</Badge>
              )}
            </div>
            {inheritanceReason && (
              <p className="text-xs leading-relaxed text-legal-gray">{inheritanceReason}</p>
            )}
          </div>

          {isHeir && (
            <div className="mt-3 space-y-2 border-t border-legal-gold/30 pt-3">
              <div className="flex flex-wrap justify-center gap-1">
                {heir?.line_vincenzo && <Badge variant="outline">Vincenzo/Vicente</Badge>}
                {heir?.line_paolo && <Badge variant="outline">Paolo/Paulino</Badge>}
                <Badge variant={heir?.status === 'confirmado' ? 'default' : 'secondary'}>{heir?.status}</Badge>
              </div>
              <div className="rounded-md bg-white/80 p-2">
                <p className="text-[11px] uppercase tracking-wide text-legal-gray">Monto heredado</p>
                <p className="font-semibold text-legal-blue">{amount > 0 ? formatMoney(amount) : 'Pendiente de monto'}</p>
                <p className="text-xs text-legal-gray">
                  {share > 0 ? formatPercent(share) : 'Porcentaje pendiente'}
                </p>
              </div>
              {caseDetail && (
                <div className="rounded-md bg-legal-blue/5 p-2 text-left">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase text-legal-blue">
                    <Route className="h-3 w-3" />
                    Ruta y pago
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-700">{caseDetail.paymentBasis}</p>
                  <p className="mt-1 text-xs leading-relaxed text-legal-gray">{caseDetail.route}</p>
                </div>
              )}
            </div>
          )}

          {!isHeir && inheritanceStatus === 'no_hereda' && (
            <div className="mt-3 rounded-md bg-legal-blue/5 p-2 text-left">
              <p className="flex items-center gap-1 text-[11px] font-semibold uppercase text-legal-blue">
                <GitBranch className="h-3 w-3" />
                Función en el árbol
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-700">
                Este nodo no recibe pago final; explica de dónde sale la rama que conecta con quien sí hereda.
              </p>
            </div>
          )}
        </div>

        {member.children.length > 0 && (
          <ul className="classic-tree-children relative flex flex-row space-x-4">
            <div className="absolute -top-6 left-1/2 h-6 w-0.5 -translate-x-1/2 bg-legal-blue" />
            {member.children.length > 1 && <div className="absolute left-0 right-0 top-0 h-0.5 bg-legal-blue" />}
            {member.children.map((child) => (
              <ClassicNode key={child.id} member={child} heirsByName={heirsByName} total={total} estateAmount={estateAmount} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

const ArbolGenealogicoSienna = () => {
  const [heirs, setHeirs] = useState<ConfirmedHeir[]>([]);
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [estateAmount, setEstateAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [heirsResponse, membersResponse] = await Promise.all([
        api.listConfirmedHeirs(),
        api.listSiennaFamilyMembers(),
      ]);
      setHeirs(heirsResponse.heirs);
      setMembers(
        membersResponse.members.map((member) => ({
          ...member,
          ...classifyExistingMember(member),
        }))
      );
    } catch (error) {
      toast({
        title: 'No se pudo cargar el árbol Sienna',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = useMemo(
    () => heirs.reduce((sum, heir) => sum + Number(heir.inheritance_amount || 0), 0),
    [heirs]
  );
  const estateAmountNumber = Number(estateAmount || 0);

  const heirsByName = useMemo(
    () => new Map(heirs.map((heir) => [normalizeName(heir.heir_name), heir])),
    [heirs]
  );

  const forest = useMemo(() => buildForest(members), [members]);
  const calculatedPayments = useMemo(() => {
    const totalEstate = estateAmountNumber;
    return heirs
      .map((heir) => {
        const detail = heirCaseDetails.get(normalizeName(heir.heir_name));
        return {
          heir,
          detail,
          amount: detail && totalEstate > 0 ? totalEstate * (detail.share / 100) : Number(heir.inheritance_amount || 0),
        };
      })
      .filter((item) => item.detail);
  }, [estateAmountNumber, heirs]);
  const presentationStats = useMemo(() => {
    const classifiedMembers = members.map((member) => ({
      ...member,
      ...classifyExistingMember(member),
    }));

    return {
      finalHeirs: classifiedMembers.filter((member) => member.inheritance_status === 'posible_heredero' || member.inheritance_status === 'confirmado').length,
      connectors: classifiedMembers.filter((member) => member.inheritance_status === 'no_hereda').length,
      pending: classifiedMembers.filter((member) => member.inheritance_status === 'requiere_revision').length,
    };
  }, [members]);

  const applyEstateCalculation = async () => {
    const totalEstate = estateAmountNumber;
    if (!totalEstate || totalEstate <= 0) {
      toast({ title: 'Monto requerido', description: 'Indica el monto total de la herencia para distribuirlo.' });
      return;
    }

    setPaymentSaving(true);
    try {
      await Promise.all(
        calculatedPayments.map(({ heir, amount }) =>
          api.updateConfirmedHeir(heir.id, {
            relationship_summary: heir.relationship_summary,
            line_vincenzo: heir.line_vincenzo,
            line_paolo: heir.line_paolo,
            status: heir.status,
            notes: heir.notes,
            photo_file_name: heir.photo_file_name,
            photo_file_type: heir.photo_file_type,
            photo_data: heir.photo_data,
            inheritance_amount: amount,
          })
        )
      );
      await loadData();
      toast({ title: 'Montos calculados', description: 'Los pagos quedaron guardados y el árbol fue actualizado.' });
    } catch (error) {
      toast({
        title: 'No se pudieron guardar los montos',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setPaymentSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>

      <DocumentHeader
        title="Árbol Genealógico Sienna"
        subtitle="Visualización clásica dinámica con herederos, foto y monto heredado"
      />

      <div className="mx-auto max-w-[95%] space-y-6">
        <Card className="border border-legal-gold/20">
          <CardContent className="p-5">
            <h3 className="mb-2 font-serif text-lg font-bold text-legal-blue">Criterio automático del caso Alessandro</h3>
            <p className="text-sm leading-relaxed text-gray-700">
              La clasificación usa el contenido ya documentado en la app: Alessandro figura como causante sin descendencia directa;
              las ramas activas salen por Vincenzo/Vicente y Paolo/Paulino; y los herederos determinados son Víctor Manuel Martín,
              Perla Rosa, Bernardo Martín, Jocelyn y Mayra. Los nodos intermedios fallecidos se muestran como soporte de
              representación, no como herederos finales.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Users className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Miembros visibles</p>
                <p className="text-2xl font-bold text-legal-blue">{members.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Landmark className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Herederos finales</p>
                <p className="text-2xl font-bold text-legal-blue">{presentationStats.finalHeirs}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <GitBranch className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Enlaces explicativos</p>
                <p className="text-2xl font-bold text-legal-blue">{presentationStats.connectors}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <ClipboardCheck className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Pendientes</p>
                <p className="text-2xl font-bold text-legal-blue">{presentationStats.pending}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-legal-gold/20">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Calculator className="h-5 w-5" />
              Cálculo de Monto a Heredar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label>Monto total de la herencia</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estateAmount}
                  onChange={(event) => setEstateAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={applyEstateCalculation} disabled={paymentSaving} className="bg-legal-gold hover:bg-legal-gold/90 text-white">
                <Save className="mr-2 h-4 w-4" />
                Calcular y guardar pagos
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {calculatedPayments.map(({ heir, detail, amount }) => (
                <div key={heir.id} className="rounded-md border border-legal-blue/15 bg-white p-3">
                  <p className="text-xs font-semibold leading-tight text-legal-blue">{heir.heir_name}</p>
                  <p className="mt-2 text-sm font-bold text-legal-blue">{formatMoney(amount)}</p>
                  <p className="text-xs text-legal-gray">{detail ? formatPercent(detail.share) : 'Sin porcentaje'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 rounded-md bg-white p-4 shadow">
              <h3 className="mb-2 text-lg font-medium text-legal-blue">Vista clásica dinámica</h3>
              <p className="mb-2 text-gray-700">
                El árbol se arma desde los miembros guardados en base de datos. Al agregar una persona y seleccionar su nodo superior, la rama se reacomoda automáticamente.
              </p>
              <p className="text-sm text-legal-gray">
                <strong>Total usado en pantalla:</strong> {formatMoney(estateAmountNumber || total)}. Miembros en árbol: {members.length}.
              </p>
            </div>

            <div className="w-full overflow-x-auto rounded-md bg-legal-beige/20 p-4">
              <div className="min-w-max">
                {loading ? (
                  <div className="p-8 text-center text-legal-gray">Cargando árbol...</div>
                ) : (
                  <div className="classic-family-tree overflow-auto p-8">
                    <ul className="classic-tree-root flex justify-center gap-8">
                      {forest.map((root) => (
                        <ClassicNode key={root.id} member={root} heirsByName={heirsByName} total={total} estateAmount={estateAmountNumber} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArbolGenealogicoSienna;
