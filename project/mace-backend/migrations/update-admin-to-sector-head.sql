USE mace_tracking_system;

-- Alter the users table to update the role ENUM values
ALTER TABLE users 
MODIFY COLUMN role ENUM('mace sector head', 'manager', 'mace engineer') DEFAULT 'mace engineer';

-- Update the admin user to mace sector head
UPDATE users 
SET name = 'Mace Sector Head', role = 'mace sector head' 
WHERE email = 'admin@mace.com';