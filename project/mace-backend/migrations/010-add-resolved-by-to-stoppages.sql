USE mace_tracking_system;

-- Add resolved_by column to stoppages table if it doesn't exist
ALTER TABLE stoppages ADD COLUMN IF NOT EXISTS resolved_by INT NULL;

-- Add foreign key constraint if it doesn't exist
-- First check if the constraint already exists
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'mace_tracking_system'
    AND TABLE_NAME = 'stoppages'
    AND COLUMN_NAME = 'resolved_by'
    AND REFERENCED_TABLE_NAME = 'users'
);

-- Add the constraint only if it doesn't exist
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE stoppages ADD CONSTRAINT fk_stoppages_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id)',
    'SELECT "Foreign key constraint already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;