import React, { useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { ConfirmedHeir, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { useConfirmedHeirs, useSiennaWorkspace } from '@/hooks/useSiennaData';
import { formatUnionLabel, getMemberLinkVerificationStatus, getParentLinksForChild, resolveSpouseDisplayLabel, SiennaGenealogyBundle } from '@/lib/siennaGenealogy';
import MemberVerificationBadge from '@/components/sienna/MemberVerificationBadge';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import MemberDetailSheet from '@/components/sienna/MemberDetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { normalizeName } from '@/lib/dominicanInheritance';
import { cn } from '@/lib/utils';
import { Camera, GitBranch, GitMerge, Maximize2, Minimize2, Printer, RotateCcw, Sparkles, Users, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildMemberPhotoLookup, MemberPhotoLookup, resolveConfirmedHeirPhotoData } from '@/lib/memberPhotos';
import { useAuth } from '@/context/AuthContext';

type TreeMember = SiennaFamilyMember & { children: TreeMember[] };

const blobToBase64 = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return window.btoa(binary);
};

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
  let roots = Array.from(byId.values()).filter((member) => !attached.has(member.id));
  const rootIds = new Set(roots.map((member) => member.id));
  roots = roots.filter((member) => {
    const spouseId = member.spouse_member_id?.trim();
    const spouse = spouseId ? byId.get(spouseId) : null;
    if (member.relationship_to_parent === 'conyuge' && spouse) return false;
    if (!spouse || !rootIds.has(spouse.id)) return true;
    return !(member.children.length === 0 && spouse.children.length > 0);
  });

  const sortTree = (nodes: TreeMember[]) => {
    nodes.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.name.localeCompare(b.name));
    nodes.forEach((node) => sortTree(node.children));
    return nodes;
  };

  return sortTree(roots);
};

const normalizedMemberId = (value: string | null | undefined) => (value || '').trim();
const isDeceasedMember = (member: SiennaFamilyMember) => Boolean(member.death?.trim());
const MIN_TREE_ZOOM = 0.3;
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

const familyRoleLabel = (member: TreeMember, isRoot: boolean) => {
  if (isRoot) return 'Origen familiar';
  if (member.children.length > 0) return 'Rama familiar';
  if (member.relationship_to_parent === 'conyuge') return 'Cónyuge';
  return 'Descendencia';
};

const MemberTreeCard = ({
  member,
  heir,
  photoLookup,
  allMembers,
  genealogy,
  role,
  onOpenMember,
  tone = 'default',
}: {
  member: SiennaFamilyMember;
  heir?: ConfirmedHeir | null;
  photoLookup: MemberPhotoLookup;
  allMembers: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
  role: string;
  onOpenMember: (memberId: string) => void;
  tone?: 'default' | 'founder' | 'spouse';
}) => {
  const isDeceased = isDeceasedMember(member);

  return (
    <div
      className={cn(
        'sienna-family-card relative text-center',
        tone === 'founder' && 'sienna-family-card-founder',
        tone === 'spouse' && 'sienna-family-card-spouse'
      )}
    >
      {isDeceased && (
        <div
          className="deceased-ribbon-badge right-12 top-2"
          title={member.death ? 'Fallecido: ' + member.death : 'Fallecido'}
          aria-label={member.death ? 'Fallecido: ' + member.death : 'Fallecido'}
        >
          <span className="deceased-ribbon" aria-hidden="true" />
        </div>
      )}

      <div className="absolute -right-3 -top-3 z-10">
        <MemberPhoto
          name={member.name}
          memberId={member.id}
          photoData={resolveConfirmedHeirPhotoData(heir || undefined)}
          lookup={photoLookup}
          size="lg"
          rounded="xl"
          className="border-2 border-legal-gold/70 shadow-lg"
          verificationStatus={heir?.status === 'confirmado' ? 'verified' : getMemberLinkVerificationStatus(member, allMembers, genealogy).status}
        />
      </div>

      <h3 className="pr-10 font-serif text-[15px] font-bold leading-tight text-legal-blue">{member.name}</h3>
      <div className="mt-1 min-h-[18px] text-xs text-gray-600">
        {member.birth && <span>n. {member.birth}</span>}
        {member.birth && member.death && <span> - </span>}
        {member.death && <span>m. {member.death}</span>}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        <Badge variant={tone === 'founder' ? 'default' : 'outline'} className={tone === 'founder' ? 'bg-legal-gold text-white' : ''}>
          {role}
        </Badge>
        {isDeceased && (
          <Badge variant="outline" className="border-gray-400 bg-gray-50 text-gray-800">
            Fallecido
          </Badge>
        )}
      </div>

      <MemberVerificationBadge
        member={member}
        members={allMembers}
        genealogy={genealogy}
        className="mt-2 justify-center"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-7 px-2 text-xs text-legal-blue"
        onClick={() => onOpenMember(member.id)}
      >
        Ficha familiar
      </Button>
    </div>
  );
};

const ClassicNode = ({
  member,
  heirsByMemberId,
  heirsByName,
  photoLookup,
  membersById,
  allMembers,
  genealogy,
  onOpenMember,
  isRoot = false,
}: {
  member: TreeMember;
  heirsByMemberId: Map<string, ConfirmedHeir>;
  heirsByName: Map<string, ConfirmedHeir>;
  photoLookup: MemberPhotoLookup;
  membersById: Map<string, SiennaFamilyMember>;
  allMembers: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
  onOpenMember: (memberId: string) => void;
  isRoot?: boolean;
}) => {
  const heir = heirsByMemberId.get(member.id) || heirsByName.get(normalizeName(member.name));
  const parent = member.parent_id ? membersById.get(normalizedMemberId(member.parent_id)) || null : null;
  const otherParent = resolveFormalOtherParent(member, parent, membersById, genealogy);
  const spouseLabel = resolveSpouseDisplayLabel(member, allMembers, genealogy);
  const spousePartner = member.spouse_member_id ? membersById.get(normalizedMemberId(member.spouse_member_id)) || null : null;
  const spouseHeir = spousePartner
    ? heirsByMemberId.get(spousePartner.id) || heirsByName.get(normalizeName(spousePartner.name))
    : null;
  const showSpouseCard = Boolean(spousePartner && member.relationship_to_parent !== 'conyuge');
  const childLinks = getParentLinksForChild(member.id, genealogy.parent_links);
  const unionLink = childLinks.find((link: MemberParentLink) => link.union_id);
  const filiationUnion = unionLink?.union_id
    ? genealogy.unions.find((union) => union.id === unionLink.union_id) || null
    : null;

  return (
    <li className="relative">
      <div className="relative flex flex-col items-center pt-6">
        <div className="tree-marriage-group mb-3 flex flex-wrap justify-center gap-5">
          <MemberTreeCard
            member={member}
            heir={heir}
            photoLookup={photoLookup}
            allMembers={allMembers}
            genealogy={genealogy}
            role={familyRoleLabel(member, isRoot)}
            tone={isRoot || member.is_highlighted_ancestor ? 'founder' : 'default'}
            onOpenMember={onOpenMember}
          />

          {showSpouseCard && spousePartner && (
            <MemberTreeCard
              member={spousePartner}
              heir={spouseHeir}
              photoLookup={photoLookup}
              allMembers={allMembers}
              genealogy={genealogy}
              role="Cónyuge fundacional"
              tone="spouse"
              onOpenMember={onOpenMember}
            />
          )}
        </div>

        {(spouseLabel || filiationUnion || parent || otherParent) && (
          <div className="tree-context-note mb-3">
            {spouseLabel && !showSpouseCard && <span>Cónyuge: {spouseLabel}</span>}
            {filiationUnion && <span>Filiación: {formatUnionLabel(filiationUnion, membersById)}</span>}
            {parent && <span>Vínculo base: {parent.name}</span>}
            {otherParent && <span>Otro vínculo parental: {otherParent.name}</span>}
            {parent && otherParent && (
              <span className="inline-flex items-center gap-1 text-legal-blue">
                <GitMerge className="h-3 w-3" />
                Cruce transversal de ramas
              </span>
            )}
          </div>
        )}

        {member.children.length > 0 && (
          <ul className={cn('classic-tree-children relative', member.children.length > 1 && 'has-multiple')}>
            {member.children.map((child) => (
              <ClassicNode
                key={child.id}
                member={child}
                heirsByMemberId={heirsByMemberId}
                heirsByName={heirsByName}
                photoLookup={photoLookup}
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

const maxTreeDepth = (nodes: TreeMember[]): number => {
  if (!nodes.length) return 0;
  return Math.max(...nodes.map((node) => 1 + maxTreeDepth(node.children)));
};

const countMembersWithPhotos = (heirs: ConfirmedHeir[]) =>
  heirs.filter((heir) => heir.has_photo || Boolean(heir.photo_data)).length;

const ArbolGenealogicoSienna = () => {
  const { hasAccess } = useAuth();
  const { data: workspace, isLoading, isFetching } = useSiennaWorkspace(false);
  const { data: heirsWithMedia } = useConfirmedHeirs(false);
  const members = workspace?.members ?? [];
  const heirs = heirsWithMedia?.heirs ?? workspace?.heirs ?? [];
  const genealogy = useMemo<SiennaGenealogyBundle>(
    () => ({
      unions: workspace?.unions ?? [],
      parent_links: workspace?.parent_links ?? [],
    }),
    [workspace]
  );
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanningTree, setIsPanningTree] = useState(false);
  const [workspaceInitialized, setWorkspaceInitialized] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando árbol genealógico familiar...');
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printScale, setPrintScale] = useState(0.32);
  const [printTreeSize, setPrintTreeSize] = useState({ width: 1200, height: 800 });
  const [treePan, setTreePan] = useState({ x: 40, y: 40 });
  const canOpenMemberAdmin = hasAccess('/sienna/miembros-arbol');
  const treeScreenRef = useRef<HTMLDivElement | null>(null);
  const treeViewportRef = useRef<HTMLDivElement | null>(null);
  const treeWorldRef = useRef<HTMLDivElement | null>(null);
  const printPreviewRef = useRef<HTMLElement | null>(null);
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
  });
  const detailMember = useMemo(
    () => members.find((member) => member.id === detailMemberId) || null,
    [detailMemberId, members]
  );

  useEffect(() => {
    if (!workspace || workspaceInitialized) return;
    setWorkspaceInitialized(true);
  }, [workspace, workspaceInitialized]);

  useEffect(() => {
    if (isLoading) {
      setLoadingMessage('Consultando miembros y vínculos familiares...');
      return;
    }
    if (isFetching) {
      setLoadingMessage('Actualizando árbol familiar...');
      return;
    }
    if (workspace) {
      setLoadingMessage('Renderizando descendencia de Domenico y María Rosa...');
    }
  }, [isFetching, isLoading, workspace]);

  const loading = isLoading || !workspaceInitialized;

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const stopTreePan = () => {
      treePanRef.current.dragging = false;
      treePinchRef.current.active = false;
      setIsPanningTree(false);
    };
    window.addEventListener('mouseup', stopTreePan);
    return () => window.removeEventListener('mouseup', stopTreePan);
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
      y: 32,
    });
  };

  const fitTreeToScreen = () => {
    const viewport = treeViewportRef.current;
    const world = treeWorldRef.current;
    if (!viewport || !world) return;
    const worldWidth = world.scrollWidth;
    const worldHeight = world.scrollHeight;
    if (!worldWidth || !worldHeight) return;
    const padding = 72;
    const nextZoom = clampTreeZoom(
      Math.min(
        (viewport.clientWidth - padding) / worldWidth,
        (viewport.clientHeight - padding) / worldHeight
      )
    );
    setZoomLevel(Number(nextZoom.toFixed(3)));
    centerTree(nextZoom);
  };

  const heirsByName = useMemo(
    () => new Map(heirs.map((heir) => [normalizeName(heir.heir_name), heir])),
    [heirs]
  );
  const heirsByMemberId = useMemo(
    () => new Map(heirs.filter((heir) => heir.sienna_member_id).map((heir) => [String(heir.sienna_member_id), heir])),
    [heirs]
  );
  const photoLookup = useMemo(() => buildMemberPhotoLookup(heirs), [heirs]);
  const membersById = useMemo(
    () => new Map(members.map((member) => [normalizedMemberId(member.id), member])),
    [members]
  );

  const forest = useMemo(() => buildForest(members, genealogy), [genealogy, members]);
  const branchOptions = useMemo(() => {
    if (forest.length === 1) return forest[0].children;
    return forest;
  }, [forest]);
  const selectedBranchLabel = useMemo(
    () =>
      selectedBranchId === 'all'
        ? 'Árbol completo'
        : branchOptions.find((branch) => branch.id === selectedBranchId)?.name || 'Rama familiar',
    [branchOptions, selectedBranchId]
  );
  const visibleForest = useMemo(() => {
    if (selectedBranchId === 'all') return forest;
    if (forest.length === 1) {
      const root = forest[0];
      const branch = root.children.find((child) => child.id === selectedBranchId);
      return branch ? [{ ...root, children: [branch] }] : forest;
    }
    const root = forest.find((node) => node.id === selectedBranchId);
    return root ? [root] : forest;
  }, [forest, selectedBranchId]);

  useEffect(() => {
    if (loading || !visibleForest.length) return;
    const frame = window.requestAnimationFrame(() => fitTreeToScreen());
    return () => window.cancelAnimationFrame(frame);
  }, [loading, selectedBranchId, visibleForest.length]);

  useEffect(() => {
    document.body.classList.toggle('sienna-tree-print-active', isPrintPreviewOpen);
    return () => document.body.classList.remove('sienna-tree-print-active');
  }, [isPrintPreviewOpen]);

  useEffect(() => {
    if (!isPrintPreviewOpen) return;
    const alignPreviewStart = () => {
      window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const preview = printPreviewRef.current;
      if (!preview) return;
      preview.scrollTo({
        left: 0,
        top: 0,
        behavior: 'auto',
      });
    };
    window.requestAnimationFrame(() => {
      alignPreviewStart();
      window.requestAnimationFrame(alignPreviewStart);
    });
  }, [isPrintPreviewOpen, printScale, printTreeSize.height, printTreeSize.width]);

  const orphanMembers = useMemo(() => {
    const ids = new Set(members.map((member) => member.id));
    return members.filter((member) => member.parent_id && !ids.has(member.parent_id));
  }, [members]);

  const familyStats = useMemo(() => {
    const rootChildren = forest.reduce((sum, root) => sum + root.children.length, 0);
    return {
      members: members.length,
      generations: maxTreeDepth(forest),
      branches: branchOptions.length || rootChildren || forest.length,
      photos: countMembersWithPhotos(heirs),
    };
  }, [branchOptions.length, forest, heirs, members.length]);

  const hasComplexLinks = useMemo(
    () =>
      members.some((member) => {
        const parent = member.parent_id ? membersById.get(normalizedMemberId(member.parent_id)) || null : null;
        return Boolean(resolveFormalOtherParent(member, parent, membersById, genealogy));
      }),
    [genealogy, members, membersById]
  );

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
    setTreePan({
      x: treePanRef.current.startPanX + event.clientX - treePanRef.current.startX,
      y: treePanRef.current.startPanY + event.clientY - treePanRef.current.startY,
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
      treePinchRef.current = {
        active: true,
        distance: touchDistance(event.touches),
        zoom: zoomLevel,
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

  const escapePrintText = (value: string | number) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const printTree = () => {
    const world = treeWorldRef.current;
    if (world) {
      const worldWidth = Math.max(world.scrollWidth, 1);
      const worldHeight = Math.max(world.scrollHeight, 1);
      const nextPrintScale = Math.max(
        0.04,
        Math.min(0.62, 900 / worldWidth, 560 / worldHeight)
      );
      setPrintScale(Number(nextPrintScale.toFixed(3)));
      setPrintTreeSize({ width: worldWidth, height: worldHeight });
    }
    setIsPrintPreviewOpen(true);
  };

  const generateTreePdf = async () => {
    const target = document.querySelector('.print-tree-world') as HTMLElement | null;
    if (!target) {
      toast({
        title: 'Vista del árbol no disponible',
        description: 'Abra primero la vista de impresión del árbol.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Generando PDF',
        description: 'Preparando el árbol en una sola página horizontal...',
      });
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const sourceWidth = Math.max(target.scrollWidth, target.offsetWidth, 1);
      const sourceHeight = Math.max(target.scrollHeight, target.offsetHeight, 1);
      const captureScale = Math.max(0.08, Math.min(1, 2400 / sourceWidth, 1600 / sourceHeight));

      if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 1 || sourceHeight <= 1) {
        throw new Error('El árbol todavía no tiene dimensiones válidas para exportar.');
      }

      const captureHost = document.createElement('div');
      const captureNode = target.cloneNode(true) as HTMLElement;
      captureHost.style.position = 'fixed';
      captureHost.style.left = '-100000px';
      captureHost.style.top = '0';
      captureHost.style.width = sourceWidth + 'px';
      captureHost.style.height = sourceHeight + 'px';
      captureHost.style.overflow = 'visible';
      captureHost.style.background = '#ffffff';
      captureHost.style.pointerEvents = 'none';
      captureHost.style.zIndex = '-1';
      captureNode.style.position = 'relative';
      captureNode.style.left = '0';
      captureNode.style.top = '0';
      captureNode.style.width = sourceWidth + 'px';
      captureNode.style.height = sourceHeight + 'px';
      captureNode.style.transform = 'none';
      captureNode.style.padding = '0';
      captureHost.appendChild(captureNode);
      document.body.appendChild(captureHost);

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(captureNode, {
          backgroundColor: '#ffffff',
          scale: captureScale,
          useCORS: true,
          logging: false,
          width: sourceWidth,
          height: sourceHeight,
          windowWidth: sourceWidth,
          windowHeight: sourceHeight,
        });
      } finally {
        captureHost.remove();
      }

      if (!Number.isFinite(canvas.width) || !Number.isFinite(canvas.height) || canvas.width < 2 || canvas.height < 2) {
        throw new Error('Safari no pudo crear una imagen válida del árbol.');
      }

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const imageWidth = canvas.width * ratio;
      const imageHeight = canvas.height * ratio;
      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;
      const imageData = canvas.toDataURL('image/jpeg', 0.92);

      if (
        !Number.isFinite(ratio) ||
        !Number.isFinite(imageWidth) ||
        !Number.isFinite(imageHeight) ||
        imageWidth <= 0 ||
        imageHeight <= 0 ||
        !imageData.startsWith('data:image/jpeg')
      ) {
        throw new Error('La imagen generada no tiene medidas válidas para el PDF.');
      }

      pdf.addImage(imageData, 'JPEG', x, y, imageWidth, imageHeight);

      const fileName = 'arbol-genealogico-domenico-maria-rosa.pdf';
      const blob = pdf.output('blob');
      const pdfBase64 = await blobToBase64(blob);
      const downloadResponse = await fetch('/api/sienna-tree-pdf-downloads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: fileName, pdf_base64: pdfBase64 }),
      });
      const downloadPayload = await downloadResponse.json().catch(() => ({}));
      if (!downloadResponse.ok || typeof downloadPayload.url !== 'string') {
        throw new Error(downloadPayload.message || 'No se pudo preparar la descarga del PDF.');
      }

      const link = document.createElement('a');
      link.href = downloadPayload.url;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'No se pudo generar el PDF',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {isPrintPreviewOpen && (
        <section
          ref={printPreviewRef}
          className="sienna-tree-print-preview"
          style={{
            '--print-scale': printScale,
            '--print-tree-width': printTreeSize.width,
            '--print-tree-height': printTreeSize.height,
            '--print-tree-scaled-width': Math.ceil(printTreeSize.width * printScale),
            '--print-tree-scaled-height': Math.ceil(printTreeSize.height * printScale),
          } as React.CSSProperties}
        >
          <div className="print-preview-toolbar">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPrintPreviewOpen(false)}>
              Volver al árbol
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-legal-blue text-white hover:bg-legal-blue/90"
              onClick={generateTreePdf}
            >
              <Printer className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>

          <main className="print-tree-sheet">
            <header className="print-tree-header screen-only-print-header">
              <div>
                <h1>Árbol genealógico de la descendencia de Domenico y María Rosa</h1>
                <p>
                  {selectedBranchLabel} · Recuerdo familiar · {familyStats.members} miembros · {familyStats.branches} ramas · {familyStats.generations} generaciones
                </p>
              </div>
            </header>
            <section className="print-tree-canvas">
              <div className="print-tree-frame">
                <div className="print-tree-scale">
                  <div className="tree-world classic-family-tree print-tree-world">
                    {visibleForest.length > 1 && (
                      <p className="mb-3 text-xs text-amber-700">
                        Hay {visibleForest.length} raíces en el árbol. Revise vínculos parentales si espera una sola raíz familiar.
                      </p>
                    )}
                    <ul className="classic-tree-root">
                      {visibleForest.map((root) => (
                        <ClassicNode
                          key={root.id}
                          member={root}
                          heirsByMemberId={heirsByMemberId}
                          heirsByName={heirsByName}
                          photoLookup={photoLookup}
                          membersById={membersById}
                          allMembers={members}
                          genealogy={genealogy}
                          onOpenMember={setDetailMemberId}
                          isRoot
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            <footer className="print-tree-footer screen-only-print-footer">
              <span>Legado familiar Sangiovanni</span>
              <span>Vista genealógica conmemorativa</span>
            </footer>
          </main>
        </section>
      )}

    <div
      ref={treeScreenRef}
      className={'app-shell py-8 ' + (isPresentationMode ? 'max-w-none px-2 sm:px-3 lg:px-4 ' : '') + (isFullscreen ? 'bg-legal-beige' : '')}
    >
      <BackButton />

      <DocumentHeader
        title="Árbol genealógico de la descendencia de Domenico y María Rosa"
        subtitle="Memoria visual familiar, organizada por generaciones y vínculos de descendencia."
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
          {isPresentationMode ? 'Salir vista amplia' : 'Vista amplia'}
        </Button>
        {canOpenMemberAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/sienna/miembros-arbol">Administrar miembros</Link>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {orphanMembers.length > 0 && (
          <Card className="border border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-amber-800">
                Hay miembros sin conexión válida al árbol ({orphanMembers.length}).
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Revise en “Miembros del Árbol” los nodos cuyo superior no existe para recuperar su conexión visual.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Users className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Miembros familiares</p>
                <p className="text-2xl font-bold text-legal-blue">{familyStats.members}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <GitBranch className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Ramas visibles</p>
                <p className="text-2xl font-bold text-legal-blue">{familyStats.branches}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Sparkles className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Generaciones</p>
                <p className="text-2xl font-bold text-legal-blue">{familyStats.generations}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-legal-gold/20">
            <CardContent className="flex items-center gap-3 p-5">
              <Camera className="h-9 w-9 text-legal-blue" />
              <div>
                <p className="text-sm text-legal-gray">Fotos familiares</p>
                <p className="text-2xl font-bold text-legal-blue">{familyStats.photos}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasComplexLinks && (
          <details className="rounded-md border border-legal-blue/20 bg-white">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-legal-blue">
              Vínculos familiares complejos
            </summary>
            <p className="border-t border-legal-blue/10 p-4 text-sm leading-relaxed text-legal-gray">
              Algunas personas tienen más de un vínculo parental documentado. El árbol los conserva como memoria familiar y los marca en la ficha para que la historia no pierda precisión.
            </p>
          </details>
        )}

        <Card className="overflow-hidden border border-legal-gold/20">
          <CardContent className="p-6">
            <div className="mb-6 rounded-md border border-legal-gold/20 bg-white/95 p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-legal-blue">Descendencia familiar</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-legal-gray">
                    Vista conmemorativa del linaje de Domenico Sangiovanni y María Rosa Grisolia, organizada para lectura familiar, presentación e impresión.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-md border border-legal-blue/20 bg-white px-2 py-1">
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => nudgeZoom(-0.1)} title="Alejar">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[52px] text-center text-xs font-semibold text-legal-blue">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => nudgeZoom(0.1)} title="Acercar">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={fitTreeToScreen} title="Ajustar a pantalla">
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
              {branchOptions.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-legal-blue/10 pt-4">
                  <Button
                    type="button"
                    variant={selectedBranchId === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBranchId('all')}
                    className={selectedBranchId === 'all' ? 'bg-legal-blue text-white hover:bg-legal-blue/90' : ''}
                  >
                    Árbol completo
                  </Button>
                  {branchOptions.map((branch) => (
                    <Button
                      key={branch.id}
                      type="button"
                      variant={selectedBranchId === branch.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBranchId(branch.id)}
                      className={selectedBranchId === branch.id ? 'bg-legal-gold text-white hover:bg-legal-gold/90' : ''}
                    >
                      {branch.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div
              ref={treeViewportRef}
              className={'tree-viewport family-memory-viewport w-full rounded-md select-none ' + (isPanningTree ? 'cursor-grabbing' : 'cursor-grab')}
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
                <div className="p-8 text-center text-legal-gray">Cargando árbol familiar...</div>
              ) : (
                <div
                  ref={treeWorldRef}
                  className="tree-world classic-family-tree"
                  style={{
                    transform: 'translate(' + treePan.x + 'px, ' + treePan.y + 'px) scale(' + zoomLevel + ')',
                  }}
                >
                  {visibleForest.length > 1 && (
                    <p className="mb-3 text-xs text-amber-700">
                      Hay {visibleForest.length} raíces en el árbol. Revise vínculos parentales si espera una sola raíz familiar.
                    </p>
                  )}
                  <ul className="classic-tree-root">
                    {visibleForest.map((root) => (
                      <ClassicNode
                        key={root.id}
                        member={root}
                        heirsByMemberId={heirsByMemberId}
                        heirsByName={heirsByName}
                        photoLookup={photoLookup}
                        membersById={membersById}
                        allMembers={members}
                        genealogy={genealogy}
                        onOpenMember={setDetailMemberId}
                        isRoot
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
        photoLookup={photoLookup}
        open={Boolean(detailMember)}
        onOpenChange={(open) => !open && setDetailMemberId(null)}
      />
    </div>
    </>
  );
};

export default ArbolGenealogicoSienna;
