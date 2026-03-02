import React from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import NotFound from '@/pages/NotFound';

interface VisibilityGuardProps {
  pageId: string;
  children: React.ReactNode;
}

const VisibilityGuard: React.FC<VisibilityGuardProps> = ({ pageId, children }) => {
  const { isPageVisible, isLoading } = usePageVisibility();

  // While loading, show children to avoid flash
  if (isLoading) return <>{children}</>;

  if (!isPageVisible(pageId)) {
    return <NotFound />;
  }

  return <>{children}</>;
};

export default VisibilityGuard;
