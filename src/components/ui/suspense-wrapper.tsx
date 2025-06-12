import React, { Suspense } from 'react';
import { 
  SkeletonCard, 
  SkeletonForm, 
  SkeletonList, 
  SkeletonTable, 
  SkeletonMetrics,
  SkeletonProfile 
} from '@/components/ui/skeleton-loader';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: 'card' | 'form' | 'list' | 'table' | 'metrics' | 'profile' | React.ReactNode;
  className?: string;
}

const fallbackComponents = {
  card: <SkeletonCard />,
  form: <SkeletonForm />,
  list: <SkeletonList />,
  table: <SkeletonTable />,
  metrics: <SkeletonMetrics />,
  profile: <SkeletonProfile />,
};

/**
 * Wrapper Suspense com fallbacks skeleton pré-configurados
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback = 'card',
  className,
}) => {
  const fallbackElement = typeof fallback === 'string' 
    ? fallbackComponents[fallback as keyof typeof fallbackComponents] 
    : fallback;

  return (
    <div className={className}>
      <Suspense fallback={fallbackElement}>
        {children}
      </Suspense>
    </div>
  );
};

/**
 * Hook para delayed loading (evita flash de skeleton em carregamentos rápidos)
 */
export const useDelayedLoading = (isLoading: boolean, delay: number = 300) => {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);

  return showSkeleton;
}; 