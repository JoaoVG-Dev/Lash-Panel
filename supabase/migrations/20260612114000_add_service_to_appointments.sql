ALTER TABLE public.appointments
  ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN amount numeric(10,2);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_amount_nonnegative
  CHECK (amount IS NULL OR amount >= 0);

CREATE INDEX idx_appointments_service_id ON public.appointments(service_id);
