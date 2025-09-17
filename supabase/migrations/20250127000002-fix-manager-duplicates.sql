-- Исправляем дублирование статусов менеджеров

-- Функция для автоматического удаления принятых приглашений при создании manager_account
CREATE OR REPLACE FUNCTION handle_manager_account_created() 
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем статус соответствующего приглашения на 'accepted' если оно существует
  UPDATE public.manager_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE developer_id = NEW.developer_id 
    AND email = NEW.email 
    AND status = 'pending';
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического обновления статуса приглашения
CREATE TRIGGER on_manager_account_created_update_invitation
  AFTER INSERT ON public.manager_accounts
  FOR EACH ROW
  EXECUTE FUNCTION handle_manager_account_created();

-- Обновляем существующие приглашения, которые уже были приняты
UPDATE public.manager_invitations 
SET status = 'accepted', updated_at = now()
WHERE status = 'pending' 
  AND EXISTS (
    SELECT 1 FROM public.manager_accounts 
    WHERE manager_accounts.developer_id = manager_invitations.developer_id 
      AND manager_accounts.email = manager_invitations.email
  );

-- Функция для очистки истекших приглашений (можно вызывать периодически)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.manager_invitations 
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Добавляем индекс для быстрого поиска активных приглашений
-- Нельзя использовать now() в предикате индекса, т.к. допускаются только IMMUTABLE функции
-- Делаем частичный индекс по статусу и составной ключ для эффективной фильтрации и сортировки
CREATE INDEX IF NOT EXISTS idx_manager_invitations_active 
  ON public.manager_invitations(developer_id, email, status, expires_at) 
  WHERE status = 'pending';
