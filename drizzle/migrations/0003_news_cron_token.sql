CREATE TABLE IF NOT EXISTS public.internal_settings (key text PRIMARY KEY, value text NOT NULL);
GRANT ALL ON public.internal_settings TO service_role;
REVOKE ALL ON public.internal_settings FROM anon, authenticated;
ALTER TABLE public.internal_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_settings(key, value) VALUES ('news_cron_token', encode(extensions.gen_random_bytes(32),'hex')) ON CONFLICT (key) DO NOTHING;
DO $$ DECLARE j int; BEGIN
  SELECT jobid INTO j FROM cron.job WHERE jobname='daily-news-refresh';
  IF j IS NOT NULL THEN PERFORM cron.unschedule(j); END IF;
  PERFORM cron.schedule('daily-news-refresh','0 6,12,18 * * *', $c$
select net.http_post(
  url:='https://vbqzsxbfujepnhbawlzj.supabase.co/functions/v1/generate-news',
  headers:=jsonb_build_object('Content-Type','application/json','apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicXpzeGJmdWplcG5oYmF3bHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTA3ODAsImV4cCI6MjA4OTc4Njc4MH0.9DgOuS4KaSfTBbIzxb1bJ1ADUikC-hScv41QSVTAW1I','x-cron-token',(select value from public.internal_settings where key='news_cron_token')),
  body:=jsonb_build_object('time', now())
);
$c$);
END $$;