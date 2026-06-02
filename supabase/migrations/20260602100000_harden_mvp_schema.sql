DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_quantity_nonnegative'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_quantity_nonnegative
      CHECK (quantity >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_alert_quantity_nonnegative'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_alert_quantity_nonnegative
      CHECK (alert_quantity IS NULL OR alert_quantity >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_technical_records_procedure_type_check'
  ) THEN
    ALTER TABLE public.client_technical_records
      ADD CONSTRAINT client_technical_records_procedure_type_check
      CHECK (procedure_type IN ('colocacao', 'manutencao'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_technical_records_maintenance_days_positive'
  ) THEN
    ALTER TABLE public.client_technical_records
      ADD CONSTRAINT client_technical_records_maintenance_days_positive
      CHECK (maintenance_days > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_appointment_type_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_appointment_type_check
      CHECK (appointment_type IN ('colocacao', 'manutencao', 'retorno', 'avaliacao', 'outro'));
  END IF;
END $$;

ALTER TABLE public.whatsapp_message_logs
  DROP CONSTRAINT IF EXISTS whatsapp_message_logs_status_check;

ALTER TABLE public.whatsapp_message_logs
  ADD CONSTRAINT whatsapp_message_logs_status_check
  CHECK (status IN ('pending', 'manual_opened', 'sent', 'failed', 'canceled'));

ALTER TABLE public.user_settings
  ALTER COLUMN default_whatsapp_message
  SET DEFAULT 'Oi, {nome}! Sua manutenção de cílios está chegando. Quer agendar?',
  ALTER COLUMN cancellation_message
  SET DEFAULT 'Oi, {nome}! Preciso cancelar seu atendimento. Podemos remarcar?',
  ALTER COLUMN schedule_reminder_message
  SET DEFAULT 'Oi, {nome}! Já está na hora de agendar sua manutenção de cílios.';

UPDATE public.user_settings
SET
  default_whatsapp_message = 'Oi, {nome}! Sua manutenção de cílios está chegando. Quer agendar?'
WHERE default_whatsapp_message NOT LIKE '%{nome}%'
  AND default_whatsapp_message LIKE 'Oi! Sua manuten%'
  AND default_whatsapp_message LIKE '%agendar%';

UPDATE public.user_settings
SET
  cancellation_message = 'Oi, {nome}! Preciso cancelar seu atendimento. Podemos remarcar?'
WHERE cancellation_message IN (
  'Oi! Preciso cancelar seu atendimento. Podemos remarcar?'
);

UPDATE public.user_settings
SET
  schedule_reminder_message = 'Oi, {nome}! Já está na hora de agendar sua manutenção de cílios.'
WHERE schedule_reminder_message NOT LIKE '%{nome}%'
  AND schedule_reminder_message LIKE 'Oi! J%'
  AND schedule_reminder_message LIKE '%agendar%';
