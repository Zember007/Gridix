-- Add parking and commercial options to projects table
ALTER TABLE projects 
ADD COLUMN has_parking BOOLEAN DEFAULT FALSE,
ADD COLUMN has_commercial BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN projects.has_parking IS 'Whether the project includes parking spaces';
COMMENT ON COLUMN projects.has_commercial IS 'Whether the project includes commercial spaces';
