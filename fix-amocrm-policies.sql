-- Fix AmoCRM custom fields policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view amocrm custom fields for their projects" ON amocrm_custom_fields;
DROP POLICY IF EXISTS "Users can manage amocrm custom fields for their projects" ON amocrm_custom_fields;

-- Create corrected policies
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
