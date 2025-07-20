'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Toast } from './toast-context';
import { Button } from '@/shared/ui/button';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const variantConfig = {
  default: {
    icon: Info,
    className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
  },
  info: {
    icon: Info,
    className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
  },
};

export function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = variantConfig[toast.variant || 'default'];
  const Icon = config.icon;
  const [isRemoving, setIsRemoving] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const dragXRef = useRef(0);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    // Aguarda a animação terminar antes de remover
    setTimeout(() => {
      onRemove(toast.id);
    }, 250);
  }, [onRemove, toast.id]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.clientX;
    setDragX(0);
    dragXRef.current = 0;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    setDragX(0);
    dragXRef.current = 0;
  };

  // Listeners globais simplificados
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      if (deltaX > 0) {
        const resistance = deltaX > 150 ? 0.3 : 1;
        const adjustedDelta = deltaX <= 150 ? deltaX : 150 + (deltaX - 150) * resistance;
        dragXRef.current = adjustedDelta;
        setDragX(adjustedDelta);
      } else {
        dragXRef.current = 0;
        setDragX(0);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragXRef.current > 100) {
        // Manter a posição atual do drag e iniciar animação de saída
        handleRemove();
      } else {
        // Voltar para posição inicial apenas se não atingiu o threshold
        setDragX(0);
        dragXRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - startXRef.current;
      if (deltaX > 0) {
        const resistance = deltaX > 150 ? 0.3 : 1;
        const adjustedDelta = deltaX <= 150 ? deltaX : 150 + (deltaX - 150) * resistance;
        dragXRef.current = adjustedDelta;
        setDragX(adjustedDelta);
      } else {
        dragXRef.current = 0;
        setDragX(0);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (dragXRef.current > 100) {
        // Manter a posição atual do drag e iniciar animação de saída
        handleRemove();
      } else {
        // Voltar para posição inicial apenas se não atingiu o threshold
        setDragX(0);
        dragXRef.current = 0;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Marcar como animado após primeira renderização
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimatedIn(true);
    }, 350); // Tempo da animação de entrada

    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss com animação - pausar quando hover
  useEffect(() => {
    if (toast.duration && toast.duration > 0 && !toast.persistent && !isHovered) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.persistent, handleRemove, isHovered]);

  return (
    <div
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg',
        'hover:shadow-xl transition-shadow duration-200 select-none',
        'pointer-events-auto', // Garantir que eventos funcionem
        // Aplicar animação de entrada apenas na primeira vez
        !isRemoving && !isDragging && !hasAnimatedIn && 'toast-slide-in',
        isRemoving && !isDragging && 'toast-slide-out',
        config.className
      )}
      style={{
        transform: `translateX(${dragX}px)`,
        transition: isDragging ? 'none' : isRemoving ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        willChange: isDragging || isRemoving ? 'transform' : 'auto',
        position: 'relative',
        zIndex: isDragging ? 1000 : 'auto'
      }}
      role="alert"
      aria-live="polite"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ícone */}
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 space-y-1">
        <div className="font-semibold text-sm leading-tight">
          {toast.title}
        </div>
        {toast.description && (
          <div className="text-sm opacity-90 leading-relaxed">
            {toast.description}
          </div>
        )}
      </div>

      {/* Botões de ação */}
      {(toast.cancel || toast.action) && (
        <div className="flex items-center gap-2">
          {toast.cancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toast.cancel?.onClick?.();
                handleRemove();
              }}
              className="h-8 px-3 text-xs"
            >
              {toast.cancel.label}
            </Button>
          )}
          
          {toast.action && (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toast.action?.onClick();
                handleRemove();
              }}
              className="h-8 px-3 text-xs"
            >
              {toast.action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}