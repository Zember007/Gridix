-- Create storage bucket `project-files` if it doesn't exist
do $$
begin
  if not exists (
    select 1 from storage.buckets where id = 'project-files'
  ) then
    perform storage.create_bucket(
      bucket_id => 'project-files',
      public => true
    );
  end if;
end
$$;

-- Policies: allow public read, authenticated write/update/delete for this bucket
-- Public read (anonymous SELECT) for files in this bucket
do $$
begin
  begin
    create policy "Public read access for project-files"
      on storage.objects
      for select
      to public
      using ( bucket_id = 'project-files' );
  exception when duplicate_object then
    null;
  end;
end
$$;

-- Authenticated users can INSERT (upload) into this bucket
do $$
begin
  begin
    create policy "Authenticated upload to project-files"
      on storage.objects
      for insert
      to authenticated
      with check ( bucket_id = 'project-files' );
  exception when duplicate_object then
    null;
  end;
end
$$;

-- Authenticated users can UPDATE (e.g., replace) objects in this bucket
do $$
begin
  begin
    create policy "Authenticated update project-files"
      on storage.objects
      for update
      to authenticated
      using ( bucket_id = 'project-files' )
      with check ( bucket_id = 'project-files' );
  exception when duplicate_object then
    null;
  end;
end
$$;

-- Authenticated users can DELETE objects in this bucket
do $$
begin
  begin
    create policy "Authenticated delete project-files"
      on storage.objects
      for delete
      to authenticated
      using ( bucket_id = 'project-files' );
  exception when duplicate_object then
    null;
  end;
end
$$;


