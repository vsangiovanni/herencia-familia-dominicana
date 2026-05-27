import { ConfirmedHeir } from '@/lib/api';
import { normalizeName } from '@/lib/dominicanInheritance';

export type MemberPhotoLookup = {
  byMemberId: Map<string, ConfirmedHeir>;
  byName: Map<string, ConfirmedHeir>;
};

const LOCAL_MEMBER_PHOTO_OVERRIDES = new Map<string, string>([
  ['maria-rosa', '/game/legado/archive/member-photos/maria-rosa-sangiovanni-perez.jpg'],
  ['victor-manuel', '/game/legado/archive/member-photos/victor-manuel-sangiovanni-sangiovanni.jpg'],
]);

export const buildMemberPhotoLookup = (heirs: ConfirmedHeir[]): MemberPhotoLookup => {
  const byMemberId = new Map<string, ConfirmedHeir>();
  const byName = new Map<string, ConfirmedHeir>();

  heirs.forEach((heir) => {
    if (heir.sienna_member_id) {
      byMemberId.set(String(heir.sienna_member_id), heir);
    }
    if (heir.heir_name) {
      byName.set(normalizeName(heir.heir_name), heir);
    }
  });

  return { byMemberId, byName };
};

export const resolveMemberPhotoData = (
  lookup: MemberPhotoLookup,
  memberId?: string | null,
  memberName?: string | null
): string | null => {
  if (memberId && LOCAL_MEMBER_PHOTO_OVERRIDES.has(String(memberId))) {
    return LOCAL_MEMBER_PHOTO_OVERRIDES.get(String(memberId)) || null;
  }

  const heir =
    (memberId ? lookup.byMemberId.get(String(memberId)) : undefined) ||
    (memberName ? lookup.byName.get(normalizeName(memberName)) : undefined);

  const photo = heir?.photo_data;
  return photo && String(photo).trim() ? String(photo) : null;
};

export const resolveMemberPhotoVerificationStatus = (
  lookup: MemberPhotoLookup,
  memberId?: string | null,
  memberName?: string | null
): 'verified' | 'pending' | null => {
  const heir =
    (memberId ? lookup.byMemberId.get(String(memberId)) : undefined) ||
    (memberName ? lookup.byName.get(normalizeName(memberName)) : undefined);

  if (!heir) return null;
  return heir.status === 'confirmado' ? 'verified' : 'pending';
};

export const memberInitials = (name?: string | null) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};
