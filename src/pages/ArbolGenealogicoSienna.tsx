import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { api, ConfirmedHeir, SiennaFamilyMember } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  buildDominicanInheritancePlan,
  classifyMemberByDominicanLaw,
  InheritancePlan,
  legalCriterionText,
  normalizeName,
} from '@/lib/dominicanInheritance';
import { cn } from '@/lib/utils';
import { Calculator, ClipboardCheck, FileText, GitBranch, Landmark, Route, Save, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildWhyIInheritText, formatMoney as formatMoneyExplain, formatPercent as formatPercentExplain } from '@/lib/siennaHeirExplain';

type TreeMember = SiennaFamilyMember & { children: TreeMember[] };

const formatMoney = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

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

const explanationRole = (status?: string | null) => {
  if (status === 'confirmado' || status === 'posible_heredero') return 'Heredero final';
  if (status === 'no_hereda') return 'Enlace genealógico';
  return 'Pendiente de explicar';
};

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)}%`;

const ClassicNode = ({
  member,
  heirsByName,
  inheritancePlan,
  total,
  estateAmount,
}: {
  member: TreeMember;
  heirsByName: Map<string, ConfirmedHeir>;
  inheritancePlan: InheritancePlan;
  total: number;
  estateAmount: number;
}) => {
  const heir = heirsByName.get(normalizeName(member.name));
  const inheritanceShare = inheritancePlan.sharesById.get(member.id);
  const savedAmount = Number(heir?.inheritance_amount || 0);
  const isHeir = Boolean(heir || inheritanceShare);
  const inheritanceStatus = heir ? 'confirmado' : (inheritanceShare ? 'posible_heredero' : member.inheritance_status);
  const inheritanceReason = inheritanceShare?.reason || heir?.relationship_summary || member.inheritance_reason;
  const role = inheritanceShare?.role || explanationRole(inheritanceStatus);
  const calculatedAmount = estateAmount > 0 && inheritanceShare ? estateAmount * (inheritanceShare.share / 100) : 0;
  const amount = calculatedAmount || savedAmount;
  const referenceTotal = estateAmount > 0 ? estateAmount : total;
  const share = inheritanceShare?.share || (referenceTotal > 0 && amount > 0 ? (amount / referenceTotal) * 100 : 0);

  return (
    <li className="relative">
      <div className="relative flex flex-col items-center pt-6">
        <div
          className={cn(
            'relative mb-3 w-[min(100%,270px)] min-w-0 max-w-[270px] rounded-md border-2 bg-white p-3 text-center shadow-sm',
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
                {(heir?.line_vincenzo || inheritanceShare?.sources.includes('Vincenzo/Vicente')) && <Badge variant="outline">Vincenzo/Vicente</Badge>}
                {(heir?.line_paolo || inheritanceShare?.sources.includes('Paolo/Paulino')) && <Badge variant="outline">Paolo/Paulino</Badge>}
                <Badge variant={heir?.status === 'confirmado' ? 'default' : 'secondary'}>{heir?.status || 'calculado'}</Badge>
              </div>
              <div className="rounded-md bg-white/80 p-2">
                <p className="text-[11px] uppercase tracking-wide text-legal-gray">Monto heredado</p>
                <p className="font-semibold text-legal-blue">{amount > 0 ? formatMoney(amount) : 'Pendiente de monto'}</p>
                <p className="text-xs text-legal-gray">
                  {share > 0 ? formatPercent(share) : 'Porcentaje pendiente'}
                </p>
              </div>
              {inheritanceShare && (
                <div className="rounded-md bg-legal-blue/5 p-2 text-left">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase text-legal-blue">
                    <Route className="h-3 w-3" />
                    Ruta y pago
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-700">{inheritanceShare.paymentBasis}</p>
                  <p className="mt-1 text-xs leading-relaxed text-legal-gray">{inheritanceShare.route}</p>
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
              <ClassicNode
                key={child.id}
                member={child}
                heirsByName={heirsByName}
                inheritancePlan={inheritancePlan}
                total={total}
                estateAmount={estateAmount}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

const ArbolGenealogicoSienna = () => {
  const { isAdmin } = useAuth();
  const [heirs, setHeirs] = useState<ConfirmedHeir[]>([]);
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [estateAmount, setEstateAmount] = useState('');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [loading, setLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [heirsResponse, membersResponse, settingsResponse] = await Promise.all([
        api.listConfirmedHeirs(),
        api.listSiennaFamilyMembers(),
        api.getSettings(),
      ]);
      setHeirs(heirsResponse.heirs);
      setLawyerFeePercentage(String(settingsResponse.settings.lawyer_fee_percentage ?? 0));
      const plan = buildDominicanInheritancePlan(membersResponse.members);
      setMembers(
        membersResponse.members.map((member) => {
          const classification = classifyMemberByDominicanLaw(member, membersResponse.members);
          return {
            ...member,
            ...classification,
            inheritance_reason: plan.sharesById.get(member.id)?.reason || classification.inheritance_reason,
          };
        })
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
  const lawyerFeePercentageNumber = Math.min(100, Math.max(0, Number(lawyerFeePercentage || 0)));
  const lawyerFeeAmount = estateAmountNumber > 0 ? estateAmountNumber * (lawyerFeePercentageNumber / 100) : 0;
  const distributableEstateAmount = estateAmountNumber > 0 ? Math.max(0, estateAmountNumber - lawyerFeeAmount) : 0;

  const heirsByName = useMemo(
    () => new Map(heirs.map((heir) => [normalizeName(heir.heir_name), heir])),
    [heirs]
  );

  const forest = useMemo(() => buildForest(members), [members]);
  const inheritancePlan = useMemo(() => buildDominicanInheritancePlan(members), [members]);
  const calculatedPayments = useMemo(() => {
    const totalEstate = distributableEstateAmount;
    return inheritancePlan.activeHeirs.map((share) => {
      const heir = heirsByName.get(normalizeName(share.member.name));
      return {
        heir,
        share,
        amount: totalEstate > 0 ? totalEstate * (share.share / 100) : Number(heir?.inheritance_amount || 0),
      };
    });
  }, [distributableEstateAmount, heirsByName, inheritancePlan]);
  const presentationStats = useMemo(() => {
    const classifiedMembers = members.map((member) => ({
      ...member,
      ...classifyMemberByDominicanLaw(member, members),
    }));

    return {
      finalHeirs: classifiedMembers.filter((member) => member.inheritance_status === 'posible_heredero' || member.inheritance_status === 'confirmado').length,
      connectors: classifiedMembers.filter((member) => member.inheritance_status === 'no_hereda').length,
      pending: classifiedMembers.filter((member) => member.inheritance_status === 'requiere_revision').length,
    };
  }, [members]);

  const applyEstateCalculation = async () => {
    const totalEstate = distributableEstateAmount;
    if (!totalEstate || totalEstate <= 0) {
      toast({ title: 'Monto requerido', description: 'Indica el monto total de la herencia para distribuirlo después de abogados.' });
      return;
    }

    setPaymentSaving(true);
    try {
      await Promise.all(
        calculatedPayments.map(({ heir, share, amount }) => {
          const payload = {
            heir_name: share.member.name,
            relationship_summary: share.reason,
            line_vincenzo: share.sources.includes('Vincenzo/Vicente'),
            line_paolo: share.sources.includes('Paolo/Paulino'),
            status: heir?.status || 'mencionado' as const,
            notes: heir?.notes || share.paymentBasis,
            photo_file_name: heir?.photo_file_name,
            photo_file_type: heir?.photo_file_type,
            photo_data: heir?.photo_data,
            inheritance_amount: amount,
          };

          return heir
            ? api.updateConfirmedHeir(heir.id, payload)
            : api.saveConfirmedHeir(payload);
        })
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

  const saveLawyerFee = async () => {
    setSettingsSaving(true);
    try {
      await api.updateSettings({ lawyer_fee_percentage: lawyerFeePercentageNumber });
      toast({ title: 'Porcentaje guardado', description: 'La comisión de la firma quedó guardada para el cálculo Sienna.' });
    } catch (error) {
      toast({
        title: 'No se pudo guardar el porcentaje',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <SiennaPageLayout>
      <div className="mb-4">
        <BackButton />
      </div>

      <DocumentHeader
        title="Árbol Genealógico Sienna"
        subtitle="Visualización clásica dinámica con herederos, foto y monto heredado"
      />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/sienna/explicacion-herederos">
            <FileText className="mr-2 h-4 w-4" />
            Explicación para herederos
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/sienna/miembros-arbol">Administrar miembros</Link>
        </Button>
      </div>

      <div className="w-full space-y-6">
        <Card className="border border-legal-gold/20">
          <CardContent className="p-5">
            <h3 className="mb-2 font-serif text-lg font-bold text-legal-blue">Criterio automático del caso Alessandro</h3>
            <p className="text-sm leading-relaxed text-gray-700">
              {legalCriterionText}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_220px_auto] lg:items-end">
              <div>
                <Label>Monto bruto de la herencia</Label>
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
                  placeholder="0"
                />
              </div>
              <Button
                onClick={applyEstateCalculation}
                disabled={paymentSaving}
                className="w-full bg-legal-gold text-white hover:bg-legal-gold/90 sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Calcular y guardar pagos
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-legal-blue/15 bg-white p-3">
                <p className="text-xs uppercase text-legal-gray">Monto bruto</p>
                <p className="font-bold text-legal-blue">{formatMoney(estateAmountNumber || total)}</p>
              </div>
              <div className="rounded-md border border-legal-blue/15 bg-white p-3">
                <p className="text-xs uppercase text-legal-gray">Firma de abogados</p>
                <p className="font-bold text-legal-blue">{formatMoney(lawyerFeeAmount)}</p>
                <p className="text-xs text-legal-gray">{formatPercent(lawyerFeePercentageNumber)}</p>
              </div>
              <div className="rounded-md border border-legal-blue/15 bg-white p-3">
                <p className="text-xs uppercase text-legal-gray">Neto a distribuir</p>
                <p className="font-bold text-legal-blue">{formatMoney(distributableEstateAmount || total)}</p>
              </div>
            </div>

            {isAdmin && (
              <Button variant="outline" onClick={saveLawyerFee} disabled={settingsSaving}>
                Guardar % de abogados
              </Button>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {calculatedPayments.map(({ heir, share, amount }) => (
                <div key={share.member.id} className="rounded-md border border-legal-blue/15 bg-white p-3">
                  <p className="text-xs font-semibold leading-tight text-legal-blue">{heir?.heir_name || share.member.name}</p>
                  <p className="mt-2 text-sm font-bold text-legal-blue">{formatMoney(amount)}</p>
                  <p className="text-xs text-legal-gray">{formatPercent(share.share)}</p>
                </div>
              ))}
            </div>

            {inheritancePlan.activeHeirs.length > 0 && (
              <div className="space-y-3 border-t border-legal-blue/10 pt-4">
                <h4 className="font-serif text-base font-bold text-legal-blue">Por qué heredan (resumen)</h4>
                <div className="grid gap-3 lg:grid-cols-2">
                  {inheritancePlan.activeHeirs.map((share) => {
                    const amount =
                      distributableEstateAmount > 0
                        ? distributableEstateAmount * (share.share / 100)
                        : Number(heirsByName.get(normalizeName(share.member.name))?.inheritance_amount || 0);
                    return (
                      <div key={share.member.id} className="rounded-md border border-legal-gold/25 bg-legal-gold/5 p-3">
                        <p className="font-medium text-legal-blue">{share.member.name}</p>
                        <p className="mt-1 text-xs text-legal-gray">
                          {formatPercentExplain(share.share)} · {formatMoneyExplain(amount)}
                        </p>
                        <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-gray-700">
                          {buildWhyIInheritText(share, share.share, amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                <strong>Neto usado en pantalla:</strong> {formatMoney(distributableEstateAmount || total)}. Miembros en árbol: {members.length}.
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
                        <ClassicNode
                          key={root.id}
                          member={root}
                          heirsByName={heirsByName}
                          inheritancePlan={inheritancePlan}
                          total={total}
                          estateAmount={distributableEstateAmount}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiennaPageLayout>
  );
};

export default ArbolGenealogicoSienna;
