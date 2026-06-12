-- Migration: Caregiver Notification System
-- Created: 2026-06-11

-- ============================================================================
-- CAREGIVERS TABLE
-- Stores caregiver accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.caregivers (
  caregiver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON public.caregivers(user_id);

-- ============================================================================
-- PATIENT_CAREGIVERS TABLE
-- Links patients with their caregivers (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(caregiver_id) ON DELETE CASCADE,
  relationship TEXT, -- e.g., "spouse", "family", "professional"
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_patient_caregiver UNIQUE(patient_id, caregiver_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_caregivers_patient ON public.patient_caregivers(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_caregivers_caregiver ON public.patient_caregivers(caregiver_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Stores all notification events for caregivers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(caregiver_id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'food_request', 'emergency', 'help_needed', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Store additional context (restaurant info, order details, etc.)
  status TEXT DEFAULT 'pending', -- 'pending', 'acknowledged', 'completed', 'dismissed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_caregiver ON public.notifications(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON public.notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================================
-- ORDERS TABLE
-- Track food orders initiated by patients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregivers(caregiver_id) ON DELETE SET NULL,
  notification_id UUID REFERENCES public.notifications(notification_id) ON DELETE SET NULL,
  restaurant_name TEXT NOT NULL,
  food_name TEXT,
  order_details JSONB DEFAULT '{}', -- Store full order info, restaurant data, etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'ordered', 'delivered', 'cancelled'
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  doordash_order_id TEXT, -- If integrating with DoorDash API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_patient ON public.orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_caregiver ON public.orders(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_notification ON public.orders(notification_id);

-- ============================================================================
-- ENABLE REALTIME FOR NOTIFICATIONS
-- Caregivers can subscribe to get instant notifications
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment to insert test data
-- ============================================================================
-- INSERT INTO public.caregivers (user_id, name, email, phone)
-- VALUES 
--   ('your-auth-user-id', 'Test Caregiver', 'caregiver@example.com', '555-1234');
