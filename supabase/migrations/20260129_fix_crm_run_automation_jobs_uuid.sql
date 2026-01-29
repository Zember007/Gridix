-- Fix crm automation runner: avoid uuid=text comparisons for pipeline_stage_id
-- Root cause: pipeline_stage_id is uuid in DB, but function compared to text.

create or replace function public.crm_run_automation_jobs(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_processed integer := 0;
  v_failed integer := 0;
  j record;
  t record;
  l record;
  v_target text;
  v_assign_to uuid;
  v_target_stage uuid;
  v_tags_to_add text[];
  v_new_tags text[];
  v_text text;
begin
  for j in
    with cte as (
      select id
      from public.crm_automation_jobs
      where status = 'pending'
        and run_at <= now()
      order by run_at asc
      limit p_limit
      for update skip locked
    )
    update public.crm_automation_jobs q
    set status = 'processing',
        attempts = q.attempts + 1,
        updated_at = now()
    from cte
    where q.id = cte.id
    returning q.*
  loop
    begin
      select id, funnel_id, stage_id, event, icon, title, description, config
      into t
      from public.crm_funnel_triggers
      where id = j.trigger_id;

      if t.id is null then
        raise exception 'Trigger not found: %', j.trigger_id;
      end if;

      select id, apartment_id, pipeline_stage_id, tags, assigned_to_user_id
      into l
      from public.leads
      where id = j.lead_id;

      if l.id is null then
        raise exception 'Lead not found: %', j.lead_id;
      end if;

      -- Execute by action icon
      if t.icon = 'apartment_status' then
        v_target := coalesce(t.config->>'apartmentStatus', 'reserved');
        update public.apartments
        set status = v_target,
            updated_at = now()
        where id = l.apartment_id
          and status is distinct from v_target;

        insert into public.lead_history(lead_id, type, text, user_id)
        values (l.id, 'automation', format('Automation: apartment status -> %s', v_target), null);

      elsif t.icon = 'distribution' then
        v_assign_to := nullif(t.config->>'assignTo','')::uuid;
        if v_assign_to is not null and l.assigned_to_user_id is distinct from v_assign_to then
          update public.leads
          set assigned_to_user_id = v_assign_to,
              updated_at = now()
          where id = l.id;
        end if;

      elsif t.icon = 'add_tag' then
        -- tagsToAdd can be string or array
        if jsonb_typeof(t.config->'tagsToAdd') = 'string' then
          v_tags_to_add := array[trim(both '\"' from (t.config->'tagsToAdd')::text)];
        elsif jsonb_typeof(t.config->'tagsToAdd') = 'array' then
          v_tags_to_add := array(
            select value
            from jsonb_array_elements_text(t.config->'tagsToAdd') as value
          );
        else
          v_tags_to_add := array[]::text[];
        end if;

        if array_length(v_tags_to_add, 1) is not null then
          v_new_tags := (
            select array(
              select distinct tag
              from unnest(coalesce(l.tags, array[]::text[]) || v_tags_to_add) as tag
              where tag is not null and btrim(tag) <> ''
              order by tag
            )
          );

          if v_new_tags is distinct from coalesce(l.tags, array[]::text[]) then
            update public.leads
            set tags = v_new_tags,
                updated_at = now()
            where id = l.id;
          end if;
        end if;

      elsif t.icon = 'status_change' then
        v_target_stage := nullif(t.config->>'targetStageId','')::uuid;
        -- IMPORTANT: pipeline_stage_id is uuid in DB, compare uuid-to-uuid
        if v_target_stage is not null and l.pipeline_stage_id is distinct from v_target_stage then
          update public.leads
          set pipeline_stage_id = v_target_stage,
              updated_at = now()
          where id = l.id;
        end if;

      elsif t.icon = 'task' then
        v_text := coalesce(nullif(t.config->>'taskText',''), nullif(t.description,''), t.title);
        v_assign_to := nullif(t.config->>'assignTo','')::uuid;

        insert into public.lead_tasks(lead_id, text, due_date, due_time, assigned_to_user_id, completed, type)
        values (l.id, v_text, current_date, null, v_assign_to, false, 'other');

        insert into public.lead_history(lead_id, type, text, user_id)
        values (l.id, 'automation', format('Automation: task created (%s)', v_text), null);

      elsif t.icon = 'notification' then
        v_text := coalesce(nullif(t.config->>'notificationText',''), nullif(t.description,''), t.title);
        insert into public.lead_history(lead_id, type, text, user_id)
        values (l.id, 'automation', format('Notification: %s', v_text), null);

      elsif t.icon = 'edit_field' then
        -- Minimal: support notes editing if provided
        if (t.config ? 'notes') then
          update public.leads
          set notes = (t.config->>'notes'),
              updated_at = now()
          where id = l.id;
        else
          insert into public.lead_history(lead_id, type, text, user_id)
          values (l.id, 'automation', 'Automation: edit_field not configured', null);
        end if;

      else
        -- Unknown/unsupported action: no-op but keep audit
        insert into public.lead_history(lead_id, type, text, user_id)
        values (l.id, 'automation', format('Automation: unsupported action icon=%s', t.icon), null);
      end if;

      update public.crm_automation_jobs
      set status = 'done',
          last_error = null,
          updated_at = now()
      where id = j.id;

      insert into public.crm_automation_job_runs(job_id, finished_at, status, error, details)
      values (j.id, now(), 'done', null, jsonb_build_object('trigger_icon', t.icon, 'event', t.event));

      v_processed := v_processed + 1;

    exception when others then
      update public.crm_automation_jobs
      set status = 'failed',
          last_error = sqlerrm,
          updated_at = now()
      where id = j.id;

      insert into public.crm_automation_job_runs(job_id, finished_at, status, error, details)
      values (j.id, now(), 'failed', sqlerrm, jsonb_build_object('sqlstate', sqlstate));

      v_failed := v_failed + 1;
    end;
  end loop;

  return jsonb_build_object(
    'processed', v_processed,
    'failed', v_failed,
    'limit', p_limit,
    'ran_at', now()
  );
end;
$function$;

