ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS professional_name text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS business_description text,
  ADD COLUMN IF NOT EXISTS working_days text[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  ADD COLUMN IF NOT EXISTS opening_time time NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS closing_time time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS appointment_confirmation_message text NOT NULL DEFAULT 'Oi, {nome}! Seu atendimento com {profissional} está confirmado para {data} às {horario}.',
  ADD COLUMN IF NOT EXISTS anamnesis_link_message text NOT NULL DEFAULT 'Oi, {nome}! Antes do atendimento, preencha sua anamnese por este link: {link_anamnese}';

ALTER TABLE public.user_settings
  ALTER COLUMN default_whatsapp_message
  SET DEFAULT 'Oi, {nome}! Sua manutenção de cílios está chegando. Quer agendar?',
  ALTER COLUMN cancellation_message
  SET DEFAULT 'Oi, {nome}! Preciso cancelar seu atendimento. Podemos remarcar?',
  ALTER COLUMN schedule_reminder_message
  SET DEFAULT 'Oi, {nome}! Já está na hora de agendar sua manutenção de cílios.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_working_days_check'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_working_days_check
      CHECK (
        working_days <@ ARRAY[
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday'
        ]
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_business_hours_check'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_business_hours_check
      CHECK (opening_time < closing_time);
  END IF;
END $$;
