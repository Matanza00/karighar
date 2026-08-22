-- ============================================================
-- KARIGHAR — patch v3: enable Realtime
-- Run ONCE in the Supabase SQL editor.
-- Without this, live chat, live location tracking, and live status
-- updates won't push to the browser (new tables aren't in the
-- realtime publication by default).
-- ============================================================

do $$ begin
  alter publication supabase_realtime add table jobs;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table job_tracking;
exception when duplicate_object then null; end $$;
