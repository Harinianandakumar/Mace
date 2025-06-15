USE mace_tracking_system;

-- Update the admin user email
UPDATE users 
SET email = 'mace_sector_head@gmail.com' 
WHERE email = 'admin@mace.com';