-- =====================================================
-- SERVICES
-- =====================================================

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

ALTER TABLE public.services
ADD CONSTRAINT services_duration_positive
CHECK (duration_minutes > 0);

-- =====================================================
-- APPOINTMENTS
-- =====================================================

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS starts_at timestamptz;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS ends_at timestamptz;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) NOT NULL DEFAULT 0;

-- Migrar dados existentes

UPDATE public.appointments
SET
  starts_at = scheduled_at,
  ends_at = scheduled_at + interval '1 hour',
  total_amount = COALESCE(amount, 0)
WHERE starts_at IS NULL;

ALTER TABLE public.appointments
ALTER COLUMN starts_at SET NOT NULL;

ALTER TABLE public.appointments
ALTER COLUMN ends_at SET NOT NULL;

-- =====================================================
-- APPOINTMENT SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.appointment_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  appointment_id uuid NOT NULL
    REFERENCES public.appointments(id)
    ON DELETE CASCADE,

  service_id uuid NOT NULL
    REFERENCES public.services(id)
    ON DELETE RESTRICT,

  price numeric(10,2) NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment
ON public.appointment_services(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_services_service
ON public.appointment_services(service_id);

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointment services"
ON public.appointment_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = appointment_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert appointment services"
ON public.appointment_services
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = appointment_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update appointment services"
ON public.appointment_services
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = appointment_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete appointment services"
ON public.appointment_services
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = appointment_id
    AND a.user_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.appointment_services
TO authenticated;

GRANT ALL
ON public.appointment_services
TO service_role;
