'use client';

import { getTimeBasedGreeting, getTimeBasedSubtitle, formatDateTime } from '../mock-data';

interface WelcomeHeaderProps {
  visibleCount: number;
  totalCount: number;
}

export function WelcomeHeader({ visibleCount, totalCount }: WelcomeHeaderProps) {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 py-12 text-center">
        <div className="space-y-6">
          {/* Título Principal */}
          <div className="space-y-2">
            <h1 className="text-4xl font-medium text-foreground">
              Olá Diego, aqui estão os principais insights desta manhã
              {/* {getTimeBasedGreeting()} */}
            </h1>
            {/* <p className="text-xl text-muted-foreground">
              {getTimeBasedSubtitle()}
            </p> */}
          </div>

          {/* Data e Contador */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{formatDateTime()}</span>
            <span>•</span>
            <span>
              {visibleCount} de {totalCount} insights
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}