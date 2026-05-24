import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MemberDeceasedIndicatorProps = {
  death?: string | null;
  compact?: boolean;
  className?: string;
};

const MemberDeceasedIndicator = ({ death, compact = false, className }: MemberDeceasedIndicatorProps) => (
  <span
    className={cn('inline-flex shrink-0 items-center gap-1.5', className)}
    title={death ? `Fallecido: ${death}` : 'Fallecido'}
    aria-label={death ? `Fallecido: ${death}` : 'Fallecido'}
  >
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-gray-400/35 bg-white shadow-sm dark:border-[#D4AF37]/65 dark:bg-[#D4AF37]/15 dark:shadow-[0_0_16px_rgb(212_175_55_/_0.28)]',
        compact ? 'h-5 w-5' : 'h-6 w-6'
      )}
    >
      <span className={cn('deceased-ribbon', compact ? 'scale-[0.72]' : 'scale-90')} aria-hidden="true" />
    </span>
    <Badge
      variant="outline"
      className={cn(
        'border-gray-400 bg-gray-50 text-gray-800 dark:border-[#D4AF37]/55 dark:bg-[#D4AF37]/12 dark:text-[#F5F7FA]',
        compact ? 'px-1.5 py-0 text-[10px]' : 'text-xs'
      )}
    >
      Fallecido
    </Badge>
  </span>
);

type MemberNameWithDeceasedProps = {
  name: string;
  isDeceased?: boolean;
  death?: string | null;
  nameClassName?: string;
  className?: string;
  compact?: boolean;
  /** En tarjetas móviles: permite salto de línea en lugar de truncar el nombre. */
  wrap?: boolean;
};

export const MemberNameWithDeceased = ({
  name,
  isDeceased = false,
  death,
  nameClassName,
  className,
  compact = false,
  wrap = false,
}: MemberNameWithDeceasedProps) => (
  <div className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}>
    <span
      className={cn(
        'min-w-0',
        wrap ? 'break-words leading-snug' : 'truncate',
        nameClassName
      )}
    >
      {name}
    </span>
    {isDeceased && <MemberDeceasedIndicator death={death} compact={compact} />}
  </div>
);

export default MemberDeceasedIndicator;
