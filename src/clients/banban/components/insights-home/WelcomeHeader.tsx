'use client';

import { Button } from '@/shared/ui/button';
import { ArrowUp } from 'lucide-react';
import { Textarea } from '@/shared/ui/textarea';

interface WelcomeHeaderProps {
  visibleCount: number;
  totalCount: number;
  firstName?: string;
}

export function WelcomeHeader({ visibleCount, totalCount, firstName = 'Diego' }: WelcomeHeaderProps) {
  return (
    <div className="bg-background pt-12">
      <div className="container mx-auto px-6 py-12 text-center">
        <div className="space-y-6 text-left">
          {/* Título Principal */}
          <div className="space-y-2 text-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-medium text-foreground">
              Como posso ajudar você hoje?
            </h1>
          </div>

          <div className="flex flex-col justify-between relative rounded-xl border border-border p-2 shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 w-full">
                <Textarea variant="search" size="search" placeholder="Perfunte alguma coisa" className="bg-transparent text-md" />
              </div>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" size="icon">
                  <ArrowUp className="w-6 h-6" />
                </Button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}