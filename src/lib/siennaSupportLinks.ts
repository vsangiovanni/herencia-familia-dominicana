export type SiennaSupportIntent = 'heir-support' | 'member-support';

export const buildSiennaDocumentSupportHref = (
  memberId: string,
  intent: SiennaSupportIntent = 'member-support'
) => `/sienna/documentos?memberId=${encodeURIComponent(memberId)}&intent=${encodeURIComponent(intent)}`;
