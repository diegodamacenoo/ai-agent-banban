'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Section, 
  DevelopmentGuidePreferences, 
  UseDevelopmentGuideReturn 
} from '../types';
import { SECTIONS_CONFIG } from '../config/sections';
import { 
  saveToStorage, 
  loadFromStorage, 
  STORAGE_KEYS, 
  DEV_GUIDE_CONFIG,
  DEFAULT_DEV_CONFIG 
} from '../utils';

export function useDevelopmentGuide(): UseDevelopmentGuideReturn {
  const [sections, setSections] = useState<Section[]>(SECTIONS_CONFIG);
  const [currentSection, setCurrentSectionState] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<DevelopmentGuidePreferences>(DEFAULT_DEV_CONFIG);

  // Load initial state from storage
  useEffect(() => {
    try {
      const savedSection = loadFromStorage(STORAGE_KEYS.CURRENT_SECTION, 'dashboard');
      const savedProgress = loadFromStorage<Record<string, { completed: number; total: number }>>(STORAGE_KEYS.PROGRESS_DATA, {});
      const savedPreferences = loadFromStorage(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_DEV_CONFIG);

      setCurrentSectionState(savedSection);
      setPreferences(savedPreferences);

      // Hydrate sections with saved progress
      setSections(prevSections => prevSections.map(section => {
        const progress = savedProgress[section.id];
        return progress ? { ...section, completedSteps: progress.completed, totalSteps: progress.total } : section;
      }));

    } catch (error) {
      console.debug('Error loading development guide state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-save preferences
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(STORAGE_KEYS.USER_PREFERENCES, preferences);
    }
  }, [preferences, isLoading]);

  // Auto-save current section and progress
  useEffect(() => {
    if (!isLoading && preferences.autoSave) {
      saveToStorage(STORAGE_KEYS.CURRENT_SECTION, currentSection);
      
      const progressToSave = sections.reduce((acc, section) => {
        acc[section.id] = { completed: section.completedSteps, total: section.totalSteps };
        return acc;
      }, {} as Record<string, { completed: number; total: number }>);

      saveToStorage(STORAGE_KEYS.PROGRESS_DATA, progressToSave);
    }
  }, [currentSection, sections, isLoading, preferences.autoSave]);

  const setCurrentSection = useCallback((sectionId: string) => {
    if (sections.some(section => section.id === sectionId)) {
      setCurrentSectionState(sectionId);
      
      // Use requestAnimationFrame for smoother scrolling after state update
      requestAnimationFrame(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop - DEV_GUIDE_CONFIG.SCROLL_OFFSET;
          window.scrollTo({
            top: offsetTop,
            behavior: preferences.showAnimations ? 'smooth' : 'auto'
          });
        }
      });
    }
  }, [sections, preferences.showAnimations]);

  const updateSectionProgress = useCallback((sectionId: string, completed: number, total: number) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId ? { ...section, completedSteps: completed, totalSteps: total } : section
      )
    );
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<DevelopmentGuidePreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  // Memoize progress calculation
  const progress = useMemo(() => {
    const totalSteps = sections.reduce((acc, section) => acc + section.totalSteps, 0);
    const completedSteps = sections.reduce((acc, section) => acc + section.completedSteps, 0);
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      totalSteps,
      completedSteps,
      percentage
    };
  }, [sections]);

  return {
    sections,
    currentSection,
    setCurrentSection,
    progress,
    updateSectionProgress,
    isLoading,
    preferences,
    updatePreferences
  };
}


// Hook for section-specific state management
export function useSectionState(sectionId: string) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenVisited, setHasBeenVisited] = useState(false);

  useEffect(() => {
    const visited = loadFromStorage(`section_visited_${sectionId}`, false);
    setHasBeenVisited(visited);
  }, [sectionId]);

  const markAsVisited = useCallback(() => {
    if (!hasBeenVisited) {
      setHasBeenVisited(true);
      saveToStorage(`section_visited_${sectionId}`, true);
    }
  }, [sectionId, hasBeenVisited]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    markAsVisited();
  }, [markAsVisited]);

  return {
    isExpanded,
    setIsExpanded,
    hasBeenVisited,
    markAsVisited,
    toggleExpanded
  };
}

// Hook for health monitoring
export function useHealthMonitoring() {
  const [healthData, setHealthData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh health data
  useEffect(() => {
    const refreshHealthData = async () => {
      setIsRefreshing(true);
      try {
        const { getBaseModuleStats } = await import('@/app/actions/admin/modules/base-modules');
        const result = await getBaseModuleStats();
        
        if (result.success) {
          setHealthData(result.data);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.debug('Error refreshing health data:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshHealthData();
    
    // Only set interval if HEALTH_CHECK_INTERVAL > 0
    if (DEV_GUIDE_CONFIG.HEALTH_CHECK_INTERVAL > 0) {
      const interval = setInterval(refreshHealthData, DEV_GUIDE_CONFIG.HEALTH_CHECK_INTERVAL);
      return () => clearInterval(interval);
    }
  }, []);

  const refreshHealthData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { getBaseModuleStats } = await import('@/app/actions/admin/modules/base-modules');
      const result = await getBaseModuleStats();
      
      if (result.success) {
        setHealthData(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.debug('Error refreshing health data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    healthData,
    lastUpdate,
    isRefreshing,
    refreshHealthData
  };
}