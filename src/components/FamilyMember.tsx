
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FamilyMemberProps {
  name: string;
  birth?: string;
  death?: string;
  spouse?: string;
  isHighlighted?: boolean;
  className?: string;
  onClick?: () => void;
}

const FamilyMember: React.FC<FamilyMemberProps> = ({
  name,
  birth,
  death,
  spouse,
  isHighlighted = false,
  className,
  onClick
}) => {
  const isDeceased = Boolean(death?.trim());

  return (
    <Card 
      className={cn(
        "relative w-60 max-w-full border-2 transition-all cursor-pointer",
        isHighlighted ? "border-legal-gold bg-legal-beige" : "border-gray-300 bg-white hover:border-legal-blue/30",
        className
      )}
      onClick={onClick}
    >
      {isDeceased && (
        <div
          className="deceased-ribbon-badge right-2 top-2"
          title={death ? `Fallecido: ${death}` : 'Fallecido'}
          aria-label={death ? `Fallecido: ${death}` : 'Fallecido'}
        >
          <span className="deceased-ribbon" aria-hidden="true" />
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-serif font-bold text-legal-blue">{name}</h3>
        
        {(birth || death) && (
          <div className="text-sm mt-1 text-gray-600">
            {birth && <span>n. {birth}</span>}
            {birth && death && <span> - </span>}
            {death && <span>m. {death}</span>}
          </div>
        )}

        {isDeceased && (
          <div className="mt-2 inline-flex rounded-full border border-gray-400 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-800">
            Fallecido
          </div>
        )}
        
        {spouse && (
          <div className="mt-2 text-sm">
            <span className="text-legal-gray">Cónyuge:</span> {spouse}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyMember;
