-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('entries', 'streak', 'events', 'questions')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table to track unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table to track progress
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_events INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_entry_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone (they're like a catalog)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, target_count, achievement_type) VALUES
  ('Primera nota', 'Graba tu primera nota de voz', '🎤', 1, 'entries'),
  ('Diario activo', 'Graba 10 notas de voz', '📝', 10, 'entries'),
  ('Memorias valiosas', 'Graba 50 notas de voz', '💎', 50, 'entries'),
  ('Historiador', 'Graba 100 notas de voz', '📚', 100, 'entries'),
  ('Racha de 3 días', 'Usa la app 3 días seguidos', '🔥', 3, 'streak'),
  ('Racha de 7 días', 'Usa la app 7 días seguidos', '⚡', 7, 'streak'),
  ('Racha de 30 días', 'Usa la app 30 días seguidos', '🏆', 30, 'streak'),
  ('Organizador', 'Crea 5 eventos desde tus notas', '📅', 5, 'events'),
  ('Planificador experto', 'Crea 20 eventos desde tus notas', '🗓️', 20, 'events'),
  ('Curioso', 'Haz tu primera pregunta a la IA', '❓', 1, 'questions'),
  ('Explorador', 'Haz 10 preguntas a la IA', '🔍', 10, 'questions'),
  ('Analista', 'Haz 50 preguntas a la IA', '🧠', 50, 'questions');

-- Function to update user stats and check achievements
CREATE OR REPLACE FUNCTION public.update_user_stats_on_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get or create user stats
  INSERT INTO public.user_stats (user_id, total_entries, last_entry_date, current_streak, longest_streak)
  VALUES (NEW.user_id, 1, CURRENT_DATE, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_entries = user_stats.total_entries + 1,
    current_streak = CASE 
      WHEN user_stats.last_entry_date = CURRENT_DATE - INTERVAL '1 day' THEN user_stats.current_streak + 1
      WHEN user_stats.last_entry_date = CURRENT_DATE THEN user_stats.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_stats.longest_streak,
      CASE 
        WHEN user_stats.last_entry_date = CURRENT_DATE - INTERVAL '1 day' THEN user_stats.current_streak + 1
        WHEN user_stats.last_entry_date = CURRENT_DATE THEN user_stats.current_streak
        ELSE 1
      END
    ),
    last_entry_date = CURRENT_DATE,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for updating stats on new entry
CREATE TRIGGER on_voice_entry_created
  AFTER INSERT ON public.voice_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_on_entry();

-- Function to update events count
CREATE OR REPLACE FUNCTION public.update_user_stats_on_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_events)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    total_events = user_stats.total_events + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for updating stats on new event
CREATE TRIGGER on_diary_event_created
  AFTER INSERT ON public.diary_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_on_event();