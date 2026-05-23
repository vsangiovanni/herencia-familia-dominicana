import { SiennaFamilyMember } from '@/lib/api';
import {
  getMemberLinkVerificationStatus,
  hasDocumentalSpouseReference,
  SiennaGenealogyBundle,
} from '@/lib/siennaGenealogy';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';

type MemberVerificationBadgeProps = {
  member: SiennaFamilyMember;
  members: SiennaFamilyMember[];
  genealogy: SiennaGenealogyBundle;
  className?: string;
  showDocumental?: boolean;
};

const MemberVerificationBadge = ({
  member,
  members,
  genealogy,
  className,
  showDocumental = true,
}: MemberVerificationBadgeProps) => {
  const { status, detail } = getMemberLinkVerificationStatus(member, members, genealogy);
  const documental = showDocumental && hasDocumentalSpouseReference(member);

  if (status === 'verified') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1', className)}>
        <Badge
          variant="outline"
          className="border-emerald-300 bg-emerald-50 text-emerald-800"
          title="Enlaces formales verificados"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verificado
        </Badge>
        {documental && (
          <Badge
            variant="outline"
            className="border-slate-300 bg-slate-50 text-slate-700"
            title={`Cónyuge documental: ${member.spouse?.trim()}`}
          >
            <FileText className="mr-1 h-3 w-3" />
            Ref. doc.
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <Badge
        variant="outline"
        className="border-amber-300 bg-amber-50 text-amber-900"
        title={detail || 'Faltan enlaces formales'}
      >
        <AlertCircle className="mr-1 h-3 w-3" />
        Pendiente enlace
      </Badge>
      {documental && (
        <Badge
          variant="outline"
          className="border-slate-300 bg-slate-50 text-slate-700"
          title={`Cónyuge documental (no afecta herencia): ${member.spouse?.trim()}`}
        >
          <FileText className="mr-1 h-3 w-3" />
          Ref. doc.
        </Badge>
      )}
    </div>
  );
};

export default MemberVerificationBadge;
