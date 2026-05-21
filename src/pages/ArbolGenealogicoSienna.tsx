import React, { useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { api, ConfirmedHeir, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { formatUnionLabel, getParentLinksForChild, resolveSpouseDisplayLabel, resolveSpousePartner, SiennaGenealogyBundle } from '@/lib/siennaGenealogy';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  applySiennaCaseConfig,
  buildDominicanInheritancePlan,
  InheritancePlan,
  legalCriterionText,
  normalizeName,
  resolveEffectiveInheritanceStatus,
} from '@/lib/dominicanInheritance';
import { cn } from '@/lib/utils';
import { Calculator, ClipboardCheck, FileText, GitBranch, GitMerge, Landmark, Maximize2, Minimize2, Printer, RotateCcw, Route, Save, Users, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildWhyIInheritText, formatMoney as formatMoneyExplain, formatPercent as formatPercentExplain } from '@/lib/siennaHeirExplain';
import { buildCalculationPayload, buildMembersHash, calculateHeirAmount, parseCalculationPayload } from '@/lib/siennaCalculation';

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

const buildForest = (members: SiennaFamilyMember[], bundle?: SiennaGenealogyBundle) => {
  const byId = new Map<string, TreeMember>();
  members.forEach((member) => {
    byId.set(member.id, { ...member, children: [] });
  });

  const childToParent = new Map<string, string>();

  byId.forEach((member) => {
    const parentId = member.parent_id?.trim();
    if (parentId && byId.has(parentId) && parentId !== member.id) {
      childToParent.set(member.id, parentId);
    }
  });

  if (bundle?.parent_links.length) {
    for (const link of bundle.parent_links) {
      const childId = (link.child_member_id || '').trim();
      const parentId = (link.parent_member_id || '').trim();
      if (!childId || !parentId || childId === parentId || !byId.has(childId) || !byId.has(parentId)) continue;
      if (!childToParent.has(childId)) {
        childToParent.set(childId, parentId);
      }
    }
  }

  childToParent.forEach((parentId, childId) => {
    const child = byId.get(childId);
    const parent = byId.get(parentId);
    if (!child || !parent) return;
    if (!parent.children.some((item) => item.id === childId)) {
      parent.children.push(child);
    }
  });

  const attached = new Set(childToParent.keys());
  const roots = Array.from(byId.values()).filter((member) => !attached.has(member.id));

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

const normalizedMemberId = (value: string | null | undefined) => (value || '').trim();

const ClassicNode = ({
  member,
  heirsByMemberId,
  heirsByName,
  inheritancePlan,
  total,
  estateAmount,
  membersById,
  allMembers,
  genealogy,
}: {
  member: TreeMember;
  heirsByMemberId: Map<string, ConfirmedHeir>;
  heirsByName: Map<string, ConfirmedHeir>;
  inheritancePlan: InheritancePlan;
  total: number;
  estateAmount: number;
  membersById: Map<string, SiennaFamilyMember>;
  allMembers: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
}) => {
  const heir = heirsByMemberId.get(member.id) || heirsByName.get(normalizeName(member.name));
  const inheritanceShare = inheritancePlan.sharesById.get(member.id);
  const savedAmount = Number(heir?.inheritance_amount || 0);
  const isHeir = Boolean(heir || inheritanceShare);
  const inheritanceStatus = heir ? 'confirmado' : (inheritanceShare ? 'posible_heredero' : member.inheritance_status);
  const inheritanceReason = inheritanceShare?.reason || heir?.relationship_summary || member.inheritance_reason;
  const role = inheritanceShare?.role || explanationRole(inheritanceStatus);
  const calculatedAmount =
    inheritanceShare && estateAmount > 0
      ? calculateHeirAmount(inheritanceShare.share, estateAmount)
      : 0;
  const amount = calculatedAmount > 0 ? calculatedAmount : savedAmount;
  const referenceTotal = estateAmount > 0 ? estateAmount : total;
  const share = inheritanceShare?.share || (referenceTotal > 0 && amount > 0 ? (amount / referenceTotal) * 100 : 0);
  const parent = member.parent_id ? membersById.get(normalizedMemberId(member.parent_id)) || null : null;
  const otherParent = parent ? resolveSpousePartner(parent, allMembers, genealogy, 'calculation') : null;
  const spouseLabel = resolveSpouseDisplayLabel(member, allMembers, genealogy);
  const hasDualLineage = (inheritanceShare?.sources.length || 0) > 1;
  const childLinks = getParentLinksForChild(member.id, genealogy.parent_links);
  const unionLink = childLinks.find((link: MemberParentLink) => link.union_id);
  const filiationUnion = unionLink?.union_id
    ? genealogy.unions.find((union) => union.id === unionLink.union_id) || null
    : null;

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
          {heir?.photo_data && (
            <div className="absolute -right-3 -top-3 z-10">
              <Avatar className="h-14 w-14 rounded-xl border-2 border-legal-gold/60 shadow-lg">
                <AvatarImage src={heir.photo_data} alt={member.name} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-legal-blue/10 text-legal-blue font-semibold">
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

          {spouseLabel && (
            <div className="mt-1 text-xs">
              <span className="text-legal-gray">Cónyuge: </span>
              {spouseLabel}
            </div>
          )}

          {filiationUnion && (
            <div className="mt-1 text-xs text-legal-blue">
              <span className="text-legal-gray">Filiación: </span>
              {formatUnionLabel(filiationUnion, membersById)}
            </div>
          )}

          {(parent || otherParent) && (
            <div className="mt-2 rounded-md bg-legal-blue/5 p-2 text-left">
              {parent && (
                <p className="text-xs leading-relaxed text-legal-gray">
                  <span className="font-semibold text-legal-blue">Padre/Madre base: </span>
                  {parent.name}
                </p>
              )}
              {otherParent && (
                <p className="mt-1 text-xs leading-relaxed text-legal-gray">
                  <span className="font-semibold text-legal-blue">Otro vínculo parental: </span>
                  {otherParent.name}
                </p>
              )}
              {parent && otherParent && (
                <div className="mt-2 rounded border border-legal-gold/30 bg-white/80 p-2">
                  <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-legal-blue">
                    <GitMerge className="h-3 w-3" />
                    Cruce transversal de ramas
                  </p>
                  <div className="dual-lineage-connector mt-1">
                    <span className="dual-lineage-dot dual-lineage-dot-left" />
                    <span className="dual-lineage-dot dual-lineage-dot-right" />
                  </div>
                </div>
              )}
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
                {hasDualLineage && <Badge variant="default">Doble linaje</Badge>}
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
          <ul className={cn('classic-tree-children relative', member.children.length > 1 && 'has-multiple')}>
            {member.children.map((child) => (
              <ClassicNode
                key={child.id}
                member={child}
                heirsByMemberId={heirsByMemberId}
                heirsByName={heirsByName}
                inheritancePlan={inheritancePlan}
                total={total}
                estateAmount={estateAmount}
                membersById={membersById}
                allMembers={allMembers}
                genealogy={genealogy}
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
  const [genealogy, setGenealogy] = useState<SiennaGenealogyBundle>({ unions: [], parent_links: [] });
  const [estateAmount, setEstateAmount] = useState('');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [snapshotNote, setSnapshotNote] = useState('');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanningTree, setIsPanningTree] = useState(false);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Cargando árbol y cálculos sucesorales...');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const treeScreenRef = useRef<HTMLDivElement | null>(null);
  const treeViewportRef = useRef<HTMLDivElement | null>(null);
  const treePanRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const loadData = async () => {
    setLoading(true);
    setLoadingMessage('Consultando miembros, herederos y configuración...');
    try {
      const [heirsResponse, membersResponse, settingsResponse] = await Promise.all([
        api.listConfirmedHeirs(),
        api.listSiennaFamilyMembers(),
        api.getSettings(),
      ]);
      setLoadingMessage('Aplicando configuración del caso y preparando cálculo...');
      const dbMembers = membersResponse.members;
      applySiennaCaseConfig(settingsResponse.settings.sienna_case_config);
      setHeirs(heirsResponse.heirs);
      setLawyerFeePercentage(String(settingsResponse.settings.lawyer_fee_percentage ?? 0));
      try {
        setLoadingMessage('Validando snapshot más reciente...');
        const latestSnapshotResponse = await api.getLatestSiennaCalculationSnapshot();
        if (latestSnapshotResponse.snapshot) {
          const currentMembersHash = buildMembersHash(dbMembers.map((member) => member.id));
          if (
            latestSnapshotResponse.snapshot.members_hash &&
            latestSnapshotResponse.snapshot.members_hash !== currentMembersHash
          ) {
            toast({
              title: 'Snapshot desactualizado',
              description: 'El último snapshot no coincide con los miembros actuales de la DB. Revise y regenere el cálculo.',
              variant: 'destructive',
            });
          }
          const parsedPayload = parseCalculationPayload(latestSnapshotResponse.snapshot.payload_json);
          if (parsedPayload?.notes) {
            setSnapshotNote(parsedPayload.notes);
          }
          setEstateAmount(String(latestSnapshotResponse.snapshot.estate_amount ?? 0));
          setLawyerFeePercentage(String(latestSnapshotResponse.snapshot.lawyer_fee_percentage ?? 0));
          setLastSnapshotAt(latestSnapshotResponse.snapshot.created_at || null);
        } else {
          setLastSnapshotAt(null);
        }
      } catch {
        // Snapshot endpoint puede no existir temporalmente en backend local viejo.
        setLastSnapshotAt(null);
      }
      setLoadingMessage('Renderizando árbol genealógico...');
      setMembers(dbMembers);
      setGenealogy({
        unions: membersResponse.unions || [],
        parent_links: membersResponse.parent_links || [],
      });
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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const stopTreePan = () => {
      treePanRef.current.dragging = false;
      setIsPanningTree(false);
    };
    window.addEventListener('mouseup', stopTreePan);
    return () => {
      window.removeEventListener('mouseup', stopTreePan);
    };
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
  const heirsByMemberId = useMemo(
    () => new Map(heirs.filter((heir) => heir.sienna_member_id).map((heir) => [String(heir.sienna_member_id), heir])),
    [heirs]
  );
  const membersById = useMemo(
    () => new Map(members.map((member) => [normalizedMemberId(member.id), member])),
    [members]
  );

  const forest = useMemo(() => buildForest(members, genealogy), [genealogy, members]);
  const orphanMembers = useMemo(() => {
    const ids = new Set(members.map((member) => member.id));
    return members.filter((member) => member.parent_id && !ids.has(member.parent_id));
  }, [members]);
  const inheritancePlan = useMemo(() => buildDominicanInheritancePlan(members, genealogy), [genealogy, members]);
  const dualLineageRows = useMemo(
    () =>
      inheritancePlan.activeHeirs
        .filter((share) => share.sources.length > 1)
        .map((share) => {
          const baseParent = share.member.parent_id
            ? membersById.get(normalizedMemberId(share.member.parent_id)) || null
            : null;
          const linkedParent = baseParent
            ? resolveSpousePartner(baseParent, members, genealogy, 'calculation')
            : null;
          return {
            memberId: share.member.id,
            memberName: share.member.name,
            sources: share.sources.join(' + '),
            baseParentName: baseParent?.name || 'No definido',
            linkedParentName: linkedParent?.name || 'No definido',
          };
        }),
    [genealogy, inheritancePlan.activeHeirs, members, membersById]
  );
  const calculatedPayments = useMemo(() => {
    const totalEstate = distributableEstateAmount;
    return inheritancePlan.activeHeirs.map((share) => {
      const heir = heirsByMemberId.get(share.member.id) || heirsByName.get(normalizeName(share.member.name));
      return {
        heir,
        share,
        amount: totalEstate > 0 ? calculateHeirAmount(share.share, totalEstate) : Number(heir?.inheritance_amount || 0),
      };
    });
  }, [distributableEstateAmount, heirsByMemberId, heirsByName, inheritancePlan]);
  const presentationStats = useMemo(
    () => ({
      finalHeirs: inheritancePlan.activeHeirs.length,
      connectors: members.filter(
        (member) => resolveEffectiveInheritanceStatus(member, members, genealogy) === 'no_hereda'
      ).length,
      pending: members.filter(
        (member) => resolveEffectiveInheritanceStatus(member, members, genealogy) === 'requiere_revision'
      ).length,
    }),
    [genealogy, inheritancePlan, members]
  );

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
            sienna_member_id: share.member.id,
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
      await api.saveSiennaCalculationSnapshot({
        estate_amount: estateAmountNumber,
        lawyer_fee_percentage: lawyerFeePercentageNumber,
        distributable_amount: totalEstate,
        members_hash: buildMembersHash(members.map((member) => member.id)),
        payload_json: JSON.stringify(
          buildCalculationPayload(
            inheritancePlan,
            totalEstate,
            snapshotNote || 'Snapshot guardado desde Árbol Sienna (calcular y guardar pagos).'
          )
        ),
      });
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

  const toggleFullscreen = async () => {
    if (!document.fullscreenEnabled) {
      toast({
        title: 'Pantalla completa no disponible',
        description: 'Este navegador no permite pantalla completa en este momento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (!treeScreenRef.current) return;
      await treeScreenRef.current.requestFullscreen();
    } catch (error) {
      toast({
        title: 'No se pudo activar pantalla completa',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  const onTreeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !treeViewportRef.current) return;
    treePanRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: treeViewportRef.current.scrollLeft,
      scrollTop: treeViewportRef.current.scrollTop,
    };
    setIsPanningTree(true);
  };

  const onTreeMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!treePanRef.current.dragging || !treeViewportRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - treePanRef.current.startX;
    const deltaY = event.clientY - treePanRef.current.startY;
    treeViewportRef.current.scrollLeft = treePanRef.current.scrollLeft - deltaX;
    treeViewportRef.current.scrollTop = treePanRef.current.scrollTop - deltaY;
  };

  const stopTreePan = () => {
    treePanRef.current.dragging = false;
    setIsPanningTree(false);
  };

  const printTree = () => {
    const treeVisual = treeViewportRef.current?.querySelector('.classic-family-tree');
    if (!treeVisual) {
      toast({
        title: 'No se pudo preparar impresión',
        description: 'No se encontró el área visual del árbol.',
        variant: 'destructive',
      });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      toast({
        title: 'No se pudo abrir impresión',
        description: 'Permite ventanas emergentes para imprimir el árbol.',
        variant: 'destructive',
      });
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Árbol Sienna</title>
          ${styles}
          <style>
            body { margin: 16px; background: #fff; }
            .classic-family-tree { overflow: visible !important; }
          </style>
        </head>
        <body>
          <h2 style="margin:0 0 12px 0;color:#173f73;">Árbol Sienna</h2>
          ${treeVisual.outerHTML}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      ref={treeScreenRef}
      className={`app-shell py-8 ${isPresentationMode ? 'max-w-none px-2 sm:px-3 lg:px-4' : ''} ${isFullscreen ? 'bg-legal-beige' : ''}`}
    >
      <BackButton />

      <DocumentHeader
        title="Árbol Genealógico Sienna"
        subtitle="Visualización clásica dinámica con herederos, foto y monto heredado"
        helpKey="sienna-arbol"
      />
      <SoftLoadingIndicator active={loading} message={loadingMessage} />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant={isFullscreen ? 'default' : 'outline'} size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <>
              <Minimize2 className="mr-2 h-4 w-4" />
              Salir pantalla completa
            </>
          ) : (
            <>
              <Maximize2 className="mr-2 h-4 w-4" />
              Pantalla completa
            </>
          )}
        </Button>
        <Button variant={isPresentationMode ? 'default' : 'outline'} size="sm" onClick={() => setIsPresentationMode((current) => !current)}>
          {isPresentationMode ? 'Salir modo exposición' : 'Modo exposición'}
        </Button>
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

      <div className="space-y-6">
        <Card className="border border-legal-gold/20">
          <CardContent className="p-5">
            <h3 className="mb-2 font-serif text-lg font-bold text-legal-blue">Criterio automático del caso Alessandro</h3>
            <p className="text-sm leading-relaxed text-gray-700">
              {legalCriterionText}
            </p>
          </CardContent>
        </Card>

        {orphanMembers.length > 0 && (
          <Card className="border border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-800">
                Hay miembros sin conexión válida al árbol ({orphanMembers.length}).
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Revise en “Miembros del Árbol” los nodos cuyo superior no existe (parent_id inválido) para que vuelvan a conectarse visualmente.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border border-legal-gold/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-legal-gray">Último snapshot de cálculo Sienna</p>
            <p className="mt-1 text-sm text-legal-blue">
              {lastSnapshotAt ? new Date(lastSnapshotAt).toLocaleString('es-DO') : 'Aún no hay snapshots guardados.'}
            </p>
          </CardContent>
        </Card>

        {dualLineageRows.length > 0 && (
          <Card className="border border-legal-blue/20">
            <CardHeader className="bg-legal-blue/5 border-b">
              <CardTitle className="text-base text-legal-blue">Cruces de ramas (doble linaje)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {dualLineageRows.map((row) => (
                <div key={row.memberId} className="rounded-md border border-legal-blue/15 bg-white p-3">
                  <p className="font-semibold text-legal-blue">{row.memberName}</p>
                  <p className="mt-1 text-xs text-legal-gray">Ramas activas: {row.sources}</p>
                  <p className="mt-1 text-xs text-legal-gray">
                    Padre/Madre base: {row.baseParentName} · Otro vínculo parental: {row.linkedParentName}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
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
              <Button onClick={applyEstateCalculation} disabled={paymentSaving} className="bg-legal-gold hover:bg-legal-gold/90 text-white">
                <Save className="mr-2 h-4 w-4" />
                Calcular y guardar pagos
              </Button>
            </div>
            <div>
              <Label>Nota del snapshot (auditoría de reunión)</Label>
              <Input
                value={snapshotNote}
                onChange={(event) => setSnapshotNote(event.target.value)}
                placeholder="Ej: Reunión 19/05, excluidos provisionales X e Y."
              />
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

            <div className="grid gap-3 md:grid-cols-5">
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
                        ? calculateHeirAmount(share.share, distributableEstateAmount)
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
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-medium text-legal-blue">Vista clásica dinámica</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-legal-blue/20 bg-white px-2 py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setZoomLevel((current) => Math.max(0.4, Number((current - 0.1).toFixed(2))))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[52px] text-center text-xs font-semibold text-legal-blue">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setZoomLevel((current) => Math.min(1.8, Number((current + 0.1).toFixed(2))))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setZoomLevel(1)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={printTree}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir árbol
                </Button>
                </div>
              </div>
              <p className="mb-2 text-gray-700">
                El árbol se arma desde los miembros guardados en base de datos. Al agregar una persona y seleccionar su nodo superior, la rama se reacomoda automáticamente.
              </p>
              <p className="text-sm text-legal-gray">
                <strong>Neto usado en pantalla:</strong> {formatMoney(distributableEstateAmount || total)}. Miembros en árbol: {members.length}.
              </p>
            </div>

            <div
              ref={treeViewportRef}
              className={`w-full overflow-auto rounded-md bg-legal-beige/20 p-4 select-none ${isPanningTree ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={onTreeMouseDown}
              onMouseMove={onTreeMouseMove}
              onMouseUp={stopTreePan}
              onMouseLeave={stopTreePan}
            >
              <div className="min-w-max">
                {loading ? (
                  <div className="p-8 text-center text-legal-gray">Cargando árbol...</div>
                ) : (
                  <div className="classic-family-tree overflow-auto p-8">
                    <div
                      style={{
                        zoom: zoomLevel,
                        transformOrigin: 'top left',
                        width: 'fit-content',
                        margin: '0',
                      }}
                    >
                      {forest.length > 1 && (
                        <p className="mb-3 text-xs text-amber-700">
                          Hay {forest.length} raíces en el árbol. Revise vínculos parentales en Miembros del Árbol si espera una sola raíz.
                        </p>
                      )}
                      <ul className="classic-tree-root">
                        {forest.map((root) => (
                          <ClassicNode
                            key={root.id}
                            member={root}
                            heirsByMemberId={heirsByMemberId}
                            heirsByName={heirsByName}
                            inheritancePlan={inheritancePlan}
                            total={total}
                            estateAmount={distributableEstateAmount}
                            membersById={membersById}
                            allMembers={members}
                            genealogy={genealogy}
                          />
                        ))}
                      </ul>
                    </div>
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
