
import React from 'react';
import { Separator } from '@/components/ui/separator';

interface DocumentHeaderProps {
  title: string;
  subtitle?: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="mb-6 text-center sm:mb-8">
      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 px-1">
        <div className="hidden h-1 w-8 bg-legal-gold sm:block md:w-10" />
        <h1 className="break-words text-2xl font-bold text-legal-blue sm:text-3xl md:text-4xl lg:text-5xl">
          {title}
        </h1>
        <div className="hidden h-1 w-8 bg-legal-gold sm:block md:w-10" />
      </div>
      {subtitle && <p className="mt-2 px-2 text-base text-legal-gray sm:text-lg">{subtitle}</p>}
      <Separator className="mt-4 bg-legal-gold/20" />
    </header>
  );
};

export default DocumentHeader;
