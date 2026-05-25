import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import MemberPhoto from '@/components/sienna/MemberPhoto';
import { api, ConfirmedHeir, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { invalidateSiennaData, useSiennaWorkspace } from '@/hooks/useSiennaData';
import { buildMemberPhotoLookup } from '@/lib/memberPhotos';
import { getMemberLinkVerificationStatus } from '@/lib/siennaGenealogy';
import { sortMembersByName } from '@/lib/siennaFamilyTree';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { readFileAsDataUrl } from '@/lib/readFileAsDataUrl';
import { Archive, Eye, FileImage, FileSearch, RefreshCcw, Save, Trash2, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type DocumentForm = Omit<EvidenceDocument, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: DocumentForm = {
  title: '',
  document_type: 'Acta no clasificada',
  primary_member_id: '',
  primary_person: '',
  event_date: '',
  event_place: '',
  father_member_id: '',
  father_name: '',
  mother_member_id: '',
  mother_name: '',
  spouse_member_id: '',
  spouse_name: '',
  related_member_id: '',
  related_heir_name: '',
  confirms_heir: false,
  people_involved: [],
  extracted_text: '',
  notes: '',
  file_name: '',
  file_type: '',
  file_data: '',
};

const documentTypes = [
  'Acta de nacimiento',
  'Acta de defunción',
  'Acta de matrimonio',
  'Documento de identidad',
  'Sentencia o acto legal',
  'Acta no clasificada',
].sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const firstMatch = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim();
  }
  return '';
};

const detectDocumentType = (text: string) => {
  const normalized = normalizeText(text);
  if (/DEFUNCION|DEFUNCI[oO]N|DECES|MUERTE|FALLEC/.test(normalized)) return 'Acta de defunción';
  if (/NACIMIENTO|NASCITA|NAISSANCE|BIRTH|NACIO|NATO/.test(normalized)) return 'Acta de nacimiento';
  if (/MATRIMONIO|MARRIAGE|SPOS/.test(normalized)) return 'Acta de matrimonio';
  if (/CEDULA|IDENTIDAD|PASAPORTE|IDENTITY/.test(normalized)) return 'Documento de identidad';
  if (/SENTENCIA|TRIBUNAL|NOTARIAL|ACTO LEGAL/.test(normalized)) return 'Sentencia o acto legal';
  return 'Acta no clasificada';
};

const parseDocument = (text: string, knownPeople: string[]): Partial<DocumentForm> => {
  const normalized = normalizeText(text);
  const detectedPeople = knownPeople.filter((person) => normalized.includes(normalizeText(person)));
  const documentType = detectDocumentType(text);
  const date = firstMatch(text, [
    /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/,
    /(?:fecha|date|data)[^\d]{0,20}(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
  ]);
  const fatherName = firstMatch(text, [
    /(?:padre|pere|father|paternidad)[:\s-]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ'\s]{3,80})/i,
    /(?:hijo de|figlio di)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ'\s]{3,80})/i,
  ]);
  const motherName = firstMatch(text, [
    /(?:madre|mere|mother|maternidad)[:\s-]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ'\s]{3,80})/i,
    /(?:y de|e da)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ'\s]{3,80})/i,
  ]);
  const place = firstMatch(text, [
    /(?:lugar|place|comune|municipio)[:\s-]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ'\s,.-]{3,90})/i,
    /(Santa Domenica Talao|Santo Domingo|Puerto Plata|Santiago)/i,
  ]);

  const primaryPerson = detectedPeople[0] || firstMatch(text, [
    /(?:nombre|name|cognome e nome|nom et pr[eé]noms?)[:\s-]+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ'\s]{3,90})/i,
  ]);

  return {
    document_type: documentType,
    title: primaryPerson ? `${documentType}: ${primaryPerson}` : documentType,
    primary_person: primaryPerson,
    event_date: date,
    event_place: place,
    father_name: fatherName,
    mother_name: motherName,
    people_involved: detectedPeople,
    extracted_text: text,
  };
};

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

const memberNameById = (
  memberId: string | null | undefined,
  membersById: Map<string, SiennaFamilyMember>
) => (memberId ? membersById.get(memberId)?.name || '' : '');

const findSpousePartner = (
  member: SiennaFamilyMember,
  membersByName: Map<string, SiennaFamilyMember>
) => {
  if (member.spouse) {
    const direct = membersByName.get(normalizeName(member.spouse));
    if (direct) return direct;
  }

  for (const candidate of membersByName.values()) {
    if (candidate.id === member.id) continue;
    if (candidate.spouse && normalizeName(candidate.spouse) === normalizeName(member.name)) {
      return candidate;
    }
  }

  return null;
};

const DocumentosProbatorios = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { data: workspace, refetch } = useSiennaWorkspace(true);
  const members = workspace?.members ?? [];
  const heirs = workspace?.heirs ?? [];
  const genealogy = useMemo(
    () => ({
      unions: workspace?.unions ?? [],
      parent_links: workspace?.parent_links ?? [],
    }),
    [workspace?.parent_links, workspace?.unions]
  );
  const [documentOverrides, setDocumentOverrides] = useState<Record<string, EvidenceDocument>>({});
  const documents = useMemo(
    () =>
      (workspace?.documents ?? []).map((document) =>
        document.id && documentOverrides[document.id] ? { ...document, ...documentOverrides[document.id] } : document
      ),
    [documentOverrides, workspace?.documents]
  );
  const [form, setForm] = useState<DocumentForm>(emptyForm);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [heirDrafts, setHeirDrafts] = useState<Record<string, Partial<ConfirmedHeir>>>({});
  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);
  const [appliedPrefillKey, setAppliedPrefillKey] = useState('');

  const selectedHeir = useMemo(
    () => heirs.find((heir) => heir.heir_name === form.related_heir_name),
    [heirs, form.related_heir_name]
  );
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );
  const photoLookup = useMemo(() => buildMemberPhotoLookup(heirs), [heirs]);
  const verificationStatusForMember = useCallback(
    (member?: SiennaFamilyMember | null) =>
      member ? getMemberLinkVerificationStatus(member, members, genealogy).status : null,
    [genealogy, members]
  );
  const membersByName = useMemo(
    () => new Map(members.map((member) => [normalizeName(member.name), member])),
    [members]
  );
  const membersSortedByName = useMemo(() => sortMembersByName(members), [members]);
  const heirsSortedByName = useMemo(
    () =>
      [...heirs].sort((left, right) =>
        left.heir_name.localeCompare(right.heir_name, 'es', { sensitivity: 'base' })
      ),
    [heirs]
  );
  const documentsSortedByTitle = useMemo(
    () =>
      [...documents].sort((left, right) =>
        (left.title || '').localeCompare(right.title || '', 'es', { sensitivity: 'base' })
      ),
    [documents]
  );
  const knownPeople = useMemo(() => membersSortedByName.map((member) => member.name), [membersSortedByName]);
  const getAutoLinkedRelatives = (memberId: string) => {
    const primary = membersById.get(memberId);
    if (!primary) {
      return {
        primary_member_id: '',
        primary_person: '',
        father_member_id: '',
        father_name: '',
        mother_member_id: '',
        mother_name: '',
        spouse_member_id: '',
        spouse_name: '',
      };
    }

    const parentId = primary.parent_id ? String(primary.parent_id).trim() : '';
    const parent = parentId ? membersById.get(parentId) || null : null;
    const parentPartner = parent ? findSpousePartner(parent, membersByName) : null;
    const spousePartner = findSpousePartner(primary, membersByName);

    return {
      primary_member_id: primary.id,
      primary_person: primary.name,
      father_member_id: parent?.id || '',
      father_name: parent?.name || '',
      mother_member_id: parentPartner?.id || '',
      mother_name: parentPartner?.name || '',
      spouse_member_id: spousePartner?.id || '',
      spouse_name: spousePartner?.name || '',
    };
  };

  useEffect(() => {
    const requestedMemberId = searchParams.get('memberId') || searchParams.get('member') || '';
    if (!requestedMemberId || !membersById.has(requestedMemberId)) return;

    const intent = searchParams.get('intent') || '';
    const prefillKey = `${requestedMemberId}:${intent}:${members.length}:${heirs.length}`;
    if (appliedPrefillKey === prefillKey) return;

    const member = membersById.get(requestedMemberId);
    const linkedHeir = heirs.find((heir) => heir.sienna_member_id === requestedMemberId);
    const autoRelatives = getAutoLinkedRelatives(requestedMemberId);
    const isHeirSupport = intent === 'heir-support';

    setForm((current) => ({
      ...current,
      ...autoRelatives,
      title:
        current.title ||
        (member ? `${isHeirSupport ? 'Acta de nacimiento' : 'Documento de soporte'}: ${member.name}` : current.title),
      document_type: isHeirSupport ? 'Acta de nacimiento' : current.document_type || 'Acta no clasificada',
      related_member_id: requestedMemberId,
      related_heir_name: linkedHeir?.heir_name || current.related_heir_name || '',
      confirms_heir: isHeirSupport ? true : current.confirms_heir,
      notes:
        current.notes ||
        (isHeirSupport
          ? 'Soporte cargado desde Explicación de Herederos para validar el vínculo hereditario.'
          : current.notes),
    }));
    setAppliedPrefillKey(prefillKey);
  }, [appliedPrefillKey, heirs, members.length, membersById, searchParams]);

  const loadData = async () => {
    await refetch();
  };

  const ensureDocumentMedia = useCallback(async (documentId: string | null) => {
    if (!documentId) return;
    const document = documents.find((item) => item.id === documentId);
    if (!document || document.file_data) return;
    if (!document.has_file && !document.has_extracted_text) return;
    const response = await api.getEvidenceDocument(documentId);
    setDocumentOverrides((current) => ({
      ...current,
      [documentId]: response.document,
    }));
  }, [documents]);

  useEffect(() => {
    void ensureDocumentMedia(viewerDocumentId);
  }, [ensureDocumentMedia, viewerDocumentId]);

  useEffect(() => {
    setHeirDrafts((current) => {
      const next: Record<string, Partial<ConfirmedHeir>> = {};
      heirs.forEach((heir) => {
        next[heir.id] = {
          ...heir,
          ...(current[heir.id] || {}),
        };
      });
      return next;
    });
  }, [heirs]);

  const updateForm = (field: keyof DocumentForm, value: string | boolean | string[]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    const fileData = await readFileAsDataUrl(file);
    updateForm('file_data', fileData);
    updateForm('file_name', file.name);
    updateForm('file_type', file.type);
    if (!form.title) updateForm('title', file.name.replace(/\.[^.]+$/, ''));
  };

  const interpretImage = async () => {
    if (!form.file_data) {
      toast({ title: 'Sube una imagen primero' });
      return;
    }

    setOcrBusy(true);
    setOcrProgress(0);
    try {
      const result = await Tesseract.recognize(form.file_data, 'spa+eng', {
        logger: (message) => {
          if (message.status === 'recognizing text') setOcrProgress(Math.round(message.progress * 100));
        },
      });
      const parsed = parseDocument(result.data.text, knownPeople);
      const findMemberId = (name?: string | null) => {
        if (!name) return '';
        return membersByName.get(normalizeName(name))?.id || '';
      };
      const primaryMemberId = findMemberId(parsed.primary_person);
      const fatherMemberId = findMemberId(parsed.father_name);
      const motherMemberId = findMemberId(parsed.mother_name);
      const spouseMemberId = findMemberId(parsed.spouse_name);
      setForm((current) => {
        const detectedPrimaryMemberId = primaryMemberId || current.related_member_id || '';
        const autoRelatives = detectedPrimaryMemberId ? getAutoLinkedRelatives(detectedPrimaryMemberId) : null;
        return {
          ...current,
          ...parsed,
          primary_member_id: autoRelatives?.primary_member_id || primaryMemberId || current.primary_member_id,
          related_member_id: current.related_member_id || primaryMemberId || '',
          primary_person: autoRelatives?.primary_person || parsed.primary_person || current.primary_person,
          father_member_id: autoRelatives?.father_member_id || fatherMemberId || current.father_member_id,
          father_name: autoRelatives?.father_name || parsed.father_name || current.father_name,
          mother_member_id: autoRelatives?.mother_member_id || motherMemberId || current.mother_member_id,
          mother_name: autoRelatives?.mother_name || parsed.mother_name || current.mother_name,
          spouse_member_id: autoRelatives?.spouse_member_id || spouseMemberId || current.spouse_member_id,
          spouse_name: autoRelatives?.spouse_name || parsed.spouse_name || current.spouse_name,
          file_data: current.file_data,
          file_name: current.file_name,
          file_type: current.file_type,
          notes: current.notes,
          related_heir_name: current.related_heir_name,
          confirms_heir: current.confirms_heir,
        };
      });
      toast({ title: 'Documento interpretado', description: 'Revisa y ajusta los datos antes de guardar.' });
    } catch (error) {
      toast({
        title: 'No se pudo interpretar automáticamente',
        description: error instanceof Error ? error.message : 'Puedes completar los datos manualmente.',
        variant: 'destructive',
      });
    } finally {
      setOcrBusy(false);
    }
  };

  const saveDocument = async () => {
    if (!form.document_type || !form.related_member_id) {
      toast({ title: 'Faltan datos', description: 'Tipo de documento y miembro relacionado son obligatorios.' });
      return;
    }

    setSaveBusy(true);
    try {
      const selectedHeirByMember = heirs.find((heir) => heir.sienna_member_id === form.related_member_id);
      const selectedHeirByName = heirs.find((heir) => heir.heir_name === form.related_heir_name);
      const relatedHeirName = form.related_heir_name || selectedHeirByMember?.heir_name || '';
      const relatedMemberId = form.related_member_id || selectedHeirByName?.sienna_member_id || '';
      const primaryMemberId = relatedMemberId || form.primary_member_id || '';
      const primaryPersonName = memberNameById(primaryMemberId, membersById) || '';
      const fatherName = memberNameById(form.father_member_id, membersById) || '';
      const motherName = memberNameById(form.mother_member_id, membersById) || '';
      const spouseName = memberNameById(form.spouse_member_id, membersById) || '';
      const peopleInvolved = Array.from(
        new Set(
          [
            primaryPersonName,
            fatherName,
            motherName,
            spouseName,
            memberNameById(relatedMemberId, membersById),
          ].filter(Boolean)
        )
      );
      const title =
        form.title ||
        `${form.document_type}${primaryPersonName ? `: ${primaryPersonName}` : ''}`;
      await api.saveEvidenceDocument({
        ...form,
        title,
        primary_member_id: primaryMemberId || null,
        primary_person: primaryPersonName || null,
        father_member_id: form.father_member_id || null,
        father_name: fatherName || null,
        mother_member_id: form.mother_member_id || null,
        mother_name: motherName || null,
        spouse_member_id: form.spouse_member_id || null,
        spouse_name: spouseName || null,
        related_member_id: relatedMemberId || null,
        related_heir_name: relatedHeirName || null,
        people_involved: peopleInvolved,
      });
      invalidateSiennaData(queryClient);
      await loadData();
      setForm(emptyForm);
      toast({ title: 'Documento guardado', description: 'El expediente probatorio fue actualizado.' });
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSaveBusy(false);
    }
  };

  const applyAutoRelativeLinks = () => {
    if (!form.related_member_id) {
      toast({
        title: 'Selecciona miembro titular',
        description: 'Primero elige el miembro titular para autocompletar parentescos.',
      });
      return;
    }

    const autoRelatives = getAutoLinkedRelatives(form.related_member_id);
    setForm((current) => ({
      ...current,
      ...autoRelatives,
    }));
    toast({
      title: 'Parentescos recalculados',
      description: 'Padre, madre y conyuge se actualizaron segun la estructura actual del arbol.',
    });
  };

  const deleteDocument = async (id?: string) => {
    if (!id) return;
    await api.deleteEvidenceDocument(id);
    invalidateSiennaData(queryClient);
    await loadData();
  };

  const updateHeirDraft = (id: string, value: Partial<ConfirmedHeir>) => {
    setHeirDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        ...value,
      },
    }));
  };

  const handleHeirPhoto = async (heir: ConfirmedHeir, file?: File) => {
    if (!file) return;
    const photoData = await readFileAsDataUrl(file);
    updateHeirDraft(heir.id, {
      photo_data: photoData,
      photo_file_name: file.name,
      photo_file_type: file.type,
    });
  };

  const saveHeirPresentation = async (heir: ConfirmedHeir) => {
    const draft = heirDrafts[heir.id] || {};
    try {
      await api.updateConfirmedHeir(heir.id, {
        sienna_member_id: heir.sienna_member_id || null,
        heir_name: heir.heir_name,
        relationship_summary: heir.relationship_summary,
        line_vincenzo: heir.line_vincenzo,
        line_paolo: heir.line_paolo,
        status: heir.status,
        notes: heir.notes,
        photo_file_name: draft.photo_file_name ?? heir.photo_file_name ?? null,
        photo_file_type: draft.photo_file_type ?? heir.photo_file_type ?? null,
        photo_data: draft.photo_data ?? heir.photo_data ?? null,
        inheritance_amount: Number(draft.inheritance_amount ?? heir.inheritance_amount ?? 0),
      });
      invalidateSiennaData(queryClient);
      await loadData();
      toast({ title: 'Heredero actualizado', description: 'Foto y monto quedaron guardados para el árbol del caso.' });
    } catch (error) {
      toast({
        title: 'No se pudo actualizar el heredero',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  const evidenceByHeir = useMemo(() => {
    return documents.reduce<Record<string, number>>((acc, document) => {
      const key = document.related_member_id || document.related_heir_name || '';
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [documents]);

  const viewerDocument = useMemo(
    () => documents.find((document) => document.id === viewerDocumentId) || null,
    [documents, viewerDocumentId]
  );

  return (
    <div className="app-shell py-8">
      <BackButton />

      <DocumentHeader
        title="Documentos Probatorios"
        subtitle="Carga de actas y documentos para vincular evidencia directamente con miembros del arbol"
        helpKey="documentos-probatorios"
      />

      <div className="max-w-[1500px] mx-auto space-y-6">
        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <FileImage className="h-5 w-5" />
              Cargar e Interpretar Acta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid lg:grid-cols-[320px_1fr] gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="acta">Imagen o documento</Label>
                  <Input
                    id="acta"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                </div>

                {form.file_data && form.file_type?.startsWith('image/') && (
                  <div className="border rounded-md overflow-hidden bg-white">
                    <img src={form.file_data} alt="Vista previa del documento" className="w-full object-contain max-h-[360px]" />
                  </div>
                )}

                <Button
                  type="button"
                  onClick={interpretImage}
                  disabled={ocrBusy || !form.file_data || form.file_type === 'application/pdf'}
                  className="w-full bg-legal-blue hover:bg-legal-blue/90"
                >
                  <FileSearch className="h-4 w-4 mr-2" />
                  {ocrBusy ? `Interpretando ${ocrProgress}%` : 'Interpretar imagen'}
                </Button>

                {form.file_type === 'application/pdf' && (
                  <p className="text-sm text-legal-gray">
                    El PDF queda registrado, pero la interpretación automática está enfocada en imágenes de actas.
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título del documento</Label>
                  <Input id="title" value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
                </div>

                <div>
                  <Label>Tipo de documento</Label>
                  <Select value={form.document_type} onValueChange={(value) => updateForm('document_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventDate">Fecha del acto</Label>
                  <Input id="eventDate" value={form.event_date || ''} onChange={(event) => updateForm('event_date', event.target.value)} placeholder="dd/mm/aaaa" />
                </div>

                <div>
                  <Label htmlFor="eventPlace">Lugar</Label>
                  <Input id="eventPlace" value={form.event_place || ''} onChange={(event) => updateForm('event_place', event.target.value)} />
                </div>

                <div>
                  <Label>Padre declarado (miembro)</Label>
                  <Select
                    value={form.father_member_id || 'none'}
                    onValueChange={(value) => {
                      const memberId = value === 'none' ? '' : value;
                      updateForm('father_member_id', memberId);
                      updateForm('father_name', memberNameById(memberId, membersById));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona padre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin declarar</SelectItem>
                      {membersSortedByName.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Madre declarada (miembro)</Label>
                  <Select
                    value={form.mother_member_id || 'none'}
                    onValueChange={(value) => {
                      const memberId = value === 'none' ? '' : value;
                      updateForm('mother_member_id', memberId);
                      updateForm('mother_name', memberNameById(memberId, membersById));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona madre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin declarar</SelectItem>
                      {membersSortedByName.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cónyuge declarado (miembro)</Label>
                  <Select
                    value={form.spouse_member_id || 'none'}
                    onValueChange={(value) => {
                      const memberId = value === 'none' ? '' : value;
                      updateForm('spouse_member_id', memberId);
                      updateForm('spouse_name', memberNameById(memberId, membersById));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona conyuge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin declarar</SelectItem>
                      {membersSortedByName.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Miembro titular (árbol) *</Label>
                  <Select
                    value={form.related_member_id || 'none'}
                    onValueChange={(value) => {
                      const memberId = value === 'none' ? '' : value;
                      const autoRelatives = memberId ? getAutoLinkedRelatives(memberId) : null;
                      const linkedHeir = heirs.find((heir) => heir.sienna_member_id === memberId);
                      updateForm('related_member_id', memberId);
                      updateForm('primary_member_id', autoRelatives?.primary_member_id || memberId);
                      updateForm('primary_person', autoRelatives?.primary_person || memberNameById(memberId, membersById));
                      updateForm('father_member_id', autoRelatives?.father_member_id || '');
                      updateForm('father_name', autoRelatives?.father_name || '');
                      updateForm('mother_member_id', autoRelatives?.mother_member_id || '');
                      updateForm('mother_name', autoRelatives?.mother_name || '');
                      updateForm('spouse_member_id', autoRelatives?.spouse_member_id || '');
                      updateForm('spouse_name', autoRelatives?.spouse_name || '');
                      if (linkedHeir?.heir_name) {
                        updateForm('related_heir_name', linkedHeir.heir_name);
                      } else {
                        updateForm('related_heir_name', '');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccion obligatoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar miembro</SelectItem>
                      {membersSortedByName.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={applyAutoRelativeLinks}
                    disabled={!form.related_member_id}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Recalcular parentescos automáticos
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="confirmsHeir"
                    checked={Boolean(form.confirms_heir)}
                    onCheckedChange={(checked) => updateForm('confirms_heir', Boolean(checked))}
                  />
                  <Label htmlFor="confirmsHeir">Esta acta confirma al heredero seleccionado</Label>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notas de validación</Label>
                  <Textarea id="notes" value={form.notes || ''} onChange={(event) => updateForm('notes', event.target.value)} rows={3} />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="ocr">Texto leído / transcripción</Label>
                  <Textarea
                    id="ocr"
                    value={form.extracted_text || ''}
                    onChange={(event) => updateForm('extracted_text', event.target.value)}
                    rows={6}
                    placeholder="Aquí aparecerá el texto interpretado o puedes transcribirlo manualmente."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-legal-gray">
                Flujo recomendado: seleccionar archivo, clasificar tipo de documento y vincularlo al miembro titular. Los parentescos declarados (padre, madre, conyuge) se eligen desde la tabla de miembros para mantener trazabilidad.
              </p>
              <Button onClick={saveDocument} disabled={saveBusy} className="bg-legal-gold hover:bg-legal-gold/90 text-white">
                <Save className="h-4 w-4 mr-2" />
                Guardar en expediente
              </Button>
            </div>
          </CardContent>
        </Card>

        <details className="rounded-md border border-legal-gold/20 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-legal-blue">
            <span className="inline-flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Presentación de herederos
            </span>
            <span className="text-xs font-normal text-legal-gray">Fotos y montos manuales bajo demanda</span>
          </summary>
          <div className="overflow-x-auto border-t border-legal-blue/10 p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heredero</TableHead>
                  <TableHead>Líneas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actas</TableHead>
                  <TableHead>Foto</TableHead>
                  <TableHead>Monto heredado</TableHead>
                  <TableHead className="text-right">Guardar</TableHead>
                  <TableHead>Resumen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heirsSortedByName.map((heir) => {
                  const draft = heirDrafts[heir.id] || heir;
                  const photo = draft.photo_data || heir.photo_data;
                  return (
                  <TableRow key={heir.id}>
                    <TableCell className="font-medium text-legal-blue min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <MemberPhoto
                          name={heir.heir_name}
                          memberId={heir.sienna_member_id}
                          photoData={photo}
                          size="sm"
                          verificationStatus={heir.status === 'confirmado' ? 'verified' : 'pending'}
                        />
                        {heir.heir_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {heir.line_vincenzo && <Badge variant="outline">Vincenzo/Vicente</Badge>}
                        {heir.line_paolo && <Badge variant="outline">Paolo/Paulino</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={heir.status === 'confirmado' ? 'default' : 'secondary'}>
                        {heir.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evidenceByHeir[String(heir.sienna_member_id || '')] || evidenceByHeir[heir.heir_name] || heir.evidence_count || 0}
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <MemberPhoto
                          name={heir.heir_name}
                          memberId={heir.sienna_member_id}
                          photoData={photo}
                          size="md"
                          verificationStatus={heir.status === 'confirmado' ? 'verified' : 'pending'}
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          className="min-w-[150px]"
                          onChange={(event) => handleHeirPhoto(heir, event.target.files?.[0])}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(draft.inheritance_amount ?? heir.inheritance_amount ?? 0)}
                        onChange={(event) => updateHeirDraft(heir.id, { inheritance_amount: event.target.value })}
                      />
                      <p className="mt-1 text-xs text-legal-gray">{formatMoney(draft.inheritance_amount ?? heir.inheritance_amount)}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => saveHeirPresentation(heir)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </TableCell>
                    <TableCell className="min-w-[280px] text-sm text-gray-700">{heir.relationship_summary}</TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </div>
        </details>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Archive className="h-5 w-5" />
              Registro Documental
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Foto</TableHead>
                  <TableHead>Miembro titular</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Heredero vinculado</TableHead>
                  <TableHead>Soporte</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-legal-gray py-8">
                      Todavía no hay documentos guardados.
                    </TableCell>
                  </TableRow>
                )}
                {documentsSortedByTitle.map((document) => {
                  const primaryMember = document.primary_member_id ? membersById.get(document.primary_member_id) || null : null;
                  const primaryName = primaryMember?.name || document.primary_person || '—';
                  return (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium text-legal-blue">{document.title}</TableCell>
                    <TableCell>{document.document_type}</TableCell>
                    <TableCell>
                      {primaryMember ? (
                        <MemberPhoto
                          name={primaryMember.name}
                          memberId={primaryMember.id}
                          lookup={photoLookup}
                          size="sm"
                          verificationStatus={verificationStatusForMember(primaryMember)}
                        />
                      ) : (
                        <span className="text-legal-gray">—</span>
                      )}
                    </TableCell>
                    <TableCell>{primaryName}</TableCell>
                    <TableCell>{document.event_date || '—'}</TableCell>
                    <TableCell>
                      {document.related_heir_name || '—'}
                      {document.related_member_id && membersById.get(document.related_member_id) && (
                        <p className="text-xs text-legal-gray">Árbol: {membersById.get(document.related_member_id)?.name}</p>
                      )}
                      {document.confirms_heir && <Badge className="ml-2">confirma</Badge>}
                    </TableCell>
                    <TableCell>{document.file_name || 'Transcripción manual'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewerDocumentId(document.id || null)}
                          disabled={!document.file_data && !document.has_file && !document.has_extracted_text && !document.notes}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={Boolean(viewerDocumentId)} onOpenChange={(open) => !open && setViewerDocumentId(null)}>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewerDocument?.title || 'Documento'}</DialogTitle>
            </DialogHeader>
            {!viewerDocument?.file_data ? (
              <p className="text-sm text-legal-gray">Este registro no contiene archivo adjunto para vista previa.</p>
            ) : viewerDocument.file_type?.startsWith('image/') ? (
              <img
                src={viewerDocument.file_data}
                alt={viewerDocument.title || 'Documento'}
                className="max-h-[70vh] w-full rounded border object-contain"
              />
            ) : viewerDocument.file_type === 'application/pdf' ? (
              <iframe
                src={viewerDocument.file_data}
                title={viewerDocument.title || 'Documento PDF'}
                className="h-[70vh] w-full rounded border"
              />
            ) : (
              <div className="space-y-3 rounded border bg-muted/30 p-3">
                <p className="text-sm font-medium text-legal-blue">Vista resumida del documento</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {(viewerDocument.extracted_text || viewerDocument.notes || 'Sin texto disponible para vista previa.').slice(0, 3000)}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {selectedHeir && (
          <Card className="border border-legal-gold/20 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-serif font-bold text-legal-blue mb-2">
                Heredero seleccionado
              </h3>
              <p className="text-gray-700">{selectedHeir.relationship_summary}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentosProbatorios;
