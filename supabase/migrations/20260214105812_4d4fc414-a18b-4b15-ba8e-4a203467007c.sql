
-- Add reminder_minutes column to diary_events (default 60 = 1 hour before)
ALTER TABLE public.diary_events ADD COLUMN reminder_minutes integer NOT NULL DEFAULT 60;
