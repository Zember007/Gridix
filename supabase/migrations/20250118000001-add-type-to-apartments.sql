-- Create apartment type enum
CREATE TYPE apartment_type AS ENUM ('apartment', 'commercial', 'parking');

-- Add type column to apartments table  
ALTER TABLE apartments 
ADD COLUMN type apartment_type DEFAULT 'apartment';

-- Add index for better performance on type filtering
CREATE INDEX idx_apartments_type ON apartments(type);

-- Add index for project_id + type combination
CREATE INDEX idx_apartments_project_type ON apartments(project_id, type);

-- Add comment for documentation
COMMENT ON COLUMN apartments.type IS 'Type of the unit: apartment, commercial, or parking';
