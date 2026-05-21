import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import {
  buildSecondParentOptions,
  MemberIssueRow,
} from '@/lib/siennaMemberIssues';
import { FamilyUnion, SiennaFamilyMember } from '@/lib/api';

export type IssueDraft = {
  spouseMemberId: string;
  filiationUnionId: string;
  secondParentId: string;
};

type Props = {
  row: MemberIssueRow;
  draft: IssueDraft;
  members: SiennaFamilyMember[];
  unions: FamilyUnion[];
  saving: boolean;
  onDraftChange: (patch: Partial<IssueDraft>) => void;
  onSave: () => void;
};

export const MemberIssueFixPanel = ({
  row,
  draft,
  members,
  unions,
  saving,
  onDraftChange,
  onSave,
}: Props) => {
  const child = members.find((member) => member.id === row.memberId);
  const parentId = child?.parent_id || '';
  const secondParentOptions =
    row.kind === 'dead_branch'
      ? row.secondParentOptions
      : buildSecondParentOptions(parentId, draft.filiationUnionId || null, members, unions);

  const canSaveFiliation =
    (row.kind === 'sync_parent_link' || row.kind === 'complete_filiation') && Boolean(parentId);

  if (row.kind === 'sync_parent_link' || row.kind === 'complete_filiation') {
    return (
      <div className="space-y-2">
        <Select
          value={draft.filiationUnionId || '__none__'}
          onValueChange={(value) => {
            const unionId = value === '__none__' ? '' : value;
            const nextSecond = buildSecondParentOptions(parentId, unionId || null, members, unions);
            onDraftChange({
              filiationUnionId: unionId,
              secondParentId: nextSecond[0]?.id || '',
            });
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Unión / matrimonio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin unión (otra relación)</SelectItem>
            {row.unionOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={draft.secondParentId || '__none__'}
          onValueChange={(value) =>
            onDraftChange({ secondParentId: value === '__none__' ? '' : value })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Segundo progenitor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Opcional —</SelectItem>
            {secondParentOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          className="w-full gap-2 sm:w-auto"
          disabled={!canSaveFiliation || saving}
          onClick={onSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar filiación
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="sm" variant="outline" className="gap-2" asChild>
      <Link to={`/sienna/miembros-arbol?edit=${encodeURIComponent(row.memberId)}`}>
        <ExternalLink className="h-4 w-4" />
        Abrir ficha en Miembros
      </Link>
    </Button>
  );
};
