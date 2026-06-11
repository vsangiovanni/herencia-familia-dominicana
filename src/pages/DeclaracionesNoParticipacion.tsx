import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Mail, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useHeirDeclarationDocuments, siennaQueryKeys } from '@/hooks/useSiennaData';
import { api, HeirDeclarationDocument, HeirDeclarationRow, HeirDeclarationStatus } from '@/lib/api';

const statuses: Array<{ value: HeirDeclarationStatus; label: string }> = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'generado', label: 'Generado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'firmado', label: 'Firmado' },
  { value: 'recibido', label: 'Recibido' },
  { value: 'anulado', label: 'Anulado' },
];

const statusLabels = new Map(statuses.map((status) => [status.value, status.label]));

const statusClass: Record<HeirDeclarationStatus, string> = {
  pendiente: 'border-slate-200 bg-slate-50 text-slate-700',
  generado: 'border-blue-200 bg-blue-50 text-blue-800',
  entregado: 'border-amber-200 bg-amber-50 text-amber-800',
  firmado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  recibido: 'border-green-200 bg-green-50 text-green-800',
  anulado: 'border-red-200 bg-red-50 text-red-800',
};

const lockedStatuses = new Set<HeirDeclarationStatus>(['firmado', 'recibido']);

const isDocumentLocked = (row: HeirDeclarationRow) => lockedStatuses.has(row.document_status);

const formatDate = (value?: string | null) => {
  if (!value) return 'No generado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatMoney = (amount?: number | null) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(Number(amount || 0));

const formatPercent = (value?: number | null) =>
  new Intl.NumberFormat('es-DO', { maximumFractionDigits: 4 }).format(Number(value || 0)) + '%';

const buildContactMessage = (row: HeirDeclarationRow) =>
  'Hola ' + row.heir_name + ', le comparto el documento de declaracion de no participacion relativo a la sucesion de Alessandro de Paola Sangiovanni.';

const summarizeRelationship = (row: HeirDeclarationRow, mode: 'mobile' | 'desktop' = 'mobile') => {
  if (mode === 'desktop' && row.compact_relationship_desktop) return row.compact_relationship_desktop;
  if (row.compact_relationship) return row.compact_relationship;
  const value = row.relationship_summary;
  const text = String(value || 'Heredero calculado por API').replace(/\s+/g, ' ').trim();
  const normalized = text
    .replace(/^Heredero\(a\)?\s+/i, '')
    .replace(/^heredero\s+/i, '')
    .replace(/\s+segun\s+calculo.*$/i, '')
    .replace(/\s+por\s+representacion.*$/i, ' por representación')
    .trim();
  return normalized.length > 64 ? normalized.slice(0, 61).trimEnd() + '...' : normalized;
};

const safeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const buildPdf = (row: HeirDeclarationRow, document?: HeirDeclarationDocument | null, identityOverride = '') => {
  const code = document?.document_code || row.document_code || 'PENDIENTE';
  const generatedAt = document?.generated_at || row.generated_at || new Date().toISOString();
  const relationship = document?.relationship_snapshot || row.relationship_summary || 'Heredero calculado por la API sucesoral';
  const identity = identityOverride.trim() || document?.identity_document_snapshot || row.identity_document_snapshot || 'No disponible';
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const margin = 58;
  let y = 64;

  pdf.setProperties({
    title: 'Declaracion de No Participacion - ' + row.heir_name,
    subject: 'Sucesión de Alessandro de Paola Sangiovanni',
    author: 'Sucesión de Alessandro de Paola Sangiovanni',
  });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.text('DECLARACION DE NO PARTICIPACION', 306, y, { align: 'center' });
  y += 18;
  pdf.text('Y DECLINACION DE GESTION', 306, y, { align: 'center' });

  y += 38;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.text('Referencia: Sucesión de Alessandro de Paola Sangiovanni', margin, y);
  y += 16;
  pdf.text('Codigo interno: ' + code, margin, y);
  y += 16;
  pdf.text('Fecha de generacion: ' + formatDate(generatedAt), margin, y);

  y += 34;
  pdf.setFont('times', 'bold');
  pdf.text('Datos del declarante', margin, y);
  y += 18;
  pdf.setFont('times', 'normal');
  pdf.text('Nombre completo: ' + row.heir_name, margin, y);
  y += 16;
  pdf.text('Documento de identidad: ' + identity, margin, y);
  y += 16;
  pdf.text('Calidad o relacion: ' + relationship, margin, y);

  y += 34;
  const paragraphs = [
    'Yo, ' + row.heir_name + ', identificado(a) con ' + identity + ', en mi calidad de heredero(a) calculado(a) dentro de la sucesion de Alessandro de Paola Sangiovanni, declaro de manera libre y voluntaria que no deseo participar ni involucrarme en las gestiones, reclamaciones, audiencias, coordinaciones legales o actuaciones relacionadas con dicho proceso sucesoral, ni procurar para mi beneficio patrimonial alguno derivado de este.',
    'Esta declaracion se emite para fines de constancia interna y organizacion documental de la sucesion de Alessandro de Paola Sangiovanni, dejando constancia expresa de la decision del declarante.',
    'Firmo la presente declaracion en la fecha indicada, dejando constancia de mi decision y de que este documento corresponde exclusivamente a la organizacion documental del expediente.'
  ];

  pdf.setFontSize(12);
  paragraphs.forEach((paragraph) => {
    const lines = pdf.splitTextToSize(paragraph, 496);
    pdf.text(lines, margin, y);
    y += lines.length * 15 + 14;
  });

  y += 24;
  pdf.line(margin, y, 260, y);
  pdf.line(352, y, 554, y);
  y += 14;
  pdf.setFontSize(10);
  pdf.text('Firma del declarante', margin, y);
  pdf.text('Documento / Cedula', 352, y);

  y += 58;
  pdf.line(margin, y, 260, y);
  pdf.line(352, y, 554, y);
  y += 14;
  pdf.text('Testigo, si aplica', margin, y);
  pdf.text('Notario / legalizacion, si aplica', 352, y);

  y += 46;
  pdf.setFontSize(9);
  pdf.setTextColor(90);
  pdf.text('Nota: el declarante manifiesta no tener interes en recibir, reclamar o gestionar beneficio economico alguno derivado de esta sucesion.', margin, y);

  return pdf;
};

const downloadPdfAsAttachment = async (pdf: jsPDF, fileName: string) => {
  const dataUri = pdf.output('datauristring');
  const pdfBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
  const response = await fetch('/api/sienna-tree-pdf-downloads', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName, pdf_base64: pdfBase64 }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.url) {
    throw new Error(payload.message || 'No se pudo preparar la descarga del PDF.');
  }
  const link = document.createElement('a');
  link.href = payload.url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const pdfToFile = (pdf: jsPDF, fileName: string) =>
  new File([pdf.output('blob')], fileName, { type: 'application/pdf' });

const documentFromRow = (row: HeirDeclarationRow): HeirDeclarationDocument | null => {
  if (!row.document_id || !row.document_code) return null;
  return {
    id: row.document_id,
    heir_id: row.heir_id,
    member_id: row.member_id || null,
    document_code: row.document_code,
    document_type: row.document_type || 'declaracion_no_participacion',
    status: row.document_status,
    template_version: row.template_version || 'v1',
    heir_name_snapshot: row.heir_name_snapshot || row.heir_name,
    generated_at: row.generated_at || null,
    delivered_at: null,
    signed_at: null,
    received_at: null,
    annulled_at: null,
    identity_document_snapshot: row.identity_document_snapshot || null,
    relationship_snapshot: row.relationship_snapshot || null,
    notes: row.notes || null,
  } as HeirDeclarationDocument;
};

const DeclaracionesNoParticipacion = () => {
  const queryClient = useQueryClient();
  const { canEdit } = useAuth();
  const { data, isFetching, refetch } = useHeirDeclarationDocuments();
  const rows = data?.rows ?? [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | HeirDeclarationStatus>('todos');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [identityDocuments, setIdentityDocuments] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState('');

  const filteredRows = useMemo(() => {
    const normalizedSearch = search
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'todos' || row.document_status === statusFilter;
      if (!normalizedSearch) return matchesStatus;
      const haystack = [row.heir_name, row.member_phone, row.member_email, row.relationship_summary, row.document_code]
        .filter(Boolean)
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return matchesStatus && haystack.includes(normalizedSearch);
    });
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        acc[row.document_status] += 1;
        return acc;
      },
      { total: 0, pendiente: 0, generado: 0, entregado: 0, firmado: 0, recibido: 0, anulado: 0 } as Record<HeirDeclarationStatus | 'total', number>
    );
  }, [rows]);

  const refreshDeclarations = async () => {
    await queryClient.invalidateQueries({ queryKey: siennaQueryKeys.declarationDocuments });
    await refetch();
  };

  const generateDocument = async (row: HeirDeclarationRow) => {
    if (!canEdit) {
      toast({
        title: 'Permiso requerido',
        description: 'Tu usuario puede ver esta pantalla, pero no modificar estados documentales.',
        variant: 'destructive',
      });
      return null;
    }
    setBusyKey('generate-' + row.heir_id);
    try {
      const response = await api.generateHeirDeclarationDocument(row.heir_id, {
        notes: notes[row.heir_id] || null,
        identity_document: identityDocuments[row.heir_id] || row.identity_document_snapshot || null,
      });
      await refreshDeclarations();
      toast({ title: 'Documento generado', description: 'El registro quedó marcado como generado.' });
      return response.document;
    } catch (error) {
      toast({
        title: 'No se pudo generar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      return null;
    } finally {
      setBusyKey('');
    }
  };

  const getDocumentForPdfAction = async (row: HeirDeclarationRow, actionKey: string) => {
    if (isDocumentLocked(row)) {
      const document = documentFromRow(row);
      if (document) return document;
      toast({
        title: 'Documento bloqueado sin registro',
        description: 'El estado está cerrado, pero no existe un código documental para generar el PDF.',
        variant: 'destructive',
      });
      return null;
    }
    setBusyKey(actionKey);
    return generateDocument(row);
  };

  const downloadPdf = async (row: HeirDeclarationRow) => {
    const actionKey = 'download-' + row.heir_id;
    setBusyKey(actionKey);
    try {
      const document = await getDocumentForPdfAction(row, actionKey);
      if (!document) return;
      const pdf = buildPdf(row, document, isDocumentLocked(row) ? '' : identityDocuments[row.heir_id] || '');
      await downloadPdfAsAttachment(pdf, 'declaracion-no-participacion-' + safeFileName(row.heir_name) + '.pdf');
    } catch (error) {
      toast({
        title: 'No se pudo descargar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setBusyKey('');
    }
  };

  const sharePdf = async (row: HeirDeclarationRow, channel: 'whatsapp' | 'email') => {
    const actionKey = 'share-' + channel + '-' + row.heir_id;
    setBusyKey(actionKey);
    const fileName = 'declaracion-no-participacion-' + safeFileName(row.heir_name) + '.pdf';
    try {
      const document = await getDocumentForPdfAction(row, actionKey);
      if (!document) return;
      const pdf = buildPdf(row, document, isDocumentLocked(row) ? '' : identityDocuments[row.heir_id] || '');
      const file = pdfToFile(pdf, fileName);
      const sharePayload = {
        title: 'Declaracion de no participacion',
        text: buildContactMessage(row),
        files: [file],
      };
      if (navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload);
        return;
      }
      await downloadPdfAsAttachment(pdf, fileName);
      toast({
        title: channel === 'whatsapp' ? 'WhatsApp no permite adjuntar desde este navegador' : 'Email no permite adjuntar desde este navegador',
        description: 'Se descargó el PDF para adjuntarlo manualmente sin enviar solo texto.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo compartir',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setBusyKey('');
    }
  };

  const updateStatus = async (row: HeirDeclarationRow, status: HeirDeclarationStatus) => {
    if (isDocumentLocked(row)) {
      toast({
        title: 'Documento cerrado',
        description: 'Un documento firmado o recibido queda bloqueado porque ya representa una declinación oficial.',
        variant: 'destructive',
      });
      return;
    }
    if (!row.document_id) {
      toast({
        title: 'Primero genera el documento',
        description: 'El estado se registra despues de crear un codigo interno.',
        variant: 'destructive',
      });
      return;
    }
    setBusyKey('status-' + row.document_id);
    try {
      await api.updateHeirDeclarationStatus(row.document_id, { status, notes: notes[row.heir_id] || row.notes || null });
      await refreshDeclarations();
      toast({ title: 'Estado actualizado', description: 'El documento quedo en estado ' + (statusLabels.get(status) || status) + '.' });
    } catch (error) {
      toast({
        title: 'No se pudo actualizar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <SiennaPageLayout>
      <BackButton />
      <DocumentHeader
        title="Declaraciones de No Participación"
        subtitle="Documentos individuales para herederos calculados por la API sucesoral que no desean involucrarse en gestiones del proceso"
        helpKey="sienna-declaraciones-no-participacion"
      />

      <div className="space-y-6">
        <Card className="border border-amber-300 bg-amber-50">
          <CardContent className="flex gap-3 p-4 text-sm text-amber-950">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
            <p>
              Pantalla independiente de prueba. No modifica herederos, calculos, porcentajes, distribucion ni base legal.
              La plantilla se mantiene separada del calculo sucesoral y solo documenta la decision del declarante.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-legal-gold/20">
            <CardContent className="p-5">
              <p className="text-sm text-legal-gray">Herederos calculados</p>
              <p className="text-2xl font-bold text-legal-blue">{summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="p-5">
              <p className="text-sm text-legal-gray">Pendientes</p>
              <p className="text-2xl font-bold text-slate-700">{summary.pendiente}</p>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="p-5">
              <p className="text-sm text-legal-gray">Generados</p>
              <p className="text-2xl font-bold text-blue-800">{summary.generado + summary.entregado}</p>
            </CardContent>
          </Card>
          <Card className="border border-legal-gold/20">
            <CardContent className="p-5">
              <p className="text-sm text-legal-gray">Firmados/recibidos</p>
              <p className="text-2xl font-bold text-green-800">{summary.firmado + summary.recibido}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-legal-gold/20">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-legal-blue">Listado documental</CardTitle>
                <p className="mt-1 text-sm text-legal-gray">Solo herederos calculados por la API sucesoral; no miembros generales del árbol ni tabla manual.</p>
              </div>
              <Button variant="outline" onClick={() => refreshDeclarations()} disabled={isFetching}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar heredero</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre, relacion o codigo"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'todos' | HeirDeclarationStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border">
              <Table containerClassName="max-h-[70vh]">
                <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-card [&_th]:shadow-[inset_0_-1px_0_hsl(var(--border))]">
                  <TableRow>
                    <TableHead>Heredero calculado</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Monto API</TableHead>
                    <TableHead>Cédula / identificación</TableHead>
                    <TableHead>Calidad / relación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_td]:align-top">
                  {filteredRows.map((row) => {
                    const locked = isDocumentLocked(row);
                    return (
                    <TableRow key={row.heir_id}>
                      <TableCell className="min-w-[240px] font-medium text-legal-blue">{row.heir_name}</TableCell>
                      <TableCell className="min-w-[220px] text-sm">
                        <div className="space-y-2">
                          <div className="space-y-0.5 text-xs text-legal-gray">
                            <p className="truncate">{row.member_phone || 'Sin teléfono'}</p>
                            <p className="truncate">{row.member_email || 'Sin email'}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {row.member_phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs"
                                onClick={() => sharePdf(row, 'whatsapp')}
                                disabled={busyKey === 'share-whatsapp-' + row.heir_id}
                                title="Genera el PDF y usa el compartir del dispositivo para enviarlo por WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Enviar WA
                              </Button>
                            )}
                            {row.member_email && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs"
                                onClick={() => sharePdf(row, 'email')}
                                disabled={busyKey === 'share-email-' + row.heir_id}
                                title="Genera el PDF y usa el compartir del dispositivo para enviarlo por email"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Enviar email
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="font-semibold text-legal-blue">{formatMoney(row.amount)}</div>
                        <div className="text-xs text-legal-gray">{formatPercent(row.share_percent)}</div>
                      </TableCell>
                      <TableCell className="min-w-[190px]">
                        <Input
                          value={identityDocuments[row.heir_id] ?? row.identity_document_snapshot ?? ''}
                          onChange={(event) =>
                            setIdentityDocuments((current) => ({ ...current, [row.heir_id]: event.target.value }))
                          }
                          placeholder="Cédula o pasaporte"
                          disabled={!canEdit || locked}
                        />
                      </TableCell>
                      <TableCell
                        className="max-w-[150px] text-sm text-legal-gray sm:max-w-[220px]"
                        title={row.relationship_summary || 'Heredero calculado por API'}
                      >
                        <span className="block truncate sm:hidden">{summarizeRelationship(row, 'mobile')}</span>
                        <span className="hidden truncate sm:block">{summarizeRelationship(row, 'desktop')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge variant="outline" className={statusClass[row.document_status]}>
                            {statusLabels.get(row.document_status) || row.document_status}
                          </Badge>
                          {locked && <p className="text-xs font-medium text-green-700">Bloqueado oficialmente</p>}
                          <Select
                            value={row.document_status}
                            onValueChange={(value) => updateStatus(row, value as HeirDeclarationStatus)}
                            disabled={!canEdit || locked || !row.document_id || busyKey === 'status-' + row.document_id}
                          >
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px] text-sm">{row.document_code || 'Sin generar'}</TableCell>
                      <TableCell className="min-w-[150px] text-sm text-legal-gray">{formatDate(row.generated_at)}</TableCell>
                      <TableCell className="min-w-[220px]">
                        <Textarea
                          value={notes[row.heir_id] ?? row.notes ?? ''}
                          onChange={(event) => setNotes((current) => ({ ...current, [row.heir_id]: event.target.value }))}
                          placeholder="Nota interna opcional"
                          className="min-h-[72px]"
                          disabled={!canEdit || locked}
                        />
                      </TableCell>
                      <TableCell className="min-w-[170px]">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPdf(row)}
                            disabled={busyKey === 'download-' + row.heir_id}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {!filteredRows.length && (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center text-sm text-legal-gray">
                        No hay herederos calculados por la API que coincidan con el filtro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiennaPageLayout>
  );
};

export default DeclaracionesNoParticipacion;
