DB_PASSWORD=ZyTQBhu294%40W8ii 
OLD_PROJECT_REF=owilwkmenbrcinfwuvyx
NEW_PROJECT_REF=ebonmrtmfopohayxfvdy

pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=custom \
  --dbname="postgresql://postgres:ZyTQBhu294%40W8ii@db.owilwkmenbrcinfwuvyx.supabase.co:5432/postgres" \
  -f supabase_backup.dump


pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname="postgresql://postgres:ZyTQBhu294%40W8ii@db.ebonmrtmfopohayxfvdy.supabase.co:5432/postgres" \
  supabase_backup.dump
