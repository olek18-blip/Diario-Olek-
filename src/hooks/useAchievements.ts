import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  target_count: number;
  achievement_type: string;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface UserStats {
  total_entries: number;
  total_events: number;
  total_questions: number;
  current_streak: number;
  longest_streak: number;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('target_count', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, []);

  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStats(data || {
        total_entries: 0,
        total_events: 0,
        total_questions: 0,
        current_streak: 0,
        longest_streak: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  const checkAndUnlockAchievements = useCallback(async () => {
    if (!user || !stats || achievements.length === 0) return;

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const newUnlocks: Achievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let progress = 0;
      switch (achievement.achievement_type) {
        case 'entries':
          progress = stats.total_entries;
          break;
        case 'streak':
          progress = stats.current_streak;
          break;
        case 'events':
          progress = stats.total_events;
          break;
        case 'questions':
          progress = stats.total_questions;
          break;
      }

      if (progress >= achievement.target_count) {
        newUnlocks.push(achievement);
      }
    }

    // Unlock new achievements
    for (const achievement of newUnlocks) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

      if (!error) {
        toast({
          title: `🎉 ¡Logro desbloqueado!`,
          description: `${achievement.icon} ${achievement.name}`,
        });
      }
    }

    if (newUnlocks.length > 0) {
      fetchUserAchievements();
    }
  }, [user, stats, achievements, userAchievements, toast, fetchUserAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchUserAchievements(), fetchStats()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setUserAchievements([]);
      setStats(null);
      setIsLoading(false);
    }
  }, [user, fetchUserAchievements, fetchStats]);

  useEffect(() => {
    checkAndUnlockAchievements();
  }, [stats, checkAndUnlockAchievements]);

  const getProgress = useCallback((achievement: Achievement): number => {
    if (!stats) return 0;

    switch (achievement.achievement_type) {
      case 'entries':
        return Math.min(stats.total_entries / achievement.target_count, 1);
      case 'streak':
        return Math.min(stats.current_streak / achievement.target_count, 1);
      case 'events':
        return Math.min(stats.total_events / achievement.target_count, 1);
      case 'questions':
        return Math.min(stats.total_questions / achievement.target_count, 1);
      default:
        return 0;
    }
  }, [stats]);

  const isUnlocked = useCallback((achievementId: string): boolean => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  }, [userAchievements]);

  return {
    achievements,
    userAchievements,
    stats,
    isLoading,
    getProgress,
    isUnlocked,
    refetch: () => Promise.all([fetchAchievements(), fetchUserAchievements(), fetchStats()]),
  };
};
