import { InheritancePlan, InheritanceShare } from '@/lib/dominicanInheritance';
import type { SiennaFamilyMember, SiennaRealtimeCalculationRow } from '@/lib/api';

export type EstateAmountBreakdown = {
  grossAmount: number;
  managementFeePercentage: number;
  managementFeeAmount: number;
  amountAfterManagement: number;
  lawyerFeePercentage: number;
  lawyerFeeAmount: number;
  distributableAmount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateHeirAmount = (sharePercent: number | string | null | undefined, distributableAmount: number) =>
  roundMoney(Math.max(0, Number(distributableAmount || 0)) * (Math.max(0, Number(sharePercent || 0)) / 100));

/** Bruto − gestión; luego saldo − honorarios de abogados = neto repartible. */
export const resolveEstateAmounts = (
  grossInput: number | string | null | undefined,
  managementFeeInput: number | string | null | undefined,
  lawyerFeeInput: number | string | null | undefined
): EstateAmountBreakdown => {
  const grossAmount = Math.max(0, Number(grossInput || 0));
  const managementFeePercentage = Math.min(100, Math.max(0, Number(managementFeeInput || 0)));
  const lawyerFeePercentage = Math.min(100, Math.max(0, Number(lawyerFeeInput || 0)));
  const managementFeeAmount = grossAmount > 0 ? roundMoney(grossAmount * (managementFeePercentage / 100)) : 0;
  const amountAfterManagement = grossAmount > 0 ? roundMoney(Math.max(0, grossAmount - managementFeeAmount)) : 0;
  const lawyerFeeAmount = amountAfterManagement > 0 ? roundMoney(amountAfterManagement * (lawyerFeePercentage / 100)) : 0;
  const distributableAmount = amountAfterManagement > 0 ? roundMoney(Math.max(0, amountAfterManagement - lawyerFeeAmount)) : 0;

  return {
    grossAmount,
    managementFeePercentage,
    managementFeeAmount,
    amountAfterManagement,
    lawyerFeePercentage,
    lawyerFeeAmount,
    distributableAmount,
  };
};

export const buildMembersHash = (memberIds: string[]) =>
  memberIds
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .join('|');

export const buildInheritancePlanFromApiRows = (
  rows: SiennaRealtimeCalculationRow[],
  members: SiennaFamilyMember[]
): InheritancePlan => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const activeHeirs: InheritanceShare[] = rows
    .map((row) => {
      const member = membersById.get(row.member_id);
      if (!member) return null;
      return {
        member,
        share: Number(row.share_percent || 0),
        role: 'Heredero final',
        reason: row.reason || '',
        route: row.route || '',
        paymentBasis: row.payment_basis || '',
        sources: Array.isArray(row.sources) ? row.sources : [],
        sourceBreakdown: Array.isArray(row.source_breakdown)
          ? row.source_breakdown.map((segment) => ({
              source: segment.source,
              share: Number(segment.share || 0),
              routes: Array.isArray(segment.routes) ? segment.routes : [],
            }))
          : [],
      } satisfies InheritanceShare;
    })
    .filter((share): share is InheritanceShare => Boolean(share));

  return {
    activeHeirs,
    sharesById: new Map(activeHeirs.map((share) => [share.member.id, share])),
    sharesByName: new Map(activeHeirs.map((share) => [share.member.name, share])),
  };
};
