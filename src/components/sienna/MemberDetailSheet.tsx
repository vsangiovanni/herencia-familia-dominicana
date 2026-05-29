import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ConfirmedHeir, EvidenceDocument, SiennaFamilyMember } from '@/lib/api';
import { MemberPhotoLookup } from '@/lib/memberPhotos';
import {
  getParentLinksForChild,
  resolveSpouseDisplayLabel,
  SiennaGenealogyBundle,
} from '@/lib/siennaGenealogy';
import {
  getMemberEffectiveInheritanceReason,
  getMemberEffectiveInheritanceStatus,
  getMemberStoredInheritanceStatus,
} from '@/lib/siennaMemberInheritance';
import MemberPhoto from './MemberPhoto';
import MemberVerificationBadge from './MemberVerificationBadge';
import { Edit, FileText, GitBranch, Network, Route, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const statusLabel: Record<string, string> = {
  confirmado: 'Confirmado',
  posible_heredero: 'Posible heredero',
  no_hereda: 'No hereda',
  requiere_revision: 'Requiere revisión',
};

const statusClass: Record<string, string> = {
  confirmado: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  posible_heredero: 'border-legal-gold/40 bg-legal-gold/15 text-legal-blue',
  no_hereda: 'border-slate-300 bg-slate-50 text-slate-700',
  requiere_revision: 'border-red-300 bg-red-50 text-red-800',
};

type MemberDetailSheetProps = {
  member: SiennaFamilyMember | null;
  members: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
  heirs?: ConfirmedHeir[];
  documents?: EvidenceDocument[];
  photoLookup?: MemberPhotoLookup;
  photoData?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
const normalizeId = (value?: string | null) => (value || '').trim();

const resolveOtherParent = (
  member: SiennaFamilyMember,
  baseParent: SiennaFamilyMember | null,
  membersById: Map<string, SiennaFamilyMember>,
  genealogy: SiennaGenealogyBundle
) => {
  const baseParentId = normalizeId(baseParent?.id || member.parent_id);
  if (!baseParentId) return null;
  const link = getParentLinksForChild(member.id, genealogy.parent_links).find(
    (item) => normalizeId(item.parent_member_id) === baseParentId && normalizeId(item.union_id)
  );
  const union = link?.union_id ? genealogy.unions.find((item) => item.id === link.union_id) : null;
  if (!union) return null;
  const partnerA = normalizeId(union.partner_a_member_id);
  const partnerB = normalizeId(union.partner_b_member_id);
  const otherParentId = partnerA === baseParentId ? partnerB : partnerB === baseParentId ? partnerA : '';
  return otherParentId ? membersById.get(otherParentId) || null : null;
};

const relatedDocumentsForMember = (member: SiennaFamilyMember | null, documents: EvidenceDocument[]) => {
  if (!member) return [];
  const memberName = normalize(member.name);
  return documents.filter((doc) => {
    const ids = [
      doc.primary_member_id,
      doc.father_member_id,
      doc.mother_member_id,
      doc.spouse_member_id,
      doc.related_member_id,
    ].filter(Boolean);
    if (ids.includes(member.id)) return true;
    return [
      doc.primary_person,
      doc.father_name,
      doc.mother_name,
      doc.spouse_name,
      doc.related_heir_name,
    ]
      .filter(Boolean)
      .some((name) => normalize(name) === memberName);
  });
};

const MemberDetailSheet = ({
  member,
  members,
  genealogy,
  heirs = [],
  documents = [],
  photoLookup,
  photoData,
  open,
  onOpenChange,
}: MemberDetailSheetProps) => {
  const { hasAccess } = useAuth();
  const canOpenTree = hasAccess('/sienna/arbol-genealogico');
  const canOpenLineages = hasAccess('/sienna/dobles-linajes');
  const canOpenMemberAdmin = hasAccess('/sienna/miembros-arbol');
  const membersById = new Map(members.map((item) => [item.id, item]));
  const heir =
    member &&
    heirs.find(
      (item) =>
        item.sienna_member_id === member.id ||
        normalize(item.heir_name) === normalize(member.name)
    );
  const effectiveStatus = member ? getMemberEffectiveInheritanceStatus(member) : 'requiere_revision';
  const storedStatus = member ? getMemberStoredInheritanceStatus(member) : 'requiere_revision';
  const effectiveReason = member ? getMemberEffectiveInheritanceReason(member) : null;
  const parent =
    member?.parent_id ? membersById.get(normalizeId(member.parent_id)) || null : null;
  const otherParent = member ? resolveOtherParent(member, parent, membersById, genealogy) : null;
  const spouseLabel = member ? resolveSpouseDisplayLabel(member, members, genealogy) : null;
  const parentLinks = member ? getParentLinksForChild(member.id, genealogy.parent_links) : [];
  const memberDocuments = relatedDocumentsForMember(member, documents);
  const hasDualParentRoute = Boolean(parent && otherParent);
  const isDeceased = Boolean(member?.death);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {!member ? null : (
          <div className="space-y-5 pb-8">
            <SheetHeader className="space-y-3 pr-8 text-left">
              <div className="flex items-start gap-3">
                <MemberPhoto
                  name={member.name}
                  memberId={member.id}
                  photoData={photoData || heir?.photo_data}
                  lookup={photoLookup}
                  size="xl"
                  rounded="xl"
                  pendingInheritance={effectiveStatus === 'requiere_revision'}
                />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="font-serif text-xl leading-tight text-legal-blue">
                    {member.name}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-sm">
                    Ficha canónica del miembro
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={statusClass[effectiveStatus]}>
                      {statusLabel[effectiveStatus] || effectiveStatus}
                    </Badge>
                    {storedStatus !== effectiveStatus && (
                      <Badge variant="outline" className="border-legal-blue/20 bg-white text-legal-blue">
                        Guardado: {statusLabel[storedStatus] || storedStatus}
                      </Badge>
                    )}
                    {isDeceased && (
                      <Badge variant="outline" className="border-gray-400 bg-gray-50 text-gray-800">
                        Fallecido{member.death ? `: ${member.death}` : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="rounded-md border border-legal-blue/10 bg-legal-blue/5 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-legal-blue">
                <UserRound className="h-3.5 w-3.5" />
                Resumen canónico
              </p>
              <div className="mt-3 grid gap-2 text-sm text-gray-700">
                <p><span className="font-semibold text-legal-blue">Nacimiento:</span> {member.birth || 'Sin fecha'}</p>
                <p><span className="font-semibold text-legal-blue">Defunción:</span> {member.death || 'No registrada'}</p>
                <p><span className="font-semibold text-legal-blue">Cónyuge:</span> {spouseLabel || 'No registrado'}</p>
                <p><span className="font-semibold text-legal-blue">Padre/Madre base:</span> {parent?.name || 'No registrado'}</p>
                <p><span className="font-semibold text-legal-blue">Segundo vínculo:</span> {otherParent?.name || 'No registrado'}</p>
              </div>
            </div>

            <div className="rounded-md border border-legal-gold/25 bg-white p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-legal-blue">
                <Route className="h-3.5 w-3.5" />
                Estado sucesoral efectivo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {effectiveReason || 'El backend no devolvió una razón efectiva para este miembro.'}
              </p>
            </div>

            <details className="rounded-md border border-legal-blue/10 bg-white">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase text-legal-blue">
                <span className="inline-flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5" />
                  Integridad genealógica
                </span>
                <MemberVerificationBadge member={member} members={members} genealogy={genealogy} />
              </summary>
              <div className="grid gap-2 border-t border-legal-blue/10 p-3 text-sm text-gray-700">
                <p>ID interno: <span className="font-mono text-xs">{member.id}</span></p>
                <p>Vínculos parentales formales: <span className="font-semibold">{parentLinks.length}</span></p>
                <p>Cruce de dos rutas parentales: <span className="font-semibold">{hasDualParentRoute ? 'Sí' : 'No'}</span></p>
                <p>Documentos relacionados: <span className="font-semibold">{memberDocuments.length}</span></p>
              </div>
            </details>

            {memberDocuments.length > 0 && (
              <div className="rounded-md border border-legal-blue/10 bg-white p-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-legal-blue">
                  <FileText className="h-3.5 w-3.5" />
                  Documentos vinculados
                </p>
                <div className="mt-3 space-y-2">
                  {memberDocuments.slice(0, 5).map((doc) => (
                    <div key={doc.id || doc.title} className="rounded border border-legal-blue/10 bg-legal-beige/20 p-2">
                      <p className="text-sm font-semibold text-legal-blue">{doc.title}</p>
                      <p className="text-xs text-legal-gray">{doc.document_type} · {doc.event_date || 'Sin fecha'}</p>
                    </div>
                  ))}
                  {memberDocuments.length > 5 && (
                    <p className="text-xs text-legal-gray">+{memberDocuments.length - 5} documento(s) adicional(es)</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              {canOpenTree && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/sienna/arbol-genealogico?member=${encodeURIComponent(member.id)}`}>
                    <Network className="mr-2 h-4 w-4" />
                    Árbol
                  </Link>
                </Button>
              )}
              {canOpenLineages && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/sienna/dobles-linajes?member=${encodeURIComponent(member.id)}`}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Linajes
                  </Link>
                </Button>
              )}
              {canOpenMemberAdmin && (
                <Button asChild size="sm" className="bg-legal-blue hover:bg-legal-blue/90">
                  <Link to={`/sienna/miembros-arbol?edit=${encodeURIComponent(member.id)}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MemberDetailSheet;
