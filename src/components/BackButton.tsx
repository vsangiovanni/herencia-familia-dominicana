import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/** Rutas donde "Atrás" no aporta (son destino principal o login). */
const ROOT_PATHS = new Set(['/', '/dashboard', '/auth']);

const getHistoryIndex = (): number => {
  const state = window.history.state as { idx?: number } | null;
  return state && typeof state.idx === 'number' ? state.idx : 0;
};

interface BackButtonProps {
  className?: string;
  wrapperClassName?: string;
  /** Destino si no hay historial interno (entrada directa a la URL). */
  fallbackTo?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const BackButton: React.FC<BackButtonProps> = ({
  className = '',
  wrapperClassName = 'mb-4',
  fallbackTo = '/dashboard',
  variant = 'outline',
  size = 'sm',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (ROOT_PATHS.has(location.pathname)) {
    return null;
  }

  const hasInternalHistory = getHistoryIndex() > 0;

  const handleGoBack = () => {
    if (hasInternalHistory) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  };

  return (
    <div className={wrapperClassName}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleGoBack}
        className={`flex items-center gap-2 ${className}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Atrás
      </Button>
    </div>
  );
};

export default BackButton;
