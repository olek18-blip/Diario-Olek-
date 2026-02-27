import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useNotifications } from './useNotifications';

export interface VoiceEntry {
  id: string;
  user_id: string;
  audio_url: string | null;
  transcript: string | null;
  summary: string | null;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface DiaryEvent {
  id: string;
  user_id: string;
  entry_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  reminded: boolean;
  created_at: string;
}

export const useDiaryStore = () => {
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendNotification, scheduleEventReminder } = useNotifications();

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('voice_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  }, [user]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('diary_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      
      // Schedule notifications for upcoming events
      data?.forEach(event => {
        scheduleEventReminder(event.title, new Date(event.event_date), (event as any).reminder_minutes || 60);
      });
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [user, scheduleEventReminder]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchEntries(), fetchEvents()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setEntries([]);
      setEvents([]);
      setIsLoading(false);
    }
  }, [user, fetchEntries, fetchEvents]);

  const addEntry = useCallback(async (transcript: string, duration: number) => {
    if (!user) return null;
    
    setIsProcessing(true);
    
    try {
      // Insert the entry
      const { data: entry, error } = await supabase
        .from('voice_entries')
        .insert({
          user_id: user.id,
          transcript,
          duration: Math.round(duration),
        })
        .select()
        .single();

      if (error) throw error;

      // Analyze with AI
      const { data: session } = await supabase.auth.getSession();
      
      const analyzeResponse = await supabase.functions.invoke('analyze-entry', {
        body: { transcript, entryId: entry.id },
      });

      if (analyzeResponse.error) {
        console.error('Analysis error:', analyzeResponse.error);
      } else {
        const result = analyzeResponse.data;
        
        // Notify about events found
        if (result.eventsCount > 0) {
          sendNotification('📅 Eventos detectados', {
            body: `Se encontraron ${result.eventsCount} evento(s) en tu nota`,
          });
          
          toast({
            title: "¡Eventos detectados!",
            description: `Se encontraron ${result.eventsCount} evento(s) en tu nota.`,
          });
          
          // Refresh events
          fetchEvents();
        }
      }

      setEntries(prev => [entry, ...prev]);
      
      toast({
        title: "Nota guardada",
        description: "Tu nota de voz ha sido transcrita y guardada.",
      });

      return entry;
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la nota.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, toast, sendNotification, fetchEvents]);

  const getEntriesForDate = useCallback((date: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.toDateString() === date.toDateString();
    });
  }, [entries]);

  const getUpcomingEvents = useCallback(() => {
    return events.slice(0, 5);
  }, [events]);

  return {
    entries,
    events,
    isProcessing,
    isLoading,
    addEntry,
    getEntriesForDate,
    getUpcomingEvents,
    refetch: () => Promise.all([fetchEntries(), fetchEvents()]),
  };
};
