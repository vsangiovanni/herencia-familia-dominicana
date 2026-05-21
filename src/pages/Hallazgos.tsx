import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SoftLoadingIndicator from '@/components/SoftLoadingIndicator';
import { IssueDraft, MemberIssueFixPanel } from '@/components/sienna/MemberIssueFixPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { api } from '@/lib/api';
import { buildDominicanInheritancePlan } from '@/lib/dominicanInheritance';
import { buildMemberSavePayload } from '@/lib/siennaFindings';
import {
  buildMemberIssueRows,
  kindLabels,
  MemberIssueKind,
  MemberIssueRow,
} from '@/lib/siennaMemberIssues';
import { CheckCircle2, ClipboardList, RefreshCw, Scale, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const kindBadgeClass: Record<MemberIssueKind, string> = {
  sync_parent_link: 'bg-legal-gold/15 text-legal-blue border-legal-gold/35',
  complete_filiation: 'bg-legal-gold/15 text-legal-blue border-legal-gold/35',
  dead_branch: 'bg-amber-50 text-amber-900 border-amber-200',
};

const Hallazgos = () => {
  const [members, setMembers] = useState<Awaited<ReturnType<typeof api.listSiennaFamilyMembers>>['members']>([]);
  const [unions, setUnions] = useState<Awaited<ReturnType<typeof api.listSiennaFamilyMembers>>['unions']>([]);
  const [parentLinks, setParentLinks] = useState<
    Awaited<ReturnType<typeof api.listSiennaFamilyMembers>>['parent_links']
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Analizando miembros...');
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<MemberIssueKind | 'all'>('all');
  const [drafts, setDrafts] = useState<Record<string, IssueDraft>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadingMessage('Consultando árbol, uniones y vínculos...');
    try {
      const response = await api.listSiennaFamilyMembers();
      setMembers(response.members);
      setUnions(response.unions);
      setParentLinks(response.parent_links);
    } catch (error) {
      toast({
        title: 'No se pudo cargar la revisión',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const distributedPercent = useMemo(() => {
    const plan = buildDominicanInheritancePlan(members, { unions, parent_links: parentLinks });
    return plan.activeHeirs.reduce((sum, share) => sum + share.share, 0);
  }, [members, parentLinks, unions]);

  const { rows, summary } = useMemo(
    () => buildMemberIssueRows(members, unions, parentLinks, distributedPercent),
    [distributedPercent, members, parentLinks, unions]
  );

  useEffect(() => {
    const next: Record<string, IssueDraft> = {};
    rows.forEach((row) => {
      next[row.id] = {
        spouseMemberId: row.defaults.spouseMemberId,
        filiationUnionId: row.defaults.filiationUnionId,
        secondParentId: row.defaults.secondParentId,
      };
    });
    setDrafts(next);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (kindFilter !== 'all' && row.kind !== kindFilter) return false;
      if (!query) return true;
      return (
        row.memberName.toLowerCase().includes(query) ||
        row.problem.toLowerCase().includes(query) ||
        (row.context || '').toLowerCase().includes(query)
      );
    });
  }, [kindFilter, rows, search]);

  const completionPercent = members.length
    ? Math.round(((members.length - summary.membersAffected) / members.length) * 100)
    : 100;

  const updateDraft = (rowId: string, patch: Partial<IssueDraft>) => {
    setDrafts((current) => ({
      ...current,
      [rowId]: { ...current[rowId], ...patch },
    }));
  };

  const saveRow = async (row: MemberIssueRow) => {
    const member = members.find((item) => item.id === row.memberId);
    const draft = drafts[row.id];
    if (!member || !draft) return;

    setSavingRowId(row.id);
    try {
      if (row.kind === 'sync_parent_link' || row.kind === 'complete_filiation') {
        await api.saveSiennaFamilyMember(
          buildMemberSavePayload(member, members, unions, {
            filiation: {
              union_id: draft.filiationUnionId || null,
              second_parent_id: draft.secondParentId || null,
            },
          })
        );
        toast({ title: 'Filiación guardada', description: `${member.name} sincronizado en base de datos.` });
      }

      await loadData();
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSavingRowId(null);
    }
  };

  const renderRow = (row: MemberIssueRow) => {
    const draft = drafts[row.id] || row.defaults;

    return (
      <TableRow key={row.id} className="align-top">
        <TableCell className="min-w-[11rem]">
          <p className="font-semibold text-legal-blue">{row.memberName}</p>
          <Badge variant="outline" className={`mt-1 text-[10px] ${kindBadgeClass[row.kind]}`}>
            {kindLabels[row.kind]}
          </Badge>
          {row.context && <p className="mt-1 text-xs text-legal-gray">{row.context}</p>}
        </TableCell>
        <TableCell className="min-w-[14rem]">
          <p className="text-sm text-gray-900">{row.problem}</p>
          <p className="mt-1 text-xs leading-relaxed text-legal-gray">{row.solution}</p>
        </TableCell>
        <TableCell className="min-w-[15rem]">
          <MemberIssueFixPanel
            row={row}
            draft={draft}
            members={members}
            unions={unions}
            saving={savingRowId === row.id}
            onDraftChange={(patch) => updateDraft(row.id, patch)}
            onSave={() => saveRow(row)}
          />
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={
              row.severity === 'Alta prioridad' ? 'border-red-200 text-red-700' : 'border-amber-200 text-amber-800'
            }
          >
            {row.severity === 'Alta prioridad' ? 'Alta' : 'Media'}
          </Badge>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="app-shell py-8">
      <BackButton />

      <DocumentHeader
        title="Corrección por miembro"
        subtitle="Revise cada caso, aplique la solución en la misma fila y avance hasta dejar el árbol consistente"
        helpKey="hallazgos"
      />
      <SoftLoadingIndicator active={loading} message={loadingMessage} />

      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border border-legal-gold/20 shadow-md">
          <CardHeader className="border-b bg-legal-blue/5">
            <CardTitle className="flex items-center gap-2 text-legal-blue">
              <ClipboardList className="h-5 w-5" />
              Progreso de corrección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {rows.length === 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="font-semibold text-emerald-900">Árbol consistente</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    No hay pendientes de cónyuge, filiación ni ramas cortadas detectados. Cálculo distribuido:{' '}
                    {summary.distributedPercent.toFixed(2)}%.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-legal-gold/30 bg-legal-beige/40 p-4">
                    <p className="text-xs uppercase text-legal-gray">Casos pendientes</p>
                    <p className="text-2xl font-bold text-legal-blue">{summary.totalIssues}</p>
                  </div>
                  <div className="rounded-lg border border-legal-blue/20 bg-legal-blue/5 p-4">
                    <p className="text-xs uppercase text-legal-gray">Miembros afectados</p>
                    <p className="text-2xl font-bold text-legal-blue">{summary.membersAffected}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                    <p className="text-xs uppercase text-legal-gray">Cuota sin asignar</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {summary.undistributedPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-legal-gold/30 p-4">
                    <p className="text-xs uppercase text-legal-gray">Vínculo / matrimonio / rama</p>
                    <p className="text-sm font-medium text-legal-blue">
                      {summary.byKind.sync_parent_link} / {summary.byKind.complete_filiation} / {summary.byKind.dead_branch}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-legal-gray">
                    <span>Miembros sin pendientes detectados</span>
                    <span>{completionPercent}%</span>
                  </div>
                  <Progress value={completionPercent} className="h-2" />
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to="/calculo-filiacion" className="gap-2">
                  <Scale className="h-4 w-4" />
                  Ver cálculo por filiación
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {rows.length > 0 && (
          <Card className="border border-legal-gold/20 shadow-md">
            <CardHeader className="border-b bg-legal-blue/5">
              <CardTitle className="text-legal-blue">Tabla de corrección — caso por caso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-legal-gray" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por miembro o problema..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as MemberIssueKind | 'all')}>
                  <SelectTrigger className="w-full sm:w-[14rem]">
                    <SelectValue placeholder="Tipo de problema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {(Object.keys(kindLabels) as MemberIssueKind[]).map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {kindLabels[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Problema y solución</TableHead>
                      <TableHead>Corregir aquí</TableHead>
                      <TableHead>Prioridad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{filteredRows.map((row) => renderRow(row))}</TableBody>
                </Table>
              </div>

              <div className="space-y-4 md:hidden">
                {filteredRows.map((row) => {
                  const draft = drafts[row.id] || row.defaults;
                  return (
                    <div key={row.id} className="rounded-lg border border-legal-gold/25 bg-white p-4">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-legal-blue">{row.memberName}</p>
                          <Badge variant="outline" className={`mt-1 text-[10px] ${kindBadgeClass[row.kind]}`}>
                            {kindLabels[row.kind]}
                          </Badge>
                        </div>
                        <Badge variant="outline">{row.severity === 'Alta prioridad' ? 'Alta' : 'Media'}</Badge>
                      </div>
                      {row.context && <p className="mb-2 text-xs text-legal-gray">{row.context}</p>}
                      <p className="text-sm text-gray-900">{row.problem}</p>
                      <p className="mt-1 text-xs text-legal-gray">{row.solution}</p>
                      <div className="mt-3 border-t border-legal-gold/15 pt-3">
                        <MemberIssueFixPanel
                          row={row}
                          draft={draft}
                          members={members}
                          unions={unions}
                          saving={savingRowId === row.id}
                          onDraftChange={(patch) => updateDraft(row.id, patch)}
                          onSave={() => saveRow(row)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRows.length === 0 && rows.length > 0 && (
                <p className="text-center text-sm text-legal-gray">Ningún caso coincide con el filtro.</p>
              )}
            </CardContent>
          </Card>
        )}

        {summary.undistributedPercent > 0.05 && (
          <Card className="border border-amber-200 bg-amber-50/50">
            <CardContent className="p-4 text-sm text-amber-950">
              <strong>Nota sobre el cálculo:</strong> aún hay {summary.undistributedPercent.toFixed(2)}% del caudal
              simulado sin heredero vivo. Corrija ramas cortadas y vínculos faltantes arriba; luego verifique en{' '}
              <Link to="/calculo-filiacion" className="font-medium underline">
                Cálculo por filiación
              </Link>
              .
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Hallazgos;
