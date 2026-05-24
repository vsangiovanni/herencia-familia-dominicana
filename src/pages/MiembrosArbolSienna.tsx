import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { api, ConfirmedHeir, EvidenceDocument, FamilyUnion, MemberParentLink, SiennaFamilyMember } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { readFileAsDataUrl } from '@/lib/readFileAsDataUrl';
import { applySiennaCaseConfig, buildDominicanInheritancePlan, classifyMemberByDominicanLaw, normalizeName } from '@/lib/dominicanInheritance';
import {
  getMemberEffectiveInheritanceReason,
  getMemberEffectiveInheritanceStatus,
  getMemberStoredInheritanceReason,
  getMemberStoredInheritanceStatus,
} from '@/lib/siennaMemberInheritance';
import { invalidateSiennaData, useConfirmedHeirs, useSiennaCalculation, useSiennaWorkspace } from '@/hooks/useSiennaData';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import MemberDetailSheet from '@/components/sienna/MemberDetailSheet';
import {
  buildMemberTreeContext,
  formatParentOptionLabel,
  sortMembersByName,
  sortMembersByTree,
} from '@/lib/siennaFamilyTree';
import {
  formatUnionLabel,
  getParentLinksForChild,
  SiennaGenealogyBundle,
} from '@/lib/siennaGenealogy';
import { buildSecondParentOptions, buildUnionOptionsForParent } from '@/lib/siennaMemberIssues';
import { formatPercent } from '@/lib/siennaHeirExplain';
import { buildMemberPhotoLookup } from '@/lib/memberPhotos';
import { buildInheritancePlanFromApiRows } from '@/lib/siennaCalculation';
import { buildSiennaDocumentSupportHref } from '@/lib/siennaSupportLinks';
import MemberTreeContextPanel from '@/components/sienna/MemberTreeContextPanel';
import MemberRegistrationGuide from '@/components/sienna/MemberRegistrationGuide';
import MemberVerificationBadge from '@/components/sienna/MemberVerificationBadge';
import PageHelp from '@/components/PageHelp';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertTriangle,
  Edit,
  Eye,
  FileText,
  GitBranch,
  GitMerge,
  Loader2,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';

type MemberForm = {
  id: string;
  parent_id: string;
  relationship_to_parent: 'hijo' | 'hija' | 'conyuge' | 'padre' | 'madre' | 'otro';
  name: string;
  birth: string;
  death: string;
  spouse_member_id: string;
  spouse: string;
  spouse_birth: string;
  inheritance_status: 'posible_heredero' | 'no_hereda' | 'requiere_revision' | 'confirmado';
  inheritance_reason: string;
  is_highlighted_ancestor: boolean;
  sort_order: string;
  filiation_union_id: string;
  second_parent_id: string;
};

const emptyForm: MemberForm = {
  id: '',
  parent_id: 'root',
  relationship_to_parent: 'hijo',
  name: '',
  birth: '',
  death: '',
  spouse_member_id: '',
  spouse: '',
  spouse_birth: '',
  inheritance_status: 'requiere_revision',
  inheritance_reason: '',
  is_highlighted_ancestor: false,
  sort_order: '0',
  filiation_union_id: '',
  second_parent_id: '',
};

type MemberPhotoDraft = {
  data: string | null;
  fileName: string | null;
  fileType: string | null;
  dirty: boolean;
};

const emptyPhotoDraft: MemberPhotoDraft = {
  data: null,
  fileName: null,
  fileType: null,
  dirty: false,
};

const findLinkedHeir = (heirs: ConfirmedHeir[], memberId: string, memberName: string) =>
  heirs.find((heir) => heir.sienna_member_id === memberId) ||
  heirs.find((heir) => normalizeName(heir.heir_name) === normalizeName(memberName)) ||
  null;

const makeId = (name: string) =>
  `${normalizeName(name)
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'miembro'}-${Date.now()}`;

const resolveSpouseName = (
  spouseMemberId: string,
  members: SiennaFamilyMember[],
  fallbackName: string
) => {
  if (spouseMemberId) {
    const spouseMember = members.find((member) => member.id === spouseMemberId);
    if (spouseMember?.name) return spouseMember.name;
  }
  return fallbackName;
};

const determineInheritance = (
  form: MemberForm,
  members: SiennaFamilyMember[],
  genealogy: SiennaGenealogyBundle
) => {
  if (form.inheritance_status !== 'requiere_revision') {
    return {
      inheritance_status: form.inheritance_status,
      inheritance_reason: form.inheritance_reason || 'Estado definido manualmente en la administración del árbol.',
    };
  }

  const memberId = form.id || '__draft_member__';
  const draftMember: SiennaFamilyMember = {
    id: memberId,
    parent_id: form.parent_id === 'root' ? null : form.parent_id,
    relationship_to_parent: form.parent_id === 'root' ? null : form.relationship_to_parent,
    name: form.name.trim() || 'Miembro sin nombre',
    birth: form.birth || null,
    death: form.death || null,
    spouse_member_id: form.spouse_member_id || null,
    spouse: resolveSpouseName(form.spouse_member_id, members, form.spouse) || null,
    spouse_birth: form.spouse_birth || null,
    inheritance_status: form.inheritance_status,
    inheritance_reason: form.inheritance_reason || null,
    is_highlighted_ancestor: form.is_highlighted_ancestor,
    sort_order: Number(form.sort_order || 0),
  };
  const draftMembers = members.some((member) => member.id === memberId)
    ? members.map((member) => (member.id === memberId ? draftMember : member))
    : [...members, draftMember];

  return classifyMemberByDominicanLaw(draftMember, draftMembers, genealogy);
};

const toForm = (
  member: SiennaFamilyMember,
  parentLinks: MemberParentLink[] = []
): MemberForm => {
  const links = getParentLinksForChild(member.id, parentLinks);
  const primaryLink = links.find((link) => link.is_primary_line) || links[0];
  const secondaryLink = links.find(
    (link) => link.parent_member_id !== (member.parent_id || primaryLink?.parent_member_id)
  );

  return {
    id: member.id,
    parent_id: member.parent_id || 'root',
    relationship_to_parent: (member.relationship_to_parent as MemberForm['relationship_to_parent']) || 'hijo',
    name: member.name || '',
    birth: member.birth || '',
    death: member.death || '',
    spouse_member_id: member.spouse_member_id || '',
    spouse: member.spouse || '',
    spouse_birth: member.spouse_birth || '',
    inheritance_status: getMemberStoredInheritanceStatus(member),
    inheritance_reason: getMemberStoredInheritanceReason(member) || '',
    is_highlighted_ancestor: Boolean(member.is_highlighted_ancestor),
    sort_order: String(member.sort_order || 0),
    filiation_union_id: primaryLink?.union_id || links.find((link) => link.union_id)?.union_id || '',
    second_parent_id: secondaryLink?.parent_member_id || '',
  };
};

const MiembrosArbolSienna = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { data: workspace, isLoading, isFetching, refetch } = useSiennaWorkspace(false);
  const { data: heirsWithPhotos } = useConfirmedHeirs(true);
  const { data: realtimeCalculationData } = useSiennaCalculation(
    workspace?.settings?.estate_amount ?? 0,
    workspace?.settings?.lawyer_fee_percentage ?? 0
  );
  const realtimeCalculation = realtimeCalculationData?.calculation;
  const members = workspace?.members ?? [];
  const unions = workspace?.unions ?? [];
  const parentLinks = workspace?.parent_links ?? [];
  const heirs = heirsWithPhotos?.heirs ?? workspace?.heirs ?? [];
  const photoLookup = useMemo(() => buildMemberPhotoLookup(heirs), [heirs]);
  const [documentOverrides, setDocumentOverrides] = useState<Record<string, EvidenceDocument>>({});
  const documents = useMemo(
    () =>
      (workspace?.documents ?? []).map((document) =>
        document.id && documentOverrides[document.id] ? { ...document, ...documentOverrides[document.id] } : document
      ),
    [documentOverrides, workspace?.documents]
  );
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [photoDraft, setPhotoDraft] = useState<MemberPhotoDraft>(emptyPhotoDraft);
  const [photoCache, setPhotoCache] = useState<Record<string, string>>({});
  const [loadingMessage, setLoadingMessage] = useState('Cargando miembros y contexto del árbol...');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewerMemberId, setViewerMemberId] = useState<string | null>(null);
  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [caseConfigRevision, setCaseConfigRevision] = useState(0);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const detailMember = useMemo(
    () => members.find((member) => member.id === detailMemberId) || null,
    [detailMemberId, members]
  );

  const scrollToForm = useCallback(() => {
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const openMemberForEdit = useCallback(
    (member: SiennaFamilyMember) => {
      setForm(toForm(member, parentLinks));
      setPhotoDraft(emptyPhotoDraft);
      scrollToForm();

      const linkedHeir = findLinkedHeir(heirs, member.id, member.name);
      const cachedPhoto = photoCache[member.id];
      const linkedPhoto = linkedHeir?.photo_data || null;
      if (cachedPhoto || linkedPhoto) {
        setPhotoDraft({
          data: cachedPhoto || linkedPhoto,
          fileName: linkedHeir?.photo_file_name ?? null,
          fileType: linkedHeir?.photo_file_type ?? null,
          dirty: false,
        });
        return;
      }

      if (!linkedHeir?.id || !linkedHeir.has_photo) return;

      void api.getConfirmedHeir(linkedHeir.id, { includeMedia: true }).then(({ heir }) => {
        if (!heir.photo_data) return;
        setPhotoCache((current) => ({ ...current, [member.id]: heir.photo_data! }));
        setPhotoDraft({
          data: heir.photo_data ?? null,
          fileName: heir.photo_file_name ?? null,
          fileType: heir.photo_file_type ?? null,
          dirty: false,
        });
      });
    },
    [heirs, parentLinks, photoCache, scrollToForm]
  );

  const loadMembers = async () => {
    setLoadingMessage('Actualizando miembros del árbol...');
    await refetch();
  };

  const loading = isLoading;

  useEffect(() => {
    if (isLoading) {
      setLoadingMessage('Consultando miembros del árbol...');
      return;
    }
    if (isFetching) {
      setLoadingMessage('Actualizando miembros del árbol...');
      return;
    }
    setLoadingMessage('Vinculando documentos y herederos al árbol...');
  }, [isFetching, isLoading]);

  useEffect(() => {
    if (!workspace) return;
    applySiennaCaseConfig(workspace.settings?.sienna_case_config);
    setCaseConfigRevision((current) => current + 1);
  }, [workspace]);

  const ensureDocumentMedia = useCallback(async (document: EvidenceDocument | null | undefined) => {
    if (!document?.id || document.file_data) return;
    if (!document.has_file && !document.has_extracted_text) return;
    const response = await api.getEvidenceDocument(document.id);
    setDocumentOverrides((current) => ({
      ...current,
      [document.id!]: response.document,
    }));
  }, []);

  useEffect(() => {
    const selected = documents.find((document) => document.id === viewerDocumentId);
    void ensureDocumentMedia(selected);
  }, [documents, ensureDocumentMedia, viewerDocumentId]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || loading || !members.length) return;
    const member = members.find((item) => item.id === editId);
    if (member) {
      openMemberForEdit(member);
    }
  }, [loading, members, openMemberForEdit, searchParams]);

  const updateForm = (field: keyof MemberForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setPhotoDraft(emptyPhotoDraft);
  };

  const handlePhotoPick = async (file?: File) => {
    if (!file) return;
    try {
      const data = await readFileAsDataUrl(file);
      setPhotoDraft({
        data,
        fileName: file.name,
        fileType: file.type,
        dirty: true,
      });
    } catch (error) {
      toast({
        title: 'No se pudo leer la foto',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  const persistMemberPhoto = async (memberId: string, memberName: string) => {
    if (!photoDraft.dirty) return;

    const linkedHeir = findLinkedHeir(heirs, memberId, memberName);
    if (linkedHeir?.id) {
      await api.updateConfirmedHeir(linkedHeir.id, {
        sienna_member_id: memberId,
        heir_name: memberName,
        relationship_summary: linkedHeir.relationship_summary ?? null,
        line_vincenzo: linkedHeir.line_vincenzo,
        line_paolo: linkedHeir.line_paolo,
        status: linkedHeir.status,
        notes: linkedHeir.notes ?? null,
        photo_file_name: photoDraft.fileName,
        photo_file_type: photoDraft.fileType,
        photo_data: photoDraft.data,
        inheritance_amount: Number(linkedHeir.inheritance_amount || 0),
      });
      return;
    }

    await api.saveConfirmedHeir({
      sienna_member_id: memberId,
      heir_name: memberName,
      relationship_summary: null,
      line_vincenzo: false,
      line_paolo: false,
      status: 'mencionado',
      notes: null,
      photo_file_name: photoDraft.fileName,
      photo_file_type: photoDraft.fileType,
      photo_data: photoDraft.data,
      inheritance_amount: 0,
    });
  };

  const genealogy = useMemo(
    () => ({ unions, parent_links: parentLinks }),
    [parentLinks, unions]
  );

  const evaluation = useMemo(() => determineInheritance(form, members, genealogy), [caseConfigRevision, form, genealogy, members]);
  const resolvedInheritanceStatus =
    form.inheritance_status === 'requiere_revision' ? evaluation.inheritance_status : form.inheritance_status;
  const manualInheritanceOverride = form.inheritance_status !== 'requiere_revision';
  const resolvedInheritanceReason = manualInheritanceOverride
    ? form.inheritance_reason || 'Estado definido manualmente en la administración del árbol.'
    : evaluation.inheritance_reason;

  const inheritancePlan = useMemo(
    () => buildInheritancePlanFromApiRows(realtimeCalculation?.active_heirs ?? [], members),
    [members, realtimeCalculation?.active_heirs]
  );

  const sortedMembers = useMemo(
    () => sortMembersByName(members),
    [inheritancePlan, members]
  );
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );
  const spouseOptions = useMemo(
    () => sortMembersByName(members.filter((member) => member.id !== form.id)),
    [form.id, members]
  );
  const unionsSortedByLabel = useMemo(
    () =>
      [...unions].sort((left, right) =>
        formatUnionLabel(left, membersById).localeCompare(formatUnionLabel(right, membersById), 'es', {
          sensitivity: 'base',
        })
      ),
    [membersById, unions]
  );

  const memberContexts = useMemo(
    () =>
      new Map(
        sortedMembers.map((member) => [
          member.id,
          buildMemberTreeContext(member, members, inheritancePlan, genealogy),
        ])
      ),
    [genealogy, inheritancePlan, members, sortedMembers]
  );

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedMembers;

    return sortedMembers.filter((member) => {
      const context = memberContexts.get(member.id);
      const haystack = [
        member.name,
        member.id,
        member.spouse_member_id,
        member.spouse,
        context?.parentalLine,
        context?.collateralLine,
        context?.connectionLabel,
        context?.inheritanceLabel,
        getMemberEffectiveInheritanceReason(member),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [memberContexts, search, sortedMembers]);

  const draftMembers = useMemo(() => {
    if (!form.name.trim() && !form.id) return members;
    const memberId = form.id || '__draft_member__';
    const draftMember: SiennaFamilyMember = {
      id: memberId,
      parent_id: form.parent_id === 'root' ? null : form.parent_id,
      relationship_to_parent: form.parent_id === 'root' ? null : form.relationship_to_parent,
      name: form.name.trim() || 'Miembro sin nombre',
      birth: form.birth || null,
      death: form.death || null,
      spouse_member_id: form.spouse_member_id || null,
      spouse: resolveSpouseName(form.spouse_member_id, members, form.spouse) || null,
      spouse_birth: form.spouse_birth || null,
      inheritance_status: resolvedInheritanceStatus,
      inheritance_reason: resolvedInheritanceReason,
      is_highlighted_ancestor: form.is_highlighted_ancestor,
      sort_order: Number(form.sort_order || 0),
    };
    return members.some((member) => member.id === memberId)
      ? members.map((member) => (member.id === memberId ? draftMember : member))
      : [...members, draftMember];
  }, [form, members, resolvedInheritanceReason, resolvedInheritanceStatus]);

  const formContext = useMemo(() => {
    const memberId = form.id || '__draft_member__';
    const draftMember: SiennaFamilyMember = {
      id: memberId,
      parent_id: form.parent_id === 'root' ? null : form.parent_id,
      relationship_to_parent: form.parent_id === 'root' ? null : form.relationship_to_parent,
      name: form.name.trim() || 'Borrador',
      birth: form.birth || null,
      death: form.death || null,
      spouse_member_id: form.spouse_member_id || null,
      spouse: resolveSpouseName(form.spouse_member_id, members, form.spouse) || null,
      spouse_birth: form.spouse_birth || null,
      inheritance_status: resolvedInheritanceStatus,
      inheritance_reason: resolvedInheritanceReason,
      is_highlighted_ancestor: form.is_highlighted_ancestor,
      sort_order: Number(form.sort_order || 0),
    };

    return buildMemberTreeContext(draftMember, draftMembers, inheritancePlan, genealogy);
  }, [draftMembers, form, genealogy, inheritancePlan, resolvedInheritanceReason, resolvedInheritanceStatus]);

  const simulation = useMemo(() => {
    const current = buildDominicanInheritancePlan(members, genealogy);
    const projected = buildDominicanInheritancePlan(draftMembers, genealogy);
    const names = new Set([
      ...current.activeHeirs.map((share) => share.member.id),
      ...projected.activeHeirs.map((share) => share.member.id),
    ]);

    return Array.from(names).map((id) => {
      const before = current.sharesById.get(id);
      const after = projected.sharesById.get(id);
      return {
        id,
        name: after?.member.name || before?.member.name || 'Miembro',
        beforeShare: before?.share || 0,
        afterShare: after?.share || 0,
        delta: (after?.share || 0) - (before?.share || 0),
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [draftMembers, genealogy, members]);
  const shouldShowSaveSimulator = Boolean(form.id || form.name.trim());

  const filiationUnionOptions = useMemo(() => {
    if (form.parent_id === 'root') return [];
    const parent = membersById.get(form.parent_id);
    if (!parent) return [];
    return buildUnionOptionsForParent(parent.id, unions, membersById);
  }, [form.parent_id, membersById, unions]);

  const secondParentOptions = useMemo(() => {
    if (form.parent_id === 'root') return [];
    const parent = membersById.get(form.parent_id);
    if (!parent) return [];
    return buildSecondParentOptions(parent.id, form.filiation_union_id || null, members, unions);
  }, [form.filiation_union_id, form.parent_id, members, membersById, unions]);

  const saveMember = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Falta el nombre', description: 'El nombre del miembro es obligatorio.' });
      return;
    }

    setSaving(true);
    try {
      const memberId = form.id || makeId(form.name);
      const memberName = form.name.trim();
      const savingPhoto = photoDraft.dirty;
      await api.saveSiennaFamilyMember({
        id: memberId,
        parent_id: form.parent_id === 'root' ? null : form.parent_id,
        relationship_to_parent: form.parent_id === 'root' ? null : form.relationship_to_parent,
        name: memberName,
        birth: form.birth || null,
        death: form.death || null,
        spouse_member_id: form.spouse_member_id || null,
        spouse: resolveSpouseName(form.spouse_member_id, members, form.spouse) || null,
        spouse_birth: form.spouse_birth || null,
        inheritance_status: resolvedInheritanceStatus,
        inheritance_reason: resolvedInheritanceReason,
        is_highlighted_ancestor: form.is_highlighted_ancestor,
        sort_order: Number(form.sort_order || 0),
        filiation:
          form.parent_id !== 'root' &&
          (form.relationship_to_parent === 'hijo' || form.relationship_to_parent === 'hija')
            ? {
                union_id: form.filiation_union_id || null,
                second_parent_id: form.second_parent_id || null,
              }
            : undefined,
      });

      if (savingPhoto) {
        await persistMemberPhoto(memberId, memberName);
        if (photoDraft.data) {
          setPhotoCache((current) => ({ ...current, [memberId]: photoDraft.data! }));
        }
      }

      resetForm();
      invalidateSiennaData(queryClient);
      await loadMembers();
      toast({
        title: 'Miembro guardado',
        description: savingPhoto
          ? 'Datos del árbol y foto del expediente actualizados.'
          : 'La administración del árbol fue actualizada.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (member: SiennaFamilyMember) => {
    if (!isAdmin) {
      toast({
        title: 'Accion restringida',
        description: 'Solo los administradores pueden eliminar miembros del arbol.',
        variant: 'destructive',
      });
      return;
    }
    if (!window.confirm(`Eliminar a ${member.name}? Esta accion no se puede deshacer.`)) return;

    setDeletingMemberId(member.id);
    try {
      await api.deleteSiennaFamilyMember(member.id);
      invalidateSiennaData(queryClient);
      await loadMembers();
      toast({ title: 'Miembro eliminado', description: 'Si tenía descendientes, quedaron como raíz temporal.' });
    } catch (error) {
      toast({
        title: 'No se pudo eliminar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setDeletingMemberId(null);
    }
  };

  const stats = useMemo(() => {
    const summary = {
      confirmed: members.filter((member) => getMemberEffectiveInheritanceStatus(member) === 'confirmado').length,
      possible: members.filter((member) => getMemberEffectiveInheritanceStatus(member) === 'posible_heredero').length,
      connectors: members.filter((member) => getMemberEffectiveInheritanceStatus(member) === 'no_hereda').length,
      pending: members.filter((member) => getMemberEffectiveInheritanceStatus(member) === 'requiere_revision').length,
      finalHeirs: inheritancePlan.activeHeirs.length,
    };

    return {
      ...summary,
      total: members.length,
      heirs: summary.finalHeirs,
      unions: unions.length,
      parentLinks: parentLinks.length,
      inconsistentUnions: unions.filter((union) => union.is_inconsistent).length,
    };
  }, [inheritancePlan.activeHeirs.length, members, parentLinks.length, unions]);

  const showChildFiliationFields =
    form.parent_id !== 'root' &&
    (form.relationship_to_parent === 'hijo' || form.relationship_to_parent === 'hija');
  const selectedParent = form.parent_id !== 'root' ? membersById.get(form.parent_id) : null;
  const editingPersonLabel = form.name.trim() || (form.id ? 'este miembro' : 'la persona del formulario');
  const superiorLabel = selectedParent?.name || 'el superior elegido';

  const heirsByMemberId = useMemo(
    () => new Map(heirs.filter((heir) => heir.sienna_member_id).map((heir) => [String(heir.sienna_member_id), heir])),
    [heirs]
  );

  const heirsByName = useMemo(
    () => new Map(heirs.filter((heir) => heir.heir_name).map((heir) => [normalizeName(heir.heir_name), heir])),
    [heirs]
  );

  const memberIdByHeirName = useMemo(
    () =>
      new Map(
        heirs
          .filter((heir) => heir.sienna_member_id && heir.heir_name)
          .map((heir) => [normalizeName(heir.heir_name), String(heir.sienna_member_id)])
      ),
    [heirs]
  );

  const documentsByMemberId = useMemo(() => {
    const map = new Map<string, EvidenceDocument[]>();
    documents.forEach((document) => {
      const memberId =
        (document.related_member_id && String(document.related_member_id)) ||
        (document.related_heir_name ? memberIdByHeirName.get(normalizeName(document.related_heir_name)) : undefined);
      if (!memberId) return;
      const current = map.get(memberId) || [];
      current.push(document);
      map.set(memberId, current);
    });
    return map;
  }, [documents, memberIdByHeirName]);

  const viewerMemberDocuments = useMemo(
    () => (viewerMemberId ? documentsByMemberId.get(viewerMemberId) || [] : []),
    [documentsByMemberId, viewerMemberId]
  );

  const selectedViewerDocument = useMemo(
    () =>
      viewerMemberDocuments.find((document) => document.id === viewerDocumentId) ||
      viewerMemberDocuments[0] ||
      null,
    [viewerDocumentId, viewerMemberDocuments]
  );

  return (
    <SiennaPageLayout>
      <BackButton />

      <DocumentHeader
        title="Miembros del Árbol Sienna"
        subtitle="Registro operativo: línea parental, rama sucesoral, conexión al árbol y si el miembro hereda o actúa solo como enlace"
        helpKey="sienna-miembros"
        helpToolbar={<MemberRegistrationGuide variant="icon" />}
      />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/sienna/arbol-genealogico">Ver árbol</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/sienna/explicacion-herederos">Explicación para herederos</Link>
        </Button>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/settings">Settings</Link>
          </Button>
        )}
      </div>

      <div className="w-full space-y-6">
        {loading && (
          <Card className="border border-legal-blue/20 bg-legal-blue/5">
            <CardContent className="p-4">
              <p className="inline-flex items-center gap-2 text-sm text-legal-blue">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingMessage}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Miembros</p><p className="text-2xl font-bold text-legal-blue">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Herederos</p><p className="text-2xl font-bold text-legal-blue">{stats.heirs}</p></CardContent></Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-legal-gray">Pendientes</p>
              <p className="text-2xl font-bold text-legal-blue">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Documentos</p><p className="text-2xl font-bold text-legal-blue">{documents.length}</p></CardContent></Card>
        </div>

        <details className="rounded-md border border-legal-blue/15 bg-white">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-legal-blue">
            <span className="inline-flex items-center gap-2">
              <GitMerge className="h-4 w-4" />
              Detalles técnicos de uniones y filiación
            </span>
            <span className="text-xs font-normal text-legal-gray">
              {stats.connectors} enlaces · {stats.unions} uniones · {stats.parentLinks} vínculos
            </span>
          </summary>
          <div className="space-y-3 border-t border-legal-blue/10 p-4 text-sm text-gray-700">
            {stats.inconsistentUnions > 0 && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-800">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {stats.inconsistentUnions} unión(es) por revisar
              </Badge>
            )}
            <p>
              <strong>No hay una pantalla aparte.</strong> Las uniones se crean al guardar un adulto con{' '}
              <strong>Cónyuge enlazado</strong> (miembro del árbol). La filiación del hijo se define al guardar un{' '}
              <strong>hijo/hija</strong> en la sección del formulario más abajo.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Edite al padre o madre → enlace su cónyuge → Guarde (se crea la unión).</li>
              <li>Edite al hijo → Parentesco Hijo/Hija → elija la unión de filiación → Guarde.</li>
            </ol>
            {unions.length > 0 ? (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-legal-blue/15 bg-white/80 p-3 text-xs">
                {unionsSortedByLabel.slice(0, 24).map((union) => (
                  <li key={union.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-legal-blue">{formatUnionLabel(union, membersById)}</span>
                    {union.is_inconsistent && (
                      <Badge variant="outline" className="text-amber-700">
                        revisar
                      </Badge>
                    )}
                  </li>
                ))}
                {unions.length > 24 && (
                  <li className="text-legal-gray">… y {unions.length - 24} más</li>
                )}
              </ul>
            ) : (
              <p className="text-legal-gray">Aún no hay uniones cargadas. Enlace cónyuges al guardar adultos.</p>
            )}
          </div>
        </details>

        <Card ref={formSectionRef} className="scroll-mt-24 border border-legal-gold/20">
          <CardHeader className="bg-legal-blue/5 border-b">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-legal-blue">
                <UserPlus className="h-5 w-5" />
                {form.id ? 'Editar Miembro' : 'Agregar Miembro'}
              </CardTitle>
              <div className="flex items-center gap-1">
                <MemberRegistrationGuide variant="icon" />
                <PageHelp helpKey="sienna-miembros-agregar" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Foto del miembro</Label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <MemberPhoto
                  name={form.name || 'Miembro'}
                  memberId={form.id || null}
                  photoData={photoDraft.data}
                  size="lg"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={!form.name.trim()}
                    onChange={(event) => {
                      void handlePhotoPick(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  <p className="text-xs leading-relaxed text-legal-gray">
                    Elija una imagen y pulse Guardar. Se almacena en el expediente del heredero vinculado a este
                    miembro.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label>Conectar debajo de (nodo superior)</Label>
              <Select value={form.parent_id} onValueChange={(value) => updateForm('parent_id', value)}>
                <SelectTrigger><SelectValue placeholder="Seleccione el ascendiente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Raíz del árbol (sin superior)</SelectItem>
                  {spouseOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {formatParentOptionLabel(member, members)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-legal-gray">
                Persona a la que se une en el árbol. El parentesco indica cómo se relaciona con ese superior.
              </p>
            </div>
            <div>
              <Label>Parentesco con el superior</Label>
              <Select
                value={form.relationship_to_parent}
                onValueChange={(value) => updateForm('relationship_to_parent', value)}
                disabled={form.parent_id === 'root'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hijo">Hijo</SelectItem>
                  <SelectItem value="hija">Hija</SelectItem>
                  <SelectItem value="conyuge">Cónyuge</SelectItem>
                  <SelectItem value="padre">Padre</SelectItem>
                  <SelectItem value="madre">Madre</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 space-y-4 rounded-lg border-2 border-legal-blue/25 bg-legal-blue/[0.04] p-4">
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-legal-blue">
                  <GitMerge className="h-4 w-4" />
                  Unión matrimonial de {editingPersonLabel}
                </p>
                <p className="mt-1 text-xs text-legal-gray">
                  El cónyuge que elijas aquí es de <strong>{editingPersonLabel}</strong>, no del nodo superior (
                  {superiorLabel}). Al guardar, se registra la pareja para poder asignar hijos a ese matrimonio.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Cónyuge de {editingPersonLabel} (miembro del árbol)</Label>
                  <Select
                    value={form.spouse_member_id || '__none__'}
                    onValueChange={(value) => {
                      if (value === '__none__') {
                        updateForm('spouse_member_id', '');
                        updateForm('spouse', '');
                        updateForm('spouse_birth', '');
                        return;
                      }
                      const spouseMember = membersById.get(value);
                      updateForm('spouse_member_id', value);
                      updateForm('spouse', spouseMember?.name || '');
                      updateForm('spouse_birth', spouseMember?.birth || '');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccione un cónyuge del árbol" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin cónyuge enlazado</SelectItem>
                      {spouseOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nacimiento del cónyuge de {editingPersonLabel}</Label>
                  <Input
                    value={form.spouse_birth}
                    onChange={(event) => updateForm('spouse_birth', event.target.value)}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-4 space-y-4 rounded-lg border-2 border-legal-gold/35 bg-legal-gold/[0.06] p-4">
              <div>
                <p className="text-sm font-semibold text-legal-blue">
                  Filiación de {editingPersonLabel} como hijo o hija
                </p>
                <p className="mt-1 text-xs text-legal-gray">
                  Solo aplica si {editingPersonLabel} es hijo/hija de <strong>{superiorLabel}</strong> en el árbol.
                  Aquí defines de qué matrimonio es ese hijo (no el cónyuge personal de {editingPersonLabel}).
                </p>
              </div>
              {showChildFiliationFields ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Matrimonio / pareja de {editingPersonLabel} (progenitor: {superiorLabel})</Label>
                    <Select
                      value={form.filiation_union_id || '__none__'}
                      onValueChange={(value) => {
                        const unionId = value === '__none__' ? '' : value;
                        updateForm('filiation_union_id', unionId);
                        if (!unionId) {
                          updateForm('second_parent_id', '');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin unión registrada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin unión (hijo de otra relación / solo este progenitor)</SelectItem>
                        {filiationUnionOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filiationUnionOptions.length === 0 && selectedParent && (
                      <p className="mt-2 flex items-start gap-1 text-xs text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {superiorLabel} no tiene unión registrada. Edítelo, enlace su cónyuge en el bloque azul de su
                        ficha, guarde, y vuelva a {editingPersonLabel}.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Otro progenitor de {editingPersonLabel} (pareja de {superiorLabel})</Label>
                    <Select
                      value={form.second_parent_id || '__none__'}
                      onValueChange={(value) =>
                        updateForm('second_parent_id', value === '__none__' ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin segundo progenitor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin segundo progenitor</SelectItem>
                        {secondParentOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {secondParentOptions.length === 0 && selectedParent?.spouse_member_id && (
                      <p className="mt-1 text-xs text-legal-gray">
                        {superiorLabel} no tiene cónyuge enlazado por ID; edite su ficha (bloque azul) primero.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-legal-gray">
                  Para activar estos campos: elija un <strong>nodo superior</strong> y parentesco{' '}
                  <strong>Hijo</strong> o <strong>Hija</strong> para {editingPersonLabel}. Abra la{' '}
                  <strong>Guía de registro</strong> (icono libro junto a ?) para ver el ejemplo de Víctor Manuel.
                </p>
              )}
            </div>

            <div>
              <Label>Nacimiento</Label>
              <Input value={form.birth} onChange={(event) => updateForm('birth', event.target.value)} placeholder="dd/mm/aaaa" />
            </div>
            <div>
              <Label>Defunción</Label>
              <Input value={form.death} onChange={(event) => updateForm('death', event.target.value)} placeholder="dd/mm/aaaa" />
            </div>
            <div>
              <Label>Orden entre hermanos</Label>
              <Input type="number" value={form.sort_order} onChange={(event) => updateForm('sort_order', event.target.value)} />
            </div>
            <div>
              <Label>Estado hereditario</Label>
              <Select
                value={form.inheritance_status}
                onValueChange={(value) => updateForm('inheritance_status', value)}
                disabled={!manualInheritanceOverride}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="requiere_revision">Autodetectar (recomendado)</SelectItem>
                  <SelectItem value="posible_heredero">Posible heredero</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="no_hereda">No hereda</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-legal-gray">
                En modo autodetectar, el sistema clasifica usando parentesco, linea, defuncion y representacion.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Checkbox
                  id="manualInheritanceOverride"
                  checked={manualInheritanceOverride}
                  onCheckedChange={(checked) => {
                    const enabled = Boolean(checked);
                    if (!enabled) {
                      updateForm('inheritance_status', 'requiere_revision');
                      return;
                    }
                    if (form.inheritance_status === 'requiere_revision') {
                      updateForm('inheritance_status', evaluation.inheritance_status);
                    }
                  }}
                />
                <Label htmlFor="manualInheritanceOverride">Forzar estado manual</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="highlightedAncestorCrud"
                checked={form.is_highlighted_ancestor}
                onCheckedChange={(checked) => updateForm('is_highlighted_ancestor', Boolean(checked))}
              />
              <Label htmlFor="highlightedAncestorCrud">Resaltar nodo</Label>
            </div>
            <div className="md:col-span-4">
              <Label>Razón / explicación</Label>
              <Textarea
                value={manualInheritanceOverride ? form.inheritance_reason || '' : evaluation.inheritance_reason || ''}
                onChange={(event) => updateForm('inheritance_reason', event.target.value)}
                rows={3}
                disabled={!manualInheritanceOverride}
              />
            </div>
            <div className="rounded-md border border-legal-blue/20 bg-legal-blue/5 p-4 md:col-span-2">
              <p className="text-sm font-semibold text-legal-blue">Evaluación sugerida (reparto)</p>
              <Badge className="mt-2" variant={evaluation.inheritance_status === 'posible_heredero' ? 'default' : 'secondary'}>
                {evaluation.inheritance_status.replace(/_/g, ' ')}
              </Badge>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{evaluation.inheritance_reason}</p>
            </div>
            <div className="rounded-md border border-legal-gold/25 bg-legal-gold/5 p-4 md:col-span-2">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-legal-blue">
                <GitBranch className="h-4 w-4" />
                Posición en el árbol (vista previa)
              </p>
              <MemberTreeContextPanel context={formContext} />
            </div>
            <div className="flex flex-col justify-end gap-2 sm:flex-row md:col-span-2">
              <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                Limpiar
              </Button>
              <Button
                onClick={saveMember}
                disabled={saving}
                className="w-full bg-legal-gold text-white hover:bg-legal-gold/90 sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        {shouldShowSaveSimulator && (
        <details className="rounded-md border border-legal-gold/20 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-legal-blue">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Simulador antes de guardar
            </span>
            <span className="text-xs font-normal text-legal-gray">
              {form.id ? 'Editando miembro' : 'Nuevo miembro en proceso'}
            </span>
          </summary>
          <div className="space-y-4 border-t border-legal-blue/10 p-4 sm:p-6">
            <p className="text-sm text-gray-700">
              Al editar nombre, nodo superior, defunción o parentesco, vea cómo cambian los porcentajes de los herederos
              activos. Los cambios solo se aplican al guardar el miembro.
            </p>
            {simulation.length === 0 ? (
              <p className="text-sm text-legal-gray">No hay herederos activos en la simulación actual.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {simulation.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-md border p-3 ${row.delta !== 0 ? 'border-legal-gold/50 bg-legal-gold/5' : 'border-legal-blue/15'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-legal-blue">{row.name}</p>
                      <p className="text-xs text-legal-gray">
                        {row.delta > 0 ? '+' : ''}
                        {formatPercent(row.delta)}
                      </p>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-legal-gray">
                      <span>Antes: {formatPercent(row.beforeShare)}</span>
                      <span>Después: {formatPercent(row.afterShare)}</span>
                    </div>
                    <Progress className="mt-2 h-2" value={row.afterShare} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
        )}

        <Card className="border border-legal-gold/20">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Users className="h-5 w-5" />
              Tabla de Miembros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-legal-gray" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, línea parental, rama o herencia..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Rama</TableHead>
                  <TableHead>Conexión</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead className="hidden xl:table-cell">Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-legal-gray">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-legal-blue" />
                        {loadingMessage}
                      </span>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-legal-gray">
                      No hay miembros que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filteredMembers.map((member) => {
                    const context = memberContexts.get(member.id);
                    if (!context) return null;
                    const linkedHeir = heirsByMemberId.get(member.id) || heirsByName.get(normalizeName(member.name));
                    const isConfirmedByEvidence = linkedHeir?.status === 'confirmado';
                    const displayInheritanceLabel = isConfirmedByEvidence
                      ? 'Sí — confirmado documentalmente'
                      : context.inheritanceLabel;
                    const displayTreeRoleLabel = isConfirmedByEvidence
                      ? 'Heredero confirmado (expediente)'
                      : context.treeRoleLabel;
                    const displayInherits = context.inherits || isConfirmedByEvidence;
                    const memberDocuments = documentsByMemberId.get(member.id) || [];
                    const spouseLabel =
                      (member.spouse_member_id ? membersById.get(member.spouse_member_id.trim())?.name : null) ||
                      member.spouse ||
                      null;
                    const isPendingInheritance =
                      getMemberEffectiveInheritanceStatus(member) ===
                      'requiere_revision';

                    return (
                      <TableRow key={member.id}>
                        <TableCell className="min-w-[240px]">
                          <div className="flex items-start gap-2">
                            <MemberPhoto
                              name={member.name}
                              memberId={member.id}
                              photoData={photoCache[member.id]}
                              lookup={photoLookup}
                              size="sm"
                              pendingInheritance={isPendingInheritance}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-legal-blue">{member.name}</p>
                              <p className="mt-1 text-xs text-legal-gray">
                                {member.birth || 'Sin nacimiento'}{member.death ? ' · † ' + member.death : ''}
                              </p>
                              {member.is_highlighted_ancestor && (
                                <Badge className="mt-1" variant="outline">
                                  Destacado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[170px]">
                          <div className="space-y-1.5">
                            <Badge
                              variant={displayInherits ? 'default' : 'secondary'}
                              className={displayInherits ? 'bg-legal-gold text-white hover:bg-legal-gold/90' : ''}
                            >
                              {displayInherits ? 'Hereda' : 'No hereda'}
                            </Badge>
                          <MemberVerificationBadge
                            member={member}
                            members={members}
                            genealogy={genealogy}
                          />
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          <p className="text-sm font-medium text-legal-blue">{context.collateralLine}</p>
                          <p className="mt-1 text-xs text-legal-gray">Nivel {context.treeLevel} · {displayTreeRoleLabel}</p>
                        </TableCell>
                        <TableCell className="max-w-[280px] text-sm text-gray-700">
                          <p className="line-clamp-2">{context.parentalLine}</p>
                          <p className="mt-1 text-xs text-legal-gray">{context.connectionLabel}</p>
                          {spouseLabel ? (
                            <p className="mt-1 truncate text-xs text-legal-gray">Cónyuge: {spouseLabel}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            {memberDocuments.length > 0 ? (
                              <Badge variant="outline">{memberDocuments.length} acta(s)</Badge>
                            ) : (
                              <Link
                                to={buildSiennaDocumentSupportHref(
                                  member.id,
                                  displayInherits ? 'heir-support' : 'member-support'
                                )}
                                className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-legal-gold focus-visible:ring-offset-2"
                                title="Cargar documento para este miembro"
                              >
                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                                  0 actas
                                </Badge>
                              </Link>
                            )}
                            <Dialog
                              onOpenChange={(open) => {
                                if (open) {
                                  setViewerMemberId(member.id);
                                  setViewerDocumentId(memberDocuments[0]?.id || null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={memberDocuments.length === 0}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Documentación de {member.name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-3 md:grid-cols-[280px_1fr]">
                                  <div className="max-h-[60vh] space-y-2 overflow-y-auto border-r pr-2">
                                    {[...memberDocuments]
                                      .sort((left, right) =>
                                        (left.title || '').localeCompare(right.title || '', 'es', {
                                          sensitivity: 'base',
                                        })
                                      )
                                      .map((document) => (
                                      <button
                                        key={document.id}
                                        type="button"
                                        onClick={() => setViewerDocumentId(document.id || null)}
                                        className={`w-full rounded border p-2 text-left text-sm ${
                                          selectedViewerDocument?.id === document.id
                                            ? 'border-legal-gold bg-legal-gold/10'
                                            : 'border-legal-blue/15'
                                        }`}
                                      >
                                        <p className="font-medium text-legal-blue">{document.title}</p>
                                        <p className="mt-1 text-xs text-legal-gray">{document.document_type}</p>
                                      </button>
                                    ))}
                                  </div>
                                  <div className="max-h-[60vh] overflow-y-auto rounded border bg-white p-3">
                                    {!selectedViewerDocument ? (
                                      <p className="text-sm text-legal-gray">No hay documentos vinculados.</p>
                                    ) : (
                                      <div className="space-y-3">
                                        <div>
                                          <p className="font-semibold text-legal-blue">{selectedViewerDocument.title}</p>
                                          <p className="text-xs text-legal-gray">
                                            {selectedViewerDocument.document_type} · {selectedViewerDocument.event_date || 'Sin fecha'}
                                          </p>
                                        </div>
                                        {selectedViewerDocument.file_data ? (
                                          selectedViewerDocument.file_type?.startsWith('image/') ? (
                                            <img
                                              src={selectedViewerDocument.file_data}
                                              alt={selectedViewerDocument.title}
                                              className="max-h-[420px] w-full rounded border object-contain"
                                            />
                                          ) : selectedViewerDocument.file_type === 'application/pdf' ? (
                                            <iframe
                                              title={selectedViewerDocument.title}
                                              src={selectedViewerDocument.file_data}
                                              className="h-[420px] w-full rounded border"
                                            />
                                          ) : (
                                            <a
                                              href={selectedViewerDocument.file_data}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center text-sm text-legal-blue underline"
                                            >
                                              Abrir archivo
                                            </a>
                                          )
                                        ) : selectedViewerDocument.extracted_text ? (
                                          <div className="rounded border bg-legal-beige/20 p-3 text-xs leading-relaxed text-gray-700">
                                            {selectedViewerDocument.extracted_text}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-legal-gray">Este registro no tiene archivo adjunto.</p>
                                        )}
                                        {selectedViewerDocument.notes && (
                                          <div className="rounded border bg-legal-blue/5 p-2 text-xs text-gray-700">
                                            {selectedViewerDocument.notes}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                        <TableCell className="hidden min-w-[200px] text-sm text-gray-700 xl:table-cell">
                          <p className="line-clamp-2">
                            {getMemberEffectiveInheritanceReason(member) ||
                              context.routeLabel ||
                              '—'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openMemberForEdit(member)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDetailMemberId(member.id)}>
                              Ficha
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={deletingMemberId === member.id}
                                onClick={() => deleteMember(member)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <MemberDetailSheet
        member={detailMember}
        members={members}
        genealogy={genealogy}
        heirs={heirs}
        documents={documents}
        photoData={detailMember ? photoCache[detailMember.id] : null}
        open={Boolean(detailMember)}
        onOpenChange={(open) => !open && setDetailMemberId(null)}
      />
    </SiennaPageLayout>
  );
};

export default MiembrosArbolSienna;
