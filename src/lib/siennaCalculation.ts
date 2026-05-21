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

export type EstateAmountBreakdown = {
  grossAmount: number;
  lawyerFeePercentage: number;
  lawyerFeeAmount: number;
  distributableAmount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Bruto − honorarios de abogados (% sobre bruto) = neto repartible. Usado en árbol y explicación. */
export const resolveEstateAmounts = (
  grossInput: number | string | null | undefined,
  lawyerFeeInput: number | string | null | undefined
): EstateAmountBreakdown => {
  const grossAmount = Math.max(0, Number(grossInput || 0));
  const lawyerFeePercentage = Math.min(100, Math.max(0, Number(lawyerFeeInput || 0)));
  const lawyerFeeAmount = grossAmount > 0 ? roundMoney(grossAmount * (lawyerFeePercentage / 100)) : 0;
  const distributableAmount = grossAmount > 0 ? roundMoney(Math.max(0, grossAmount - lawyerFeeAmount)) : 0;

  return {
    grossAmount,
    lawyerFeePercentage,
    lawyerFeeAmount,
    distributableAmount,
  };
};

export const calculateHeirAmount = (sharePercent: number, distributableAmount: number) =>
  roundMoney(distributableAmount * (sharePercent / 100));

/** Reparto proporcional al caudal; solo renormaliza si hay herederos excluidos en la simulación. */
export const resolveHeirSimulatedShare = (
  rawShare: number,
  options: {
    excluded: boolean;
    excludedHeirIds: string[];
    includedTotal: number;
  }
): number => {
  if (options.excluded) return 0;
  if (options.excludedHeirIds.length > 0 && options.includedTotal > 0) {
    return (rawShare / options.includedTotal) * 100;
  }
  return rawShare;
};

export const buildHeirCalculationRows = (
  plan: InheritancePlan,
  distributableAmount: number
): SiennaHeirCalculationRow[] =>
  plan.activeHeirs.map((share: InheritanceShare) => ({
    member_id: share.member.id,
    heir_name: share.member.name,
    share_percent: share.share,
    amount: calculateHeirAmount(share.share, distributableAmount),
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
