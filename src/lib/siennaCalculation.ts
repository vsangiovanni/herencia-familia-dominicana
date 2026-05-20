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
  version: 1;
  heirs: SiennaHeirCalculationRow[];
  notes?: string | null;
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
  notes?: string | null
): SiennaCalculationSnapshotPayload => ({
  version: 1,
  heirs: buildHeirCalculationRows(plan, distributableAmount),
  notes: notes || null,
});

export const buildMembersHash = (memberIds: string[]) =>
  memberIds
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .join('|');
