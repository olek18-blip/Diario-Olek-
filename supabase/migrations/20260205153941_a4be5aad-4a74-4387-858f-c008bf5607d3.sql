-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-notes', 'voice-notes', false);

-- Storage policies
CREATE POLICY "Users can upload their own voice notes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own voice notes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice notes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);