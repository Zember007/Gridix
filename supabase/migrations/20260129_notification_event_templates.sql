-- Ensure templates exist for all supported locales without overwriting existing rows.
-- Supported locales in the app: en, ru, ka, he, ar.

-- 1) new_lead_created (already exists in prod as en)
INSERT INTO public.notification_templates (key, channel, locale, subject_template, html_template, is_active)
SELECT
  'new_lead_created',
  'email',
  v.locale,
  v.subject,
  t.html_template,
  t.is_active
FROM (VALUES
  ('ru', 'Новая заявка'),
  ('ka', 'New Lead'),
  ('he', 'New Lead'),
  ('ar', 'New Lead')
) AS v(locale, subject)
JOIN public.notification_templates t
  ON t.key = 'new_lead_created' AND t.channel = 'email' AND t.locale = 'en'
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_templates x
  WHERE x.key = 'new_lead_created' AND x.channel = 'email' AND x.locale = v.locale
);

-- 2) subscription_payment_success (already exists in prod as en)
INSERT INTO public.notification_templates (key, channel, locale, subject_template, html_template, is_active)
SELECT
  'subscription_payment_success',
  'email',
  v.locale,
  v.subject,
  t.html_template,
  t.is_active
FROM (VALUES
  ('ru', 'Оплата прошла успешно'),
  ('ka', 'Payment Successful'),
  ('he', 'Payment Successful'),
  ('ar', 'Payment Successful')
) AS v(locale, subject)
JOIN public.notification_templates t
  ON t.key = 'subscription_payment_success' AND t.channel = 'email' AND t.locale = 'en'
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_templates x
  WHERE x.key = 'subscription_payment_success' AND x.channel = 'email' AND x.locale = v.locale
);

-- 3) task_due_digest (new key for task reminders)
INSERT INTO public.notification_templates (key, channel, locale, subject_template, html_template, is_active)
SELECT
  'task_due_digest',
  'email',
  v.locale,
  v.subject,
  v.html,
  true
FROM (VALUES
  ('en', 'Tasks: upcoming & overdue ({{tasks.count}})',
   '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Tasks</h2>
      <p><strong>Total:</strong> {{tasks.count}}</p>
      <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f6f8fa; padding: 12px; border-radius: 8px;">{{{tasks.summary}}}</pre>
      <p>Open Gridix: <a href="{{{app.url}}}">{{{app.url}}}</a></p>
    </body></html>'),
  ('ru', 'Задачи: предстоящие и просроченные ({{tasks.count}})',
   '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Задачи</h2>
      <p><strong>Всего:</strong> {{tasks.count}}</p>
      <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f6f8fa; padding: 12px; border-radius: 8px;">{{{tasks.summary}}}</pre>
      <p>Открыть Gridix: <a href="{{{app.url}}}">{{{app.url}}}</a></p>
    </body></html>'),
  ('ka', 'Tasks: upcoming & overdue ({{tasks.count}})',
   '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Tasks</h2>
      <p><strong>Total:</strong> {{tasks.count}}</p>
      <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f6f8fa; padding: 12px; border-radius: 8px;">{{{tasks.summary}}}</pre>
      <p>Open Gridix: <a href="{{{app.url}}}">{{{app.url}}}</a></p>
    </body></html>'),
  ('he', 'Tasks: upcoming & overdue ({{tasks.count}})',
   '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Tasks</h2>
      <p><strong>Total:</strong> {{tasks.count}}</p>
      <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f6f8fa; padding: 12px; border-radius: 8px;">{{{tasks.summary}}}</pre>
      <p>Open Gridix: <a href="{{{app.url}}}">{{{app.url}}}</a></p>
    </body></html>'),
  ('ar', 'Tasks: upcoming & overdue ({{tasks.count}})',
   '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Tasks</h2>
      <p><strong>Total:</strong> {{tasks.count}}</p>
      <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f6f8fa; padding: 12px; border-radius: 8px;">{{{tasks.summary}}}</pre>
      <p>Open Gridix: <a href="{{{app.url}}}">{{{app.url}}}</a></p>
    </body></html>')
) AS v(locale, subject, html)
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_templates x
  WHERE x.key = 'task_due_digest' AND x.channel = 'email' AND x.locale = v.locale
);

-- NOTE: system updates are not wired yet; keeping user preference `notify_system_update` for future.

