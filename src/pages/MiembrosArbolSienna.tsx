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
import { classifyMemberByDominicanLaw, normalizeName } from '@/lib/dominicanInheritance';
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

const makeId = (name: string) =>
  `${normalizeName(name)
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'miembro'}-${Date.now()}`;

const determineInheritance = (form: MemberForm, members: SiennaFamilyMember[]) => {
  if (form.inheritance_status === 'confirmado') {
    return {
      inheritance_status: form.inheritance_status,
      inheritance_reason: form.inheritance_reason || 'Confirmado manualmente en la administración del árbol.',
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
    spouse: form.spouse || null,
    spouse_birth: form.spouse_birth || null,
    inheritance_status: form.inheritance_status,
    inheritance_reason: form.inheritance_reason || null,
    is_highlighted_ancestor: form.is_highlighted_ancestor,
    sort_order: Number(form.sort_order || 0),
  };
  const draftMembers = members.some((member) => member.id === memberId)
    ? members.map((member) => (member.id === memberId ? draftMember : member))
    : [...members, draftMember];

  return classifyMemberByDominicanLaw(draftMember, draftMembers);
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

const formatAuditDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';

const auditName = (name?: string | null, email?: string | null) => name || email || '-';

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
                  <TableHead>Auditoría</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-legal-gray">Cargando miembros...</TableCell></TableRow>
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
                      <TableCell className="min-w-[220px] text-xs text-legal-gray">
                        <p><span className="font-semibold">Creado:</span> {auditName(member.created_by_name, member.created_by_email)}</p>
                        <p>{formatAuditDate(member.created_at)}</p>
                        <p className="mt-1"><span className="font-semibold">Modificado:</span> {auditName(member.updated_by_name, member.updated_by_email)}</p>
                        <p>{formatAuditDate(member.updated_at)}</p>
                      </TableCell>
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
