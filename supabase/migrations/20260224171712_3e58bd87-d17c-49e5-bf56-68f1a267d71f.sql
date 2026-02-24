
-- Create rooms table for WebRTC signaling
CREATE TABLE public.rooms (
  code TEXT PRIMARY KEY,
  offer JSONB,
  answer JSONB,
  sender_candidates JSONB DEFAULT '[]'::jsonb,
  receiver_candidates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS - ephemeral public data identified by random room codes
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write rooms (ephemeral signaling data)
CREATE POLICY "Anyone can read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete rooms" ON public.rooms FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Auto-delete rooms older than 2 hours via a cron-like trigger
CREATE OR REPLACE FUNCTION public.cleanup_expired_rooms()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.rooms WHERE created_at < now() - interval '2 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER cleanup_rooms_on_insert
AFTER INSERT ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_expired_rooms();
