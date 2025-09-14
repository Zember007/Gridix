-- Добавляем поля для настроек рассрочки в таблицу projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS installment_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_down_payment_percent INTEGER DEFAULT 20 CHECK (min_down_payment_percent >= 0 AND min_down_payment_percent <= 100),
ADD COLUMN IF NOT EXISTS max_installment_months INTEGER DEFAULT 24 CHECK (max_installment_months > 0);

-- Добавляем комментарии для документации
COMMENT ON COLUMN projects.installment_enabled IS 'Whether installment payments are enabled for this project';
COMMENT ON COLUMN projects.min_down_payment_percent IS 'Minimum down payment percentage required (0-100)';
COMMENT ON COLUMN projects.max_installment_months IS 'Maximum number of months for installment payments';
