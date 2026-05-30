import { ConfirmedHeir } from '@/lib/api';
import { normalizeName } from '@/lib/dominicanInheritance';

export type MemberPhotoLookup = {
  byMemberId: Map<string, ConfirmedHeir>;
  byName: Map<string, ConfirmedHeir>;
};

const LOCAL_MEMBER_PHOTO_OVERRIDES = new Map<string, string>([
  ['alessandro', '/game/legado/archive/member-photos/prod-sync/alessandro.png'],
  ['domingo-ramon-sangiovanni-perez-1779220685351', '/game/legado/archive/member-photos/prod-sync/domingo-ramon-sangiovanni-perez-1779220685351.png'],
  ['domenico', '/game/legado/archive/domenico-sangiovanni-portrait.webp'],
  ['gilda-altagracia-sangiovanni-gesualdo-1779238018002', '/game/legado/archive/member-photos/prod-sync/gilda-altagracia-sangiovanni-gesualdo-1779238018002.png'],
  ['irma-mercedes-sangiovanni-gesualdo-1779245439725', '/game/legado/archive/member-photos/prod-sync/irma-mercedes-sangiovanni-gesualdo-1779245439725.png'],
  ['javier-de-jesus-marquez-sangiovanni-1779247232889', '/game/legado/archive/member-photos/prod-sync/javier-de-jesus-marquez-sangiovanni-1779247232889.png'],
  ['jose-luis-de-jesus-marquez-sangiovanni-1779247298999', '/game/legado/archive/member-photos/prod-sync/jose-luis-de-jesus-marquez-sangiovanni-1779247298999.jpg'],
  ['jose-vicente', '/game/legado/archive/member-photos/prod-sync/jose-vicente.png'],
  ['maria-amparo-sangiovanni-gesualdo-1779300884233', '/game/legado/archive/member-photos/prod-sync/maria-amparo-sangiovanni-gesualdo-1779300884233.png'],
  ['maria-rosa', '/game/legado/archive/member-photos/maria-rosa-sangiovanni-perez.jpg'],
  ['maria-rosa-grisolia', '/game/legado/archive/maria-rosa-grisolia-portrait.webp'],
  ['maria-rosa-grisolia-di-vanna-1779890134349', '/game/legado/archive/maria-rosa-grisolia-portrait.webp'],
  ['paolo', '/game/legado/archive/member-photos/prod-sync/paolo.png'],
  ['vicente-sangiovanni-perez-1779294692767', '/game/legado/archive/extracted-faces/named/vicente-sangiovanni-perez.jpg'],
  ['vincenzo', '/game/legado/archive/member-photos/prod-sync/vincenzo.png'],
  ['victor-manuel', '/game/legado/archive/member-photos/victor-manuel-sangiovanni-sangiovanni.jpg'],
  ['victor-manuel-martin', '/game/legado/archive/member-photos/victor-manuel-martin-sangiovanni-rodriguez.jpg'],
  ['yolanda-providencia-sangiovanni-gesualdo-1779220777309', '/game/legado/archive/member-photos/prod-sync/yolanda-providencia-sangiovanni-gesualdo-1779220777309.png'],
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

export const resolveConfirmedHeirPhotoData = (heir?: ConfirmedHeir | null): string | null => {
  const embeddedPhoto = heir?.photo_data;
  if (embeddedPhoto && String(embeddedPhoto).trim()) {
    return String(embeddedPhoto);
  }

  if (heir?.has_photo && heir.id) {
    return `/api/confirmed-heirs/${encodeURIComponent(heir.id)}/photo`;
  }

  return null;
};

export const resolveMemberPhotoData = (
  lookup: MemberPhotoLookup,
  memberId?: string | null,
  memberName?: string | null
): string | null => {
  const heir =
    (memberId ? lookup.byMemberId.get(String(memberId)) : undefined) ||
    (memberName ? lookup.byName.get(normalizeName(memberName)) : undefined);

  return (
    resolveConfirmedHeirPhotoData(heir) ||
    (memberId && LOCAL_MEMBER_PHOTO_OVERRIDES.has(String(memberId))
      ? LOCAL_MEMBER_PHOTO_OVERRIDES.get(String(memberId)) || null
      : null)
  );
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
