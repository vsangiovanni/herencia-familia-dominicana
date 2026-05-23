import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { api, ConfirmedHeir, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { invalidateSiennaData, useSiennaCalculation, useSiennaWorkspace } from '@/hooks/useSiennaData';
import { formatUnionLabel, getParentLinksForChild, resolveSpouseDisplayLabel, SiennaGenealogyBundle } from '@/lib/siennaGenealogy';
import MemberVerificationBadge from '@/components/sienna/MemberVerificationBadge';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import MemberDetailSheet from '@/components/sienna/MemberDetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  applySiennaCaseConfig,
  InheritancePlan,
  legalCriterionText,
  normalizeName,
} from '@/lib/dominicanInheritance';
import { getMemberEffectiveInheritanceReason, getMemberEffectiveInheritanceStatus } from '@/lib/siennaMemberInheritance';
import { cn } from '@/lib/utils';
import { Calculator, ClipboardCheck, FileText, GitBranch, GitMerge, Landmark, Maximize2, Minimize2, Printer, RotateCcw, Route, Save, Users, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildWhyIInheritText, formatMoney as formatMoneyExplain, formatPercent as formatPercentExplain } from '@/lib/siennaHeirExplain';
import { buildInheritancePlanFromApiRows } from '@/lib/siennaCalculation';

type TreeMember = SiennaFamilyMember & { children: TreeMember[] };

const formatMoney = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));

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
const isDeceasedMember = (member: SiennaFamilyMember) => Boolean(member.death?.trim());
const MIN_TREE_ZOOM = 0.15;
const MAX_TREE_ZOOM = 2.5;
const clampTreeZoom = (value: number) => Math.min(MAX_TREE_ZOOM, Math.max(MIN_TREE_ZOOM, value));

const resolveFormalOtherParent = (
  child: SiennaFamilyMember,
  baseParent: SiennaFamilyMember | null,
  membersById: Map<string, SiennaFamilyMember>,
  genealogy: SiennaGenealogyBundle
) => {
  if (!baseParent) return null;

  const baseParentId = normalizedMemberId(baseParent.id);
  const childLinks = getParentLinksForChild(child.id, genealogy.parent_links);
  const explicitOtherParent = childLinks
    .map((link) => normalizedMemberId(link.parent_member_id))
    .filter((parentId) => parentId && parentId !== baseParentId)
    .map((parentId) => membersById.get(parentId))
    .find((parent): parent is SiennaFamilyMember => Boolean(parent));

  if (explicitOtherParent) return explicitOtherParent;

  const baseParentUnionId = childLinks.find(
    (link) =>
      normalizedMemberId(link.parent_member_id) === baseParentId &&
      normalizedMemberId(link.union_id)
  )?.union_id;

  if (!baseParentUnionId) return null;

  const union = genealogy.unions.find((item) => item.id === baseParentUnionId);
  if (!union) return null;

  const partnerA = normalizedMemberId(union.partner_a_member_id);
  const partnerB = normalizedMemberId(union.partner_b_member_id);
  const otherParentId = partnerA === baseParentId ? partnerB : partnerB === baseParentId ? partnerA : '';
  return otherParentId ? membersById.get(otherParentId) || null : null;
};

const ClassicNode = ({
  member,
  heirsByMemberId,
  heirsByName,
  inheritancePlan,
  calculationAmountsByMemberId,
  total,
  estateAmount,
  membersById,
  allMembers,
  genealogy,
  onOpenMember,
}: {
  member: TreeMember;
  heirsByMemberId: Map<string, ConfirmedHeir>;
  heirsByName: Map<string, ConfirmedHeir>;
  inheritancePlan: InheritancePlan;
  calculationAmountsByMemberId: Map<string, number>;
  total: number;
  estateAmount: number;
  membersById: Map<string, SiennaFamilyMember>;
  allMembers: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
  onOpenMember: (memberId: string) => void;
}) => {
  const heir = heirsByMemberId.get(member.id) || heirsByName.get(normalizeName(member.name));
  const inheritanceShare = inheritancePlan.sharesById.get(member.id);
  const savedAmount = Number(heir?.inheritance_amount || 0);
  const isHeir = Boolean(heir || inheritanceShare);
  const inheritanceStatus = heir
    ? 'confirmado'
    : inheritanceShare
      ? 'posible_heredero'
      : getMemberEffectiveInheritanceStatus(member);
  const inheritanceReason =
    inheritanceShare?.reason ||
    heir?.relationship_summary ||
    getMemberEffectiveInheritanceReason(member) ||
    null;
  const role = inheritanceShare?.role || explanationRole(inheritanceStatus);
  const calculatedAmount =
    inheritanceShare ? calculationAmountsByMemberId.get(member.id) || 0 : 0;
  const amount = calculatedAmount > 0 ? calculatedAmount : savedAmount;
  const referenceTotal = estateAmount > 0 ? estateAmount : total;
  const share = inheritanceShare?.share || (referenceTotal > 0 && amount > 0 ? (amount / referenceTotal) * 100 : 0);
  const parent = member.parent_id ? membersById.get(normalizedMemberId(member.parent_id)) || null : null;
  const otherParent = resolveFormalOtherParent(member, parent, membersById, genealogy);
  const spouseLabel = resolveSpouseDisplayLabel(member, allMembers, genealogy);
  const hasDualLineage = (inheritanceShare?.sources.length || 0) > 1;
  const childLinks = getParentLinksForChild(member.id, genealogy.parent_links);
  const unionLink = childLinks.find((link: MemberParentLink) => link.union_id);
  const filiationUnion = unionLink?.union_id
    ? genealogy.unions.find((union) => union.id === unionLink.union_id) || null
    : null;
  const isDeceased = isDeceasedMember(member);

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
          {isDeceased && (
            <div
              className="deceased-ribbon-badge right-12 top-2"
              title={member.death ? `Fallecido: ${member.death}` : 'Fallecido'}
              aria-label={member.death ? `Fallecido: ${member.death}` : 'Fallecido'}
            >
              <span className="deceased-ribbon" aria-hidden="true" />
            </div>
          )}

          <div className="absolute -right-3 -top-3 z-10">
            <MemberPhoto
              name={member.name}
              memberId={member.id}
              photoData={heir?.photo_data}
              size="lg"
              rounded="xl"
              className="border-2 border-legal-gold/60 shadow-lg"
            />
          </div>

          <h3 className="font-serif text-sm font-bold leading-tight text-legal-blue">{member.name}</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs text-legal-blue"
            onClick={() => onOpenMember(member.id)}
          >
            Ficha
          </Button>

          <MemberVerificationBadge
            member={member}
            members={allMembers}
            genealogy={genealogy}
            className="mt-2 justify-center"
          />

          <div className="mt-1 text-xs text-gray-600">
            {member.birth && <span>n. {member.birth}</span>}
            {member.birth && member.death && <span> - </span>}
            {member.death && <span>m. {member.death}</span>}
          </div>

          {isDeceased && (
            <div className="mt-2 flex justify-center">
              <Badge variant="outline" className="border-gray-400 bg-gray-50 text-gray-800">
                Fallecido
              </Badge>
            </div>
          )}

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
                calculationAmountsByMemberId={calculationAmountsByMemberId}
                total={total}
                estateAmount={estateAmount}
                membersById={membersById}
                allMembers={allMembers}
                genealogy={genealogy}
                onOpenMember={onOpenMember}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

const ArbolGenealogicoSienna = () => {
  const queryClient = useQueryClient();
  const { data: workspace, isLoading, isFetching, refetch } = useSiennaWorkspace(true);
  const members = workspace?.members ?? [];
  const heirs = workspace?.heirs ?? [];
  const genealogy = useMemo<SiennaGenealogyBundle>(
    () => ({
      unions: workspace?.unions ?? [],
      parent_links: workspace?.parent_links ?? [],
    }),
    [workspace]
  );
  const [estateAmount, setEstateAmount] = useState('');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanningTree, setIsPanningTree] = useState(false);
  const [workspaceInitialized, setWorkspaceInitialized] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando árbol y cálculos sucesorales...');
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [treePan, setTreePan] = useState({ x: 40, y: 40 });
  const treeScreenRef = useRef<HTMLDivElement | null>(null);
  const treeViewportRef = useRef<HTMLDivElement | null>(null);
  const treeWorldRef = useRef<HTMLDivElement | null>(null);
  const treePanRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const treePinchRef = useRef({
    active: false,
    distance: 0,
    zoom: 1,
    centerX: 0,
    centerY: 0,
  });
  const detailMember = useMemo(
    () => members.find((member) => member.id === detailMemberId) || null,
    [detailMemberId, members]
  );

  const loadData = async () => {
    setLoadingMessage('Actualizando datos del árbol...');
    await refetch();
  };

  useEffect(() => {
    if (!workspace || workspaceInitialized) return;

    applySiennaCaseConfig(workspace.settings.sienna_case_config);
    setEstateAmount(String(workspace.settings.estate_amount ?? 0));
    setLawyerFeePercentage(String(workspace.settings.lawyer_fee_percentage ?? 0));
    setWorkspaceInitialized(true);
  }, [workspace, workspaceInitialized]);

  useEffect(() => {
    if (isLoading) {
      setLoadingMessage('Consultando miembros, herederos y configuración...');
      return;
    }
    if (isFetching) {
      setLoadingMessage('Actualizando datos del árbol...');
      return;
    }
    if (workspace) {
      setLoadingMessage('Renderizando árbol genealógico...');
    }
  }, [isFetching, isLoading, workspace]);

  const loading = isLoading || !workspaceInitialized;

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
      treePinchRef.current.active = false;
      setIsPanningTree(false);
    };
    window.addEventListener('mouseup', stopTreePan);
    return () => {
      window.removeEventListener('mouseup', stopTreePan);
    };
  }, []);

  const centerTree = (nextZoom = zoomLevel) => {
    const viewport = treeViewportRef.current;
    const world = treeWorldRef.current;
    if (!viewport || !world) return;
    const worldWidth = world.scrollWidth;
    const worldHeight = world.scrollHeight;
    if (!worldWidth || !worldHeight) return;
    setTreePan({
      x: (viewport.clientWidth - worldWidth * nextZoom) / 2,
      y: Math.max(24, (viewport.clientHeight - worldHeight * nextZoom) / 2),
    });
  };

  const fitTreeToScreen = () => {
    const viewport = treeViewportRef.current;
    const world = treeWorldRef.current;
    if (!viewport || !world) return;
    const worldWidth = world.scrollWidth;
    const worldHeight = world.scrollHeight;
    if (!worldWidth || !worldHeight) return;
    const padding = 56;
    const nextZoom = clampTreeZoom(
      Math.min(
        (viewport.clientWidth - padding) / worldWidth,
        (viewport.clientHeight - padding) / worldHeight
      )
    );
    setZoomLevel(Number(nextZoom.toFixed(3)));
    centerTree(nextZoom);
  };

  const total = useMemo(
    () => heirs.reduce((sum, heir) => sum + Number(heir.inheritance_amount || 0), 0),
    [heirs]
  );
  const { data: realtimeCalculationData, isFetching: isFetchingCalculation } = useSiennaCalculation(
    estateAmount,
    lawyerFeePercentage
  );
  const realtimeCalculation = realtimeCalculationData?.calculation;
  const {
    grossAmount: estateAmountNumber = 0,
    lawyerFeePercentage: lawyerFeePercentageNumber = 0,
    lawyerFeeAmount = 0,
    distributableAmount: distributableEstateAmount = 0,
  } = realtimeCalculation?.estate ?? {};

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
  useEffect(() => {
    if (loading || !forest.length) return;
    const frame = window.requestAnimationFrame(() => fitTreeToScreen());
    return () => window.cancelAnimationFrame(frame);
  }, [forest.length, loading]);
  const orphanMembers = useMemo(() => {
    const ids = new Set(members.map((member) => member.id));
    return members.filter((member) => member.parent_id && !ids.has(member.parent_id));
  }, [members]);
  const inheritancePlan = useMemo(
    () => buildInheritancePlanFromApiRows(realtimeCalculation?.active_heirs ?? [], members),
    [members, realtimeCalculation?.active_heirs]
  );
  const calculationAmountsByMemberId = useMemo(
    () => new Map((realtimeCalculation?.active_heirs ?? []).map((row) => [row.member_id, Number(row.amount || 0)])),
    [realtimeCalculation?.active_heirs]
  );
  const dualLineageRows = useMemo(
    () =>
      inheritancePlan.activeHeirs
        .filter((share) => share.sources.length > 1)
        .map((share) => {
          const baseParent = share.member.parent_id
            ? membersById.get(normalizedMemberId(share.member.parent_id)) || null
            : null;
          return {
            memberId: share.member.id,
            memberName: share.member.name,
            sources: share.sources.join(' + '),
            baseParentName: baseParent?.name || 'No definido',
            linkedParentName: resolveFormalOtherParent(share.member, baseParent, membersById, genealogy)?.name || 'No definido',
            routes: share.sourceBreakdown.flatMap((segment) => segment.routes),
          };
        })
        .sort((left, right) => left.memberName.localeCompare(right.memberName, 'es', { sensitivity: 'base' })),
    [genealogy, inheritancePlan.activeHeirs, members, membersById]
  );
  const calculatedPayments = useMemo(() => {
    const totalEstate = distributableEstateAmount;
    const calculationRowsByMemberId = new Map(
      (realtimeCalculation?.active_heirs ?? []).map((row) => [row.member_id, row])
    );
    return inheritancePlan.activeHeirs.map((share) => {
      const heir = heirsByMemberId.get(share.member.id) || heirsByName.get(normalizeName(share.member.name));
      return {
        heir,
        share,
        amount: totalEstate > 0 ? calculationRowsByMemberId.get(share.member.id)?.amount || 0 : Number(heir?.inheritance_amount || 0),
      };
    }).sort((left, right) => left.share.member.name.localeCompare(right.share.member.name, 'es', { sensitivity: 'base' }));
  }, [distributableEstateAmount, heirsByMemberId, heirsByName, inheritancePlan, realtimeCalculation?.active_heirs]);
  const activePaymentHeirIds = useMemo(
    () => new Set(calculatedPayments.map(({ heir }) => heir?.id).filter((id): id is string => Boolean(id))),
    [calculatedPayments]
  );
  const presentationStats = useMemo(() => {
    const connectors = members.filter((member) => getMemberEffectiveInheritanceStatus(member) === 'no_hereda').length;
    const pending = members.filter((member) => getMemberEffectiveInheritanceStatus(member) === 'requiere_revision').length;
    return {
      finalHeirs: inheritancePlan.activeHeirs.length,
      connectors,
      pending,
    };
  }, [inheritancePlan.activeHeirs.length, members]);

  const applyEstateCalculation = async () => {
    const totalEstate = distributableEstateAmount;
    if (!totalEstate || totalEstate <= 0) {
      toast({ title: 'Monto requerido', description: 'Indica el monto total de la herencia para distribuirlo después de abogados.' });
      return;
    }

    setPaymentSaving(true);
    try {
      const bulkItems = calculatedPayments
        .filter(({ heir }) => Boolean(heir?.id))
        .map(({ heir, amount }) => ({
          id: heir!.id,
          inheritance_amount: amount,
        }));
      const inactiveItems = heirs
        .filter((heir) => heir.id && !activePaymentHeirIds.has(heir.id) && Number(heir.inheritance_amount || 0) !== 0)
        .map((heir) => ({
          id: heir.id,
          inheritance_amount: 0,
        }));

      const createItems = calculatedPayments.filter(({ heir }) => !heir?.id);

      if (bulkItems.length || inactiveItems.length) {
        await api.bulkUpdateHeirAmounts([...bulkItems, ...inactiveItems]);
      }

      await Promise.all(
        createItems.map(({ share, amount }) =>
          api.saveConfirmedHeir({
            sienna_member_id: share.member.id,
            heir_name: share.member.name,
            relationship_summary: share.reason,
            line_vincenzo: share.sources.includes('Vincenzo/Vicente'),
            line_paolo: share.sources.includes('Paolo/Paulino'),
            status: 'mencionado',
            notes: share.paymentBasis,
            inheritance_amount: amount,
          })
        )
      );
      invalidateSiennaData(queryClient);
      await loadData();
      toast({ title: 'Montos calculados', description: 'La API calculó en vivo, guardó los pagos y actualizó el árbol.' });
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

  const zoomTreeAt = (clientX: number, clientY: number, nextZoom: number) => {
    const viewport = treeViewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const clampedZoom = clampTreeZoom(nextZoom);
    const worldX = (clientX - rect.left - treePan.x) / zoomLevel;
    const worldY = (clientY - rect.top - treePan.y) / zoomLevel;
    setZoomLevel(Number(clampedZoom.toFixed(3)));
    setTreePan({
      x: clientX - rect.left - worldX * clampedZoom,
      y: clientY - rect.top - worldY * clampedZoom,
    });
  };

  const nudgeZoom = (delta: number) => {
    const viewport = treeViewportRef.current;
    if (!viewport) {
      setZoomLevel((current) => clampTreeZoom(Number((current + delta).toFixed(3))));
      return;
    }
    const rect = viewport.getBoundingClientRect();
    zoomTreeAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoomLevel + delta);
  };

  const onTreeWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    zoomTreeAt(event.clientX, event.clientY, zoomLevel * factor);
  };

  const onTreeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !treeViewportRef.current) return;
    treePanRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: treePan.x,
      startPanY: treePan.y,
    };
    setIsPanningTree(true);
  };

  const onTreeMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!treePanRef.current.dragging || !treeViewportRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - treePanRef.current.startX;
    const deltaY = event.clientY - treePanRef.current.startY;
    setTreePan({
      x: treePanRef.current.startPanX + deltaX,
      y: treePanRef.current.startPanY + deltaY,
    });
  };

  const touchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const touchCenter = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const onTreeTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      treePanRef.current = {
        dragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startPanX: treePan.x,
        startPanY: treePan.y,
      };
      setIsPanningTree(true);
      return;
    }

    if (event.touches.length >= 2) {
      const center = touchCenter(event.touches);
      treePinchRef.current = {
        active: true,
        distance: touchDistance(event.touches),
        zoom: zoomLevel,
        centerX: center.x,
        centerY: center.y,
      };
      setIsPanningTree(true);
    }
  };

  const onTreeTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.touches.length === 1 && treePanRef.current.dragging) {
      const touch = event.touches[0];
      setTreePan({
        x: treePanRef.current.startPanX + touch.clientX - treePanRef.current.startX,
        y: treePanRef.current.startPanY + touch.clientY - treePanRef.current.startY,
      });
      return;
    }

    if (event.touches.length >= 2 && treePinchRef.current.active) {
      const center = touchCenter(event.touches);
      const distance = touchDistance(event.touches);
      const ratio = treePinchRef.current.distance ? distance / treePinchRef.current.distance : 1;
      zoomTreeAt(center.x, center.y, treePinchRef.current.zoom * ratio);
    }
  };

  const stopTreePan = () => {
    treePanRef.current.dragging = false;
    treePinchRef.current.active = false;
    setIsPanningTree(false);
  };

  const printTree = () => {
    const treeWorld = treeWorldRef.current;
    if (!treeWorld) {
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

    const printableTree = treeWorld.cloneNode(true) as HTMLElement;
    printableTree.removeAttribute('style');
    printableTree.style.transform = 'none';
    printableTree.style.position = 'relative';
    printableTree.style.left = 'auto';
    printableTree.style.top = 'auto';
    printableTree.style.width = 'max-content';
    printableTree.style.maxWidth = 'none';
    printableTree.style.overflow = 'visible';

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
            @page { size: A3 landscape; margin: 8mm; }
            html, body { margin: 0; background: #fff; color: #173f73; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
            .print-page { width: calc(420mm - 16mm); padding: 0; overflow: visible; }
            .print-header {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 6mm;
              border-bottom: 1px solid #d8b45d;
              padding-bottom: 3mm;
            }
            .print-title { margin: 0; font-size: 18px; color: #173f73; }
            .print-meta { margin: 1mm 0 0; font-size: 10px; color: #5f6f86; }
            .print-canvas { width: 100%; overflow: visible; }
            .print-fit { transform-origin: top left; overflow: visible; }
            .classic-family-tree,
            .tree-world {
              position: relative !important;
              left: auto !important;
              top: auto !important;
              width: max-content !important;
              max-width: none !important;
              overflow: visible !important;
              transform: none !important;
              padding: 0 !important;
              will-change: auto !important;
            }
            .classic-tree-root,
            .classic-tree-children {
              min-width: max-content !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .rounded-md, .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
          </style>
        </head>
        <body>
          <main class="print-page">
            <header class="print-header">
              <div>
                <h1 class="print-title">Árbol Genealógico Sienna</h1>
                <p class="print-meta">Vista completa del árbol · ${members.length} miembros · ${presentationStats.finalHeirs} herederos finales</p>
              </div>
              <p class="print-meta">${new Date().toLocaleString('es-DO')}</p>
            </header>
            <section class="print-canvas">
              <div class="print-fit">
                ${printableTree.outerHTML}
              </div>
            </section>
          </main>
          <script>
            const preparePrint = async () => {
              const canvas = document.querySelector('.print-canvas');
              const fit = document.querySelector('.print-fit');
              const tree = document.querySelector('.classic-family-tree');
              if (canvas && fit && tree) {
                const treeWidth = Math.max(tree.scrollWidth, tree.getBoundingClientRect().width);
                const treeHeight = Math.max(tree.scrollHeight, tree.getBoundingClientRect().height);
                const availableWidth = canvas.clientWidth || treeWidth;
                const scale = Math.min(1, availableWidth / treeWidth);
                fit.style.transform = 'scale(' + scale + ')';
                fit.style.width = treeWidth + 'px';
                canvas.style.height = Math.ceil(treeHeight * scale) + 'px';
              }

              const images = Array.from(document.images || []);
              await Promise.allSettled(images.map((image) => {
                if (image.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  image.onload = resolve;
                  image.onerror = resolve;
                  setTimeout(resolve, 1200);
                });
              }));

              setTimeout(() => {
                window.focus();
                window.print();
              }, 250);
            };
            window.onload = () => { preparePrint(); };
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
            <p className="text-xs uppercase tracking-wide text-legal-gray">Cálculo Sienna en vivo</p>
            <p className="mt-1 text-sm text-legal-blue">
              {isFetchingCalculation
                ? 'La API está recalculando con la data actual...'
                : realtimeCalculation?.generated_at
                  ? `API recalculada: ${new Date(realtimeCalculation.generated_at).toLocaleString('es-DO')}`
                  : 'La API calculará con los miembros actuales al cargar los parámetros.'}
            </p>
          </CardContent>
        </Card>

        {dualLineageRows.length > 0 && (
          <Card className="border border-legal-blue/20">
            <CardHeader className="bg-legal-blue/5 border-b">
              <CardTitle className="text-base text-legal-blue">Cruces de ramas (doble linaje)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {dualLineageRows.map((row) => (
                <div key={row.memberId} className="rounded-md border border-legal-blue/15 bg-white p-3">
                  <p className="font-semibold text-legal-blue">{row.memberName}</p>
                  <p className="mt-1 text-xs text-legal-gray">Ramas activas: {row.sources}</p>
                  <p className="mt-1 text-xs text-legal-gray">
                    Padre/Madre base visual: {row.baseParentName}
                    {row.linkedParentName !== 'No definido' ? ' · Segundo progenitor formal: ' + row.linkedParentName : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {row.routes.map((route) => (
                      <p key={route} className="text-xs leading-relaxed text-legal-gray">
                        {route}
                      </p>
                    ))}
                  </div>
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
                <p className="mt-1 text-xs text-legal-gray">
                  % sobre el bruto. El default global se cambia solo en Settings.
                </p>
              </div>
              <Button onClick={applyEstateCalculation} disabled={paymentSaving || isFetchingCalculation} className="bg-legal-gold hover:bg-legal-gold/90 text-white">
                <Save className="mr-2 h-4 w-4" />
                {isFetchingCalculation ? 'Calculando...' : 'Calcular y guardar pagos'}
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

            <div className="grid gap-3 md:grid-cols-5">
              {calculatedPayments.map(({ heir, share, amount }) => (
                <div key={share.member.id} className="rounded-md border border-legal-blue/15 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <MemberPhoto
                      name={heir?.heir_name || share.member.name}
                      memberId={share.member.id}
                      photoData={heir?.photo_data}
                      size="xs"
                    />
                    <p className="text-xs font-semibold leading-tight text-legal-blue">
                      {heir?.heir_name || share.member.name}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-bold text-legal-blue">{formatMoney(amount)}</p>
                  <p className="text-xs text-legal-gray">{formatPercent(share.share)}</p>
                </div>
              ))}
            </div>

            {inheritancePlan.activeHeirs.length > 0 && (
              <div className="space-y-3 border-t border-legal-blue/10 pt-4">
                <h4 className="font-serif text-base font-bold text-legal-blue">Por qué heredan (resumen)</h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inheritancePlan.activeHeirs.map((share) => {
                    const amount =
                      realtimeCalculation?.active_heirs.find((row) => row.member_id === share.member.id)?.amount ??
                      Number(heirsByName.get(normalizeName(share.member.name))?.inheritance_amount || 0);
                    return (
                      <div key={share.member.id} className="rounded-md border border-legal-gold/25 bg-legal-gold/5 p-3">
                        <div className="flex items-center gap-2">
                          <MemberPhoto
                            name={share.member.name}
                            memberId={share.member.id}
                            photoData={
                              heirsByMemberId.get(share.member.id)?.photo_data ||
                              heirsByName.get(normalizeName(share.member.name))?.photo_data
                            }
                            size="sm"
                          />
                          <p className="font-medium text-legal-blue">{share.member.name}</p>
                        </div>
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
                    onClick={() => nudgeZoom(-0.1)}
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
                    onClick={() => nudgeZoom(0.1)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={fitTreeToScreen}
                    title="Ajustar a pantalla"
                  >
                    Fit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setZoomLevel(1);
                      window.requestAnimationFrame(() => centerTree(1));
                    }}
                    title="Centrar al 100%"
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
              className={`tree-viewport w-full rounded-md bg-legal-beige/20 select-none ${isPanningTree ? 'cursor-grabbing' : 'cursor-grab'}`}
              onWheel={onTreeWheel}
              onMouseDown={onTreeMouseDown}
              onMouseMove={onTreeMouseMove}
              onMouseUp={stopTreePan}
              onMouseLeave={stopTreePan}
              onTouchStart={onTreeTouchStart}
              onTouchMove={onTreeTouchMove}
              onTouchEnd={stopTreePan}
            >
              {loading ? (
                <div className="p-8 text-center text-legal-gray">Cargando árbol...</div>
              ) : (
                <div
                  ref={treeWorldRef}
                  className="tree-world classic-family-tree"
                  style={{
                    transform: `translate(${treePan.x}px, ${treePan.y}px) scale(${zoomLevel})`,
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
                        calculationAmountsByMemberId={calculationAmountsByMemberId}
                        total={total}
                        estateAmount={distributableEstateAmount}
                        membersById={membersById}
                        allMembers={members}
                        genealogy={genealogy}
                        onOpenMember={setDetailMemberId}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <MemberDetailSheet
        member={detailMember}
        members={members}
        genealogy={genealogy}
        heirs={heirs}
        documents={workspace?.documents ?? []}
        open={Boolean(detailMember)}
        onOpenChange={(open) => !open && setDetailMemberId(null)}
      />
    </div>
  );
};

export default ArbolGenealogicoSienna;
