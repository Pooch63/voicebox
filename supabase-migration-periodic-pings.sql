-- Migration: Periodic Ping System for Stroke Patients
-- Created: 2026-06-11
-- Adds scheduled check-ins and therapy word management

-- ============================================================================
-- THERAPY_WORD_LISTS TABLE
-- Stores custom therapy words assigned by caregivers to patients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.therapy_word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(caregiver_id) ON DELETE CASCADE,
  words TEXT[] NOT NULL, -- Array of therapy words
  is_active BOOLEAN DEFAULT TRUE, -- Whether this list is currently in use
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapy_words_patient ON public.therapy_word_lists(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_words_caregiver ON public.therapy_word_lists(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_therapy_words_active ON public.therapy_word_lists(is_active);

-- ============================================================================
-- THERAPY_SESSIONS TABLE
-- Tracks individual therapy practice sessions and results
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.therapy_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  word_list_id UUID REFERENCES public.therapy_word_lists(id) ON DELETE SET NULL,
  target_word TEXT NOT NULL,
  transcribed_text TEXT,
  score_data JSONB, -- Store clarity, speed, correctness scores
  completed BOOLEAN DEFAULT FALSE,
  triggered_by TEXT DEFAULT 'manual', -- 'manual', 'scheduled_ping', 'caregiver_request'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_patient ON public.therapy_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_word_list ON public.therapy_sessions(word_list_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_created_at ON public.therapy_sessions(created_at DESC);

-- ============================================================================
-- PATIENT_PING_SCHEDULE TABLE
-- Manages periodic check-in schedules for patients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_ping_schedule (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  ping_type TEXT NOT NULL, -- 'hunger_check', 'therapy_prompt', 'wellness_check'
  frequency_minutes INTEGER NOT NULL DEFAULT 60, -- How often to ping (in minutes)
  active BOOLEAN DEFAULT TRUE,
  last_ping_at TIMESTAMP WITH TIME ZONE,
  next_ping_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ping_schedule_patient ON public.patient_ping_schedule(patient_id);
CREATE INDEX IF NOT EXISTS idx_ping_schedule_next_ping ON public.patient_ping_schedule(next_ping_at);
CREATE INDEX IF NOT EXISTS idx_ping_schedule_active ON public.patient_ping_schedule(active);

-- ============================================================================
-- PING_RESPONSES TABLE
-- Tracks patient responses to periodic pings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ping_responses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.patient_ping_schedule(schedule_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  ping_type TEXT NOT NULL,
  question TEXT NOT NULL,
  response_text TEXT,
  response_audio_url TEXT, -- URL to stored audio if recorded
  therapy_word TEXT, -- If ping_type is therapy_prompt
  therapy_session_id UUID REFERENCES public.therapy_sessions(session_id) ON DELETE SET NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ping_responses_patient ON public.ping_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_ping_responses_schedule ON public.ping_responses(schedule_id);
CREATE INDEX IF NOT EXISTS idx_ping_responses_therapy_session ON public.ping_responses(therapy_session_id);

-- ============================================================================
-- ENABLE REALTIME FOR NEW TABLES
-- Allow caregivers to see updates in real-time
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.therapy_word_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.therapy_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_ping_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ping_responses;

-- ============================================================================
-- HELPER FUNCTION: Calculate next ping time
-- ============================================================================
CREATE OR REPLACE FUNCTION update_next_ping_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active = TRUE THEN
    NEW.next_ping_at := NOW() + (NEW.frequency_minutes || ' minutes')::INTERVAL;
  ELSE
    NEW.next_ping_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic next_ping_at calculation
DROP TRIGGER IF EXISTS trigger_update_next_ping ON public.patient_ping_schedule;
CREATE TRIGGER trigger_update_next_ping
  BEFORE INSERT OR UPDATE OF frequency_minutes, active, last_ping_at
  ON public.patient_ping_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_next_ping_time();
