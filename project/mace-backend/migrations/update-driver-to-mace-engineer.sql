USE mace_tracking_system;

-- Update the user name, role, and email for the driver user
UPDATE users 
SET name = 'Mace Engineer', role = 'mace engineer', email = 'mace_engineer@mace.com' 
WHERE email = 'driver@mace.com';