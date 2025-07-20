'use client';

import { useState, useEffect } from 'react';
import { mockInsights, getTimeBasedGreeting, getTimeBasedSubtitle } from './mock-data';
import { InsightCard } from './components/InsightCard';
import { FloatingChat } from './components/FloatingChat';
import { WelcomeHeader } from './components/WelcomeHeader';
import { InsightDrawer } from './components/InsightDrawer';
import { Insight } from './types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Chip } from '@/shared/ui/chip';

export default function MockInsightsHomePage() {
  const [visibleInsights, setVisibleInsights] = useState<Insight[]>([]);
  const [totalInsights, setTotalInsights] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Simular carregamento de insights
    const timer = setTimeout(() => {
      setTotalInsights(mockInsights.length);
      setVisibleInsights(mockInsights.slice(0, 6)); // Mostrar apenas 6 inicialmente
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedInsight(null);
  };

  const handleStartChat = (insight: Insight) => {
    setSelectedInsight(insight);
    setChatOpen(true);
    setDrawerOpen(false); // Fechar drawer ao abrir chat
  };

  const handleViewMore = () => {
    // Mostrar mais insights
    const currentCount = visibleInsights.length;
    const newInsights = mockInsights.slice(0, currentCount + 3);
    setVisibleInsights(newInsights);
  };

  const remainingCount = totalInsights - visibleInsights.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header de Boas-vindas */}
      <WelcomeHeader 
        visibleCount={visibleInsights.length}
        totalCount={totalInsights}
      />

      {/* Grid de Cards de Insights */}
      <div className="w-1/2 mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleInsights.map((insight, index) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onClick={() => handleInsightClick(insight)}
              delay={index * 100} // Animação escalonada
            />
          ))}
        </div>

        {/* Botões de Ação */}
        {remainingCount > 0 && (
          <div className="flex justify-center mt-8 gap-4">
            <Button
              variant="secondary"
              onClick={handleViewMore}
            >
              Ver mais insights ({remainingCount})
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleViewMore}
            >
              💡 Como estou indo?
            </Button>
          </div>
        )}


        {/* Streak Badge */}
        <div className="mt-4 text-center">
          <Chip variant="light_success">
            <span>🎯 Streak de 7 dias resolvendo insights críticos rapidamente!</span>
          </Chip>
        </div>
      </div>

      {/* Chat Flutuante */}
      <FloatingChat
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        selectedInsight={selectedInsight}
        availableInsights={visibleInsights}
      />

      {/* Drawer de Detalhes */}
      <InsightDrawer
        insight={selectedInsight}
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        onStartChat={handleStartChat}
      />
    </div>
  );
}