DB_PASSWORD=
OLD_PROJECT_REF=owilwkmenbrcinfwuvyx
NEW_PROJECT_REF=ebonmrtmfopohayxfvdy

pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=custom \
  --dbname="postgresql://postgres:<pass>@db.owilwkmenbrcinfwuvyx.supabase.co:5432/postgres" \
  -f supabase_backup.dump


pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname="postgresql://postgres:<pass>@db.ebonmrtmfopohayxfvdy.supabase.co:5432/postgres" \
  supabase_backup.dump


  pg_dump \
  --host=db.owilwkmenbrcinfwuvyx.supabase.co \
  --port=5432 \
  --username=postgres \
  --schema=auth \
  --format=custom \
  --no-owner \
  --no-privileges \
  -f auth.dump \
  postgres

  pg_restore \
  --host=db.ebonmrtmfopohayxfvdy.supabase.co \
  --port=5432 \
  --username=postgres \
  --schema=auth \
  --no-owner \
  --dbname=postgres \
  auth.dump
