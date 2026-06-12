import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Client-side Supabase client (for browser usage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on your schema
export type User = {
  user_id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  year_of_stroke: number | null;
  other_info: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Caregiver = {
  caregiver_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientCaregiver = {
  id: string;
  patient_id: string;
  caregiver_id: string;
  relationship: string | null;
  is_primary: boolean;
  created_at: string;
};

export type Notification = {
  notification_id: string;
  patient_id: string;
  caregiver_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  status: 'pending' | 'acknowledged' | 'completed' | 'dismissed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  acknowledged_at: string | null;
  completed_at: string | null;
};

export type Order = {
  order_id: string;
  patient_id: string;
  caregiver_id: string | null;
  notification_id: string | null;
  restaurant_name: string;
  food_name: string | null;
  order_details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled';
  estimated_delivery: string | null;
};

export type TherapyWordList = {
  id: string;
  patient_id: string;
  caregiver_id: string;
  words: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TherapySession = {
  session_id: string;
  patient_id: string;
  word_list_id: string | null;
  target_word: string;
  transcribed_text: string | null;
  score_data: Record<string, unknown> | null;
  completed: boolean;
  triggered_by: 'manual' | 'scheduled_ping' | 'caregiver_request';
  created_at: string;
  completed_at: string | null;
};

export type PatientPingSchedule = {
  schedule_id: string;
  patient_id: string;
  ping_type: 'hunger_check' | 'therapy_prompt' | 'wellness_check';
  frequency_minutes: number;
  active: boolean;
  last_ping_at: string | null;
  next_ping_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PingResponse = {
  response_id: string;
  schedule_id: string;
  patient_id: string;
  ping_type: string;
  question: string;
  response_text: string | null;
  response_audio_url: string | null;
  therapy_word: string | null;
  therapy_session_id: string | null;
  responded_at: string | null;
  created_at: string;
  doordash_order_id: string | null;
  created_at: string;
  updated_at: string;
};

export default supabase;
