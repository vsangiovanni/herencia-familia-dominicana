import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getScreenHelp } from '@/data/screenHelp';

type PageHelpProps = {
  helpKey: string;
  className?: string;
};

const PageHelp = ({ helpKey, className = '' }: PageHelpProps) => {
  const content = getScreenHelp(helpKey);
  if (!content) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 rounded-full text-legal-blue hover:bg-legal-blue/10 hover:text-legal-blue ${className}`}
          aria-label={`Ayuda: ${content.title}`}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),22rem)] overflow-y-auto p-0"
      >
        <div className="border-b border-legal-gold/20 bg-legal-blue/5 px-4 py-3">
          <p className="text-sm font-semibold text-legal-blue">{content.title}</p>
          {content.intro && (
            <p className="mt-1 text-xs leading-relaxed text-legal-gray">{content.intro}</p>
          )}
        </div>
        <div className="space-y-4 px-4 py-3">
          {content.sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-legal-blue">
                {section.title}
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-gray-700">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PageHelp;
