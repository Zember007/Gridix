-- Add table for storing AmoCRM custom fields
CREATE TABLE IF NOT EXISTS amocrm_custom_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    field_code TEXT,
    field_type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
    sort INTEGER DEFAULT 0,
    entity_type TEXT NOT NULL, -- 'leads', 'contacts', 'companies'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, field_id, entity_type)
);

-- Add RLS policies
ALTER TABLE amocrm_custom_fields ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read custom fields for their projects
CREATE POLICY "Users can view amocrm custom fields for their projects" ON amocrm_custom_fields
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid() 
            OR id IN (
                SELECT project_id FROM manager_accounts 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for project owners and managers to manage custom fields
CREATE POLICY "Users can manage amocrm custom fields for their projects" ON amocrm_custom_fields
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE user_id = auth.uid() 
            OR id IN (
                SELECT project_id FROM manager_accounts 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Add index for better performance
CREATE INDEX idx_amocrm_custom_fields_project_id ON amocrm_custom_fields(project_id);
CREATE INDEX idx_amocrm_custom_fields_entity_type ON amocrm_custom_fields(entity_type);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_amocrm_custom_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_amocrm_custom_fields_updated_at
    BEFORE UPDATE ON amocrm_custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_amocrm_custom_fields_updated_at();
