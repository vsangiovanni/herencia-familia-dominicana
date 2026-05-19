import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import { api, SiennaFamilyMember } from '@/lib/api';
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
import { Edit, Save, Trash2, UserPlus, Users } from 'lucide-react';

type MemberForm = {
  id: string;
  parent_id: string;
  relationship_to_parent: 'hijo' | 'hija' | 'conyuge' | 'padre' | 'madre' | 'otro';
  name: string;
  birth: string;
  death: string;
  spouse: string;
  spouse_birth: string;
  inheritance_status: 'posible_heredero' | 'no_hereda' | 'requiere_revision' | 'confirmado';
  inheritance_reason: string;
  is_highlighted_ancestor: boolean;
  sort_order: string;
};

const emptyForm: MemberForm = {
  id: '',
  parent_id: 'root',
  relationship_to_parent: 'hijo',
  name: '',
  birth: '',
  death: '',
  spouse: '',
  spouse_birth: '',
  inheritance_status: 'requiere_revision',
  inheritance_reason: '',
  is_highlighted_ancestor: false,
  sort_order: '0',
};

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const makeId = (name: string) =>
  `${normalizeName(name)
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'miembro'}-${Date.now()}`;

const activeLineNames = [
  'Vincenzo (Vicente) Sangiovanni',
  'Paolo (Paulino) Sangiovanni',
  'María Rosa Sangiovanni Pérez',
  'Domingo Ramón Sangiovanni Pérez',
  'Pedro Pablo Sangiovanni Simo',
];

const caseCausanteName = 'Alessandro de Paola Sangiovanni';

const determinedHeirs = new Map([
  [normalizeName('Víctor Manuel Martín Sangiovanni Rodríguez'), 'Heredero determinado por doble vocación sucesoral: línea Vincenzo/Vicente vía María Rosa y línea Paolo/Paulino vía Pedro Pablo.'],
  [normalizeName('Perla Rosa Brea Sangiovanni'), 'Heredera determinada por representación en la rama de Rosa Julia, con doble línea familiar Vincenzo/Vicente y Paolo/Paulino.'],
  [normalizeName('Bernardo Martín Lizardo Sangiovanni'), 'Heredero determinado por la rama Domingo Ramón -> María Amparo dentro de la línea Vincenzo/Vicente.'],
  [normalizeName('Jocelyn del Jesús Sangiovanni Báez'), 'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.'],
  [normalizeName('Mayra Josefina Sangiovanni Báez'), 'Heredera determinada por la rama Domingo Ramón -> José Vicente dentro de la línea Vincenzo/Vicente.'],
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

const getAncestorChain = (members: SiennaFamilyMember[], parentId: string) => {
  const byId = new Map(members.map((member) => [member.id, member]));
  const chain: SiennaFamilyMember[] = [];
  let current = byId.get(parentId);
  const seen = new Set<string>();

  while (current && !seen.has(current.id)) {
    chain.push(current);
    seen.add(current.id);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }

  return chain;
};

const determineInheritance = (form: MemberForm, members: SiennaFamilyMember[]) => {
  if (form.inheritance_status === 'confirmado') {
    return {
      inheritance_status: form.inheritance_status,
      inheritance_reason: form.inheritance_reason || 'Confirmado manualmente en la administración del árbol.',
    };
  }

  if (form.parent_id === 'root') {
    return {
      inheritance_status: 'requiere_revision' as const,
      inheritance_reason: form.inheritance_reason || 'Está entrando como raíz del árbol; requiere revisión manual para determinar vocación sucesoral.',
    };
  }

  const chain = getAncestorChain(members, form.parent_id);
  const chainNames = chain.map((member) => normalizeName(member.name));
  const newName = normalizeName(form.name);
  const inActiveLine = activeLineNames.some((name) => chainNames.includes(normalizeName(name)));
  const parent = members.find((member) => member.id === form.parent_id);
  const parentIsDeterminedHeir = parent ? determinedHeirs.has(normalizeName(parent.name)) : false;
  const parentIsCausante = parent ? normalizeName(parent.name) === normalizeName(caseCausanteName) : false;
  const parentIsDeceased = Boolean(parent?.death);

  if (newName === normalizeName(caseCausanteName)) {
    return { inheritance_status: 'no_hereda' as const, inheritance_reason: 'Es el causante del expediente; no se clasifica como heredero.' };
  }

  if (determinedHeirs.has(newName)) {
    return { inheritance_status: 'posible_heredero' as const, inheritance_reason: determinedHeirs.get(newName) || '' };
  }

  if (knownIntermediates.has(newName)) {
    return { inheritance_status: 'no_hereda' as const, inheritance_reason: knownIntermediates.get(newName) || '' };
  }

  if (form.relationship_to_parent === 'hijo' || form.relationship_to_parent === 'hija') {
    if (parentIsCausante) {
      return {
        inheritance_status: 'requiere_revision' as const,
        inheritance_reason: 'Sería descendiente directo del causante, lo que contradice el supuesto actual de que Alessandro falleció sin descendencia directa.',
      };
    }

    if (parentIsDeterminedHeir) {
      return {
        inheritance_status: 'no_hereda' as const,
        inheritance_reason: 'Es descendiente de un heredero vivo ya determinado; no desplaza a ese heredero mientras este conserve vocación sucesoral.',
      };
    }

    if (inActiveLine && parentIsDeceased) {
      return {
        inheritance_status: 'posible_heredero' as const,
        inheritance_reason: 'Queda dentro de una rama sucesoral activa y su nodo superior figura fallecido; puede entrar por representación si los documentos confirman la filiación.',
      };
    }
  }

  if (form.relationship_to_parent === 'padre' || form.relationship_to_parent === 'madre') {
    return {
      inheritance_status: 'no_hereda' as const,
      inheritance_reason: 'Fue agregado como ascendiente del nodo seleccionado; no se marca como heredero final en este modelo de descendencia.',
    };
  }

  return {
    inheritance_status: form.inheritance_status,
    inheritance_reason: form.inheritance_reason || 'No hay suficiente información del expediente para clasificarlo automáticamente.',
  };
};

const toForm = (member: SiennaFamilyMember): MemberForm => ({
  id: member.id,
  parent_id: member.parent_id || 'root',
  relationship_to_parent: (member.relationship_to_parent as MemberForm['relationship_to_parent']) || 'hijo',
  name: member.name || '',
  birth: member.birth || '',
  death: member.death || '',
  spouse: member.spouse || '',
  spouse_birth: member.spouse_birth || '',
  inheritance_status: (member.inheritance_status as MemberForm['inheritance_status']) || 'requiere_revision',
  inheritance_reason: member.inheritance_reason || '',
  is_highlighted_ancestor: Boolean(member.is_highlighted_ancestor),
  sort_order: String(member.sort_order || 0),
});

const MiembrosArbolSienna = () => {
  const [members, setMembers] = useState<SiennaFamilyMember[]>([]);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await api.listSiennaFamilyMembers();
      setMembers(response.members);
    } catch (error) {
      toast({
        title: 'No se pudieron cargar los miembros',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const updateForm = (field: keyof MemberForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => setForm(emptyForm);

  const evaluation = useMemo(() => determineInheritance(form, members), [form, members]);

  const saveMember = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Falta el nombre', description: 'El nombre del miembro es obligatorio.' });
      return;
    }

    setSaving(true);
    try {
      await api.saveSiennaFamilyMember({
        id: form.id || makeId(form.name),
        parent_id: form.parent_id === 'root' ? null : form.parent_id,
        relationship_to_parent: form.parent_id === 'root' ? null : form.relationship_to_parent,
        name: form.name.trim(),
        birth: form.birth || null,
        death: form.death || null,
        spouse: form.spouse || null,
        spouse_birth: form.spouse_birth || null,
        inheritance_status: evaluation.inheritance_status,
        inheritance_reason: form.inheritance_reason || evaluation.inheritance_reason,
        is_highlighted_ancestor: form.is_highlighted_ancestor,
        sort_order: Number(form.sort_order || 0),
      });
      resetForm();
      await loadMembers();
      toast({ title: 'Miembro guardado', description: 'La administración del árbol fue actualizada.' });
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
    await api.deleteSiennaFamilyMember(member.id);
    await loadMembers();
    toast({ title: 'Miembro eliminado', description: 'Si tenía descendientes, quedaron como raíz temporal.' });
  };

  const stats = useMemo(() => ({
    total: members.length,
    heirs: members.filter((member) => member.inheritance_status === 'posible_heredero' || member.inheritance_status === 'confirmado').length,
    connectors: members.filter((member) => member.inheritance_status === 'no_hereda').length,
    pending: members.filter((member) => member.inheritance_status === 'requiere_revision').length,
  }), [members]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <BackButton />
      </div>

      <DocumentHeader
        title="Miembros del Árbol Sienna"
        subtitle="Administración de personas, parentescos, estados hereditarios y ramas explicativas"
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Miembros</p><p className="text-2xl font-bold text-legal-blue">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Herederos</p><p className="text-2xl font-bold text-legal-blue">{stats.heirs}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Enlaces</p><p className="text-2xl font-bold text-legal-blue">{stats.connectors}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-legal-gray">Pendientes</p><p className="text-2xl font-bold text-legal-blue">{stats.pending}</p></CardContent></Card>
        </div>

        <Card className="border border-legal-gold/20">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <UserPlus className="h-5 w-5" />
              {form.id ? 'Editar Miembro' : 'Agregar Miembro'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
            </div>
            <div>
              <Label>Nodo superior</Label>
              <Select value={form.parent_id} onValueChange={(value) => updateForm('parent_id', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Raíz del árbol</SelectItem>
                  {members.filter((member) => member.id !== form.id).map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parentesco</Label>
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
            <div>
              <Label>Nacimiento</Label>
              <Input value={form.birth} onChange={(event) => updateForm('birth', event.target.value)} placeholder="dd/mm/aaaa" />
            </div>
            <div>
              <Label>Defunción</Label>
              <Input value={form.death} onChange={(event) => updateForm('death', event.target.value)} placeholder="dd/mm/aaaa" />
            </div>
            <div>
              <Label>Cónyuge</Label>
              <Input value={form.spouse} onChange={(event) => updateForm('spouse', event.target.value)} />
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={form.sort_order} onChange={(event) => updateForm('sort_order', event.target.value)} />
            </div>
            <div>
              <Label>Estado hereditario</Label>
              <Select value={form.inheritance_status} onValueChange={(value) => updateForm('inheritance_status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="requiere_revision">Requiere revisión</SelectItem>
                  <SelectItem value="posible_heredero">Posible heredero</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="no_hereda">No hereda</SelectItem>
                </SelectContent>
              </Select>
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
                value={form.inheritance_reason || evaluation.inheritance_reason || ''}
                onChange={(event) => updateForm('inheritance_reason', event.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-md border border-legal-blue/20 bg-legal-blue/5 p-4 md:col-span-2">
              <p className="text-sm font-semibold text-legal-blue">Evaluación sugerida</p>
              <Badge className="mt-2" variant={evaluation.inheritance_status === 'posible_heredero' ? 'default' : 'secondary'}>
                {evaluation.inheritance_status.replace(/_/g, ' ')}
              </Badge>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{evaluation.inheritance_reason}</p>
            </div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="outline" onClick={resetForm}>Limpiar</Button>
              <Button onClick={saveMember} disabled={saving} className="bg-legal-gold hover:bg-legal-gold/90 text-white">
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-legal-gold/20">
          <CardHeader className="bg-legal-blue/5 border-b">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <Users className="h-5 w-5" />
              Tabla de Miembros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Superior</TableHead>
                  <TableHead>Parentesco</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-legal-gray">Cargando miembros...</TableCell></TableRow>
                )}
                {!loading && members.map((member) => {
                  const parent = members.find((item) => item.id === member.parent_id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium text-legal-blue min-w-[240px]">{member.name}</TableCell>
                      <TableCell>{parent?.name || 'Raíz'}</TableCell>
                      <TableCell>{member.relationship_to_parent || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={member.inheritance_status === 'posible_heredero' || member.inheritance_status === 'confirmado' ? 'default' : 'secondary'}>
                          {(member.inheritance_status || 'requiere_revision').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.birth || '-'} {member.death ? ` / ${member.death}` : ''}</TableCell>
                      <TableCell className="min-w-[280px] text-sm text-gray-700">{member.inheritance_reason || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setForm(toForm(member))}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteMember(member)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
};

export default MiembrosArbolSienna;
