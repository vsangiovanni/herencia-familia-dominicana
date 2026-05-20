import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SoftLoadingIndicatorProps = {
  active?: boolean;
  message?: string;
  className?: string;
};

const SoftLoadingIndicator = ({
  active = true,
  message = 'Cargando datos...',
  className,
}: SoftLoadingIndicatorProps) => {
  if (!active) return null;

  return (
    <div className={cn('pointer-events-none sticky top-20 z-30 flex justify-center px-4', className)}>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-legal-gold/35 bg-white/90 px-3 py-1.5 text-xs text-legal-gray shadow-sm backdrop-blur"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-legal-blue" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default SoftLoadingIndicator;
