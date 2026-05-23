import { SiennaFamilyMember } from './api';
import { InheritanceStatus } from './dominicanInheritance';

export const getMemberStoredInheritanceStatus = (member: SiennaFamilyMember): InheritanceStatus =>
  (member.inheritance_status_stored ?? member.inheritance_status ?? 'requiere_revision') as InheritanceStatus;

export const getMemberStoredInheritanceReason = (member: SiennaFamilyMember): string | null =>
  member.inheritance_reason_stored ?? member.inheritance_reason ?? null;

export const getMemberEffectiveInheritanceStatus = (
  member: SiennaFamilyMember
): InheritanceStatus => {
  if (member.effective_inheritance_status) {
    return member.effective_inheritance_status;
  }
  return getMemberStoredInheritanceStatus(member);
};

export const getMemberEffectiveInheritanceReason = (
  member: SiennaFamilyMember
): string | null => {
  if (member.effective_inheritance_reason) {
    return member.effective_inheritance_reason;
  }
  return getMemberStoredInheritanceReason(member);
};

export const memberUsesManualInheritanceOverride = (member: SiennaFamilyMember): boolean =>
  getMemberStoredInheritanceStatus(member) !== 'requiere_revision';
