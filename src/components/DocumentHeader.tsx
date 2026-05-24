import React from 'react';
import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import PageHelp from '@/components/PageHelp';
import { useSiennaPersonalization } from '@/hooks/useSiennaPersonalization';

interface DocumentHeaderProps {
  title: string;
  subtitle?: string;
  helpKey?: string;
  helpToolbar?: React.ReactNode;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, subtitle, helpKey, helpToolbar }) => {
  const location = useLocation();
  const isSiennaSection = location.pathname === '/dashboard' || location.pathname.startsWith('/sienna');
  const personalization = useSiennaPersonalization(isSiennaSection);

  return (
    <header className="relative mb-6 text-center sm:mb-8">
      {(helpKey || helpToolbar) && (
        <div className="absolute right-0 top-0 z-10 flex items-center gap-1 sm:right-1">
          {helpToolbar}
          {helpKey && <PageHelp helpKey={helpKey} />}
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 px-1 pr-10 sm:pr-12">
        <div className="hidden h-1 w-8 bg-legal-gold sm:block md:w-10" />
        <h1 className="break-words text-2xl font-bold text-legal-blue sm:text-3xl md:text-4xl lg:text-5xl">
          {title}
        </h1>
        <div className="hidden h-1 w-8 bg-legal-gold sm:block md:w-10" />
      </div>
      {subtitle && <p className="mt-2 px-2 pr-8 text-base text-legal-gray sm:pr-10 sm:text-lg">{subtitle}</p>}
      {isSiennaSection && personalization.isLinkedMember && (
        <p className="mt-2 px-2 pr-8 text-sm font-medium text-legal-blue/80 sm:pr-10">
          {personalization.firstName}, estoy leyendo esta pantalla desde tu conexión familiar: {personalization.memberLabel}.
        </p>
      )}
      <Separator className="mt-4 bg-legal-gold/20" />
    </header>
  );
};

export default DocumentHeader;
