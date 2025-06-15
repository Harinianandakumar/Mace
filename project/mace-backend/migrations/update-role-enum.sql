USE mace_tracking_system;

-- Alter the users table to update the role ENUM values
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'manager', 'mace engineer') DEFAULT 'mace engineer';