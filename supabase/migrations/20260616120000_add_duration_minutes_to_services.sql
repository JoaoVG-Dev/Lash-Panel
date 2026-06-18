ALTER TABLE public.services
ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60;

COMMENT ON COLUMN public.services.duration_minutes IS
'Duração do serviço em minutos utilizada para cálculo da agenda visual';