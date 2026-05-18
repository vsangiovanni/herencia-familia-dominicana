import React, { useEffect, useMemo, useState } from 'react';
import Tesseract from 'tesseract.js';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { api, ConfirmedHeir, EvidenceDocument } from '@/lib/api';
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
import { Archive, FileImage, FileSearch, Save, Trash2, UserCheck } from 'lucide-react';

type DocumentForm = Omit<EvidenceDocument, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: DocumentForm = {
  title: '',
  document_type: 'Acta no clasificada',
  primary_person: '',
  event_date: '',
  event_place: '',
  father_name: '',
  mother_name: '',
  spouse_name: '',
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
];

const knownPeople = [
  'Víctor Manuel Martín Sangiovanni Rodríguez',
  'Perla Rosa Brea Sangiovanni',
  'Bernardo Martín Lizardo Sangiovanni',
  'Jocelyn del Jesús Sangiovanni Báez',
  'Mayra Josefina Sangiovanni Báez',
  'Vincenzo Sangiovanni',
  'Vicente Sangiovanni',
  'Paolo Sangiovanni',
  'Paulino Sangiovanni',
  'María Rosa Sangiovanni Pérez',
  'Pedro Pablo Sangiovanni Simo',
  'Domingo Ramón Sangiovanni Pérez',
  'Domenico Sangiovanni',
  'Domingo Sangiovanni',
  'María Rosa Grisolia',
];

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

const parseDocument = (text: string): Partial<DocumentForm> => {
  const normalized = normalizeText(text);
  const detectedPeople = knownPeople.filter((person) => normalized.includes(normalizeText(person)));
  const documentType = detectDocumentType(text);
  const date = firstMatch(text, [
    /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/,
    /(?:fecha|date|data)[^\d]{0,20}(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const parsePeopleList = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const DocumentosProbatorios = () => {
  const [form, setForm] = useState<DocumentForm>(emptyForm);
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [heirs, setHeirs] = useState<ConfirmedHeir[]>([]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const selectedHeir = useMemo(
    () => heirs.find((heir) => heir.heir_name === form.related_heir_name),
    [heirs, form.related_heir_name]
  );

  const loadData = async () => {
    const [documentsResponse, heirsResponse] = await Promise.all([
      api.listEvidenceDocuments(),
      api.listConfirmedHeirs(),
    ]);
    setDocuments(documentsResponse.documents);
    setHeirs(heirsResponse.heirs);
  };

  useEffect(() => {
    loadData().catch((error) => {
      toast({
        title: 'No se pudo cargar el expediente',
        description: error.message,
        variant: 'destructive',
      });
    });
  }, []);

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
      const parsed = parseDocument(result.data.text);
      setForm((current) => ({
        ...current,
        ...parsed,
        file_data: current.file_data,
        file_name: current.file_name,
        file_type: current.file_type,
        notes: current.notes,
        related_heir_name: current.related_heir_name,
        confirms_heir: current.confirms_heir,
      }));
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
    if (!form.title || !form.document_type) {
      toast({ title: 'Faltan datos', description: 'El título y el tipo de documento son obligatorios.' });
      return;
    }

    setSaveBusy(true);
    try {
      await api.saveEvidenceDocument({
        ...form,
        people_involved: parsePeopleList(form.people_involved),
      });
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

  const deleteDocument = async (id?: string) => {
    if (!id) return;
    await api.deleteEvidenceDocument(id);
    await loadData();
  };

  const evidenceByHeir = useMemo(() => {
    return documents.reduce<Record<string, number>>((acc, document) => {
      if (!document.related_heir_name) return acc;
      acc[document.related_heir_name] = (acc[document.related_heir_name] || 0) + 1;
      return acc;
    }, {});
  }, [documents]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>

      <DocumentHeader
        title="Documentos Probatorios"
        subtitle="Registro de actas, personas documentadas y herederos confirmados para sustentar el cálculo"
      />

      <div className="max-w-7xl mx-auto space-y-6">
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
                  <Label htmlFor="primaryPerson">Persona principal</Label>
                  <Input id="primaryPerson" value={form.primary_person || ''} onChange={(event) => updateForm('primary_person', event.target.value)} />
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
                  <Label htmlFor="father">Padre declarado</Label>
                  <Input id="father" value={form.father_name || ''} onChange={(event) => updateForm('father_name', event.target.value)} />
                </div>

                <div>
                  <Label htmlFor="mother">Madre declarada</Label>
                  <Input id="mother" value={form.mother_name || ''} onChange={(event) => updateForm('mother_name', event.target.value)} />
                </div>

                <div>
                  <Label htmlFor="spouse">Cónyuge declarado</Label>
                  <Input id="spouse" value={form.spouse_name || ''} onChange={(event) => updateForm('spouse_name', event.target.value)} />
                </div>

                <div>
                  <Label>Heredero relacionado</Label>
                  <Select
                    value={form.related_heir_name || 'none'}
                    onValueChange={(value) => updateForm('related_heir_name', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin heredero directo</SelectItem>
                      {heirs.map((heir) => (
                        <SelectItem key={heir.id} value={heir.heir_name}>{heir.heir_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="people">Personas involucradas</Label>
                  <Input
                    id="people"
                    value={parsePeopleList(form.people_involved).join(', ')}
                    onChange={(event) => updateForm('people_involved', parsePeopleList(event.target.value))}
                    placeholder="Separadas por coma"
                  />
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
                Los herederos ya mencionados pueden usarse en el cálculo sin acta cargada; las actas agregan soporte documental y cambian su estado a confirmado cuando lo marques.
              </p>
              <Button onClick={saveDocument} disabled={saveBusy} className="bg-legal-gold hover:bg-legal-gold/90 text-white">
                <Save className="h-4 w-4 mr-2" />
                Guardar en expediente
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <UserCheck className="h-5 w-5" />
              Herederos para el Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heredero</TableHead>
                  <TableHead>Líneas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actas</TableHead>
                  <TableHead>Resumen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heirs.map((heir) => (
                  <TableRow key={heir.id}>
                    <TableCell className="font-medium text-legal-blue">{heir.heir_name}</TableCell>
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
                    <TableCell>{evidenceByHeir[heir.heir_name] || heir.evidence_count || 0}</TableCell>
                    <TableCell className="min-w-[280px] text-sm text-gray-700">{heir.relationship_summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                  <TableHead>Persona</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Heredero vinculado</TableHead>
                  <TableHead>Soporte</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-legal-gray py-8">
                      Todavía no hay documentos guardados.
                    </TableCell>
                  </TableRow>
                )}
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium text-legal-blue">{document.title}</TableCell>
                    <TableCell>{document.document_type}</TableCell>
                    <TableCell>{document.primary_person || '—'}</TableCell>
                    <TableCell>{document.event_date || '—'}</TableCell>
                    <TableCell>
                      {document.related_heir_name || '—'}
                      {document.confirms_heir && <Badge className="ml-2">confirma</Badge>}
                    </TableCell>
                    <TableCell>{document.file_name || 'Transcripción manual'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument(document.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
