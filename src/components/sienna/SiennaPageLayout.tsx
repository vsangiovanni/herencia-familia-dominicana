import React from 'react';

type SiennaPageLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

const SiennaPageLayout = ({ children, className = '' }: SiennaPageLayoutProps) => (
  <div className={`app-shell py-4 sm:py-6 lg:py-8 ${className}`.trim()}>
    {children}
  </div>
);

export default SiennaPageLayout;
