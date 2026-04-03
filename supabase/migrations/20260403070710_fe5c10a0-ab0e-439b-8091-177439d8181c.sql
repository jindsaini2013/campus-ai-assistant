
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

CREATE POLICY "Users can upload recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their recordings" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their recordings" ON storage.objects FOR DELETE USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
