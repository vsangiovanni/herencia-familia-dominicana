import React from 'react';

type SiennaPageLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

const SiennaPageLayout = ({ children, className = '' }: SiennaPageLayoutProps) => (
  <div className={`mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:py-8 ${className}`.trim()}>
    {children}
  </div>
);

export default SiennaPageLayout;
