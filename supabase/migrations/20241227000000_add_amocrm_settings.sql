-- Add AmoCRM settings table
CREATE TABLE amocrm_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  pipeline_id INTEGER NOT NULL,
  status_id INTEGER,
  responsible_user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to ensure one AmoCRM setting per project
CREATE UNIQUE INDEX idx_amocrm_settings_project_id ON amocrm_settings(project_id);

-- Enable RLS
ALTER TABLE amocrm_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for AmoCRM settings
CREATE POLICY "Users can view their own AmoCRM settings" ON amocrm_settings
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AmoCRM settings for their projects" ON amocrm_settings
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own AmoCRM settings" ON amocrm_settings
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own AmoCRM settings" ON amocrm_settings
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_amocrm_settings_updated_at 
  BEFORE UPDATE ON amocrm_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
