
import React from 'react';
import { Separator } from "@/components/ui/separator";

interface DocumentHeaderProps {
  title: string;
  subtitle?: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="mb-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-1 w-10 bg-legal-gold"></div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-legal-blue">
          {title}
        </h1>
        <div className="h-1 w-10 bg-legal-gold"></div>
      </div>
      {subtitle && <p className="text-lg text-legal-gray mt-2">{subtitle}</p>}
      <Separator className="mt-4 bg-legal-gold/20" />
    </header>
  );
};

export default DocumentHeader;
