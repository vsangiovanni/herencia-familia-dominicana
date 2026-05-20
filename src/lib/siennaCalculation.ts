import { InheritancePlan, InheritanceShare } from '@/lib/dominicanInheritance';

export type SiennaHeirCalculationRow = {
  member_id: string;
  heir_name: string;
  share_percent: number;
  amount: number;
  route: string;
  payment_basis: string;
  reason: string;
  sources: string[];
};

export type SiennaCalculationSnapshotPayload = {
  version: 2;
  heirs: SiennaHeirCalculationRow[];
  notes?: string | null;
  excluded_heir_ids?: string[];
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const buildHeirCalculationRows = (
  plan: InheritancePlan,
  distributableAmount: number
): SiennaHeirCalculationRow[] =>
  plan.activeHeirs.map((share: InheritanceShare) => ({
    member_id: share.member.id,
    heir_name: share.member.name,
    share_percent: share.share,
    amount: roundMoney(distributableAmount * (share.share / 100)),
    route: share.route,
    payment_basis: share.paymentBasis,
    reason: share.reason,
    sources: share.sources,
  }));

export const buildCalculationPayload = (
  plan: InheritancePlan,
  distributableAmount: number,
  notes?: string | null,
  excludedHeirIds: string[] = []
): SiennaCalculationSnapshotPayload => ({
  version: 2,
  heirs: buildHeirCalculationRows(plan, distributableAmount),
  notes: notes || null,
  excluded_heir_ids: excludedHeirIds,
});

export const buildMembersHash = (memberIds: string[]) =>
  memberIds
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .join('|');

export const parseCalculationPayload = (payloadJson?: string | null): SiennaCalculationSnapshotPayload | null => {
  if (!payloadJson) return null;
  try {
    const parsed = JSON.parse(payloadJson);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.heirs)) return null;

    const excludedHeirs = Array.isArray(parsed.excluded_heir_ids)
      ? parsed.excluded_heir_ids.filter((id: unknown): id is string => typeof id === 'string')
      : [];

    return {
      version: 2,
      heirs: parsed.heirs as SiennaHeirCalculationRow[],
      notes: typeof parsed.notes === 'string' ? parsed.notes : null,
      excluded_heir_ids: excludedHeirs,
    };
  } catch {
    return null;
  }
};
