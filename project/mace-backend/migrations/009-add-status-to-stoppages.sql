USE mace_tracking_system;

-- Add status column to stoppages table if it doesn't exist
ALTER TABLE stoppages ADD COLUMN IF NOT EXISTS status ENUM('ongoing', 'resolved') DEFAULT 'ongoing';

-- Update existing records: set status to 'resolved' if to_date is not null, otherwise 'ongoing'
UPDATE stoppages SET status = CASE WHEN to_date IS NOT NULL THEN 'resolved' ELSE 'ongoing' END;