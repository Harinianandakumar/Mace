const { pool } = require('./src/config/database');

async function addAdminUser() {
  try {
    // Connect to the database
    await pool.getConnection();
    console.log('Connected to database');
    
    // Check if admin user already exists
    const [existingAdmin] = await pool.execute('SELECT id FROM users WHERE email = ?', ['admin@mace.com']);
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists, no need to create');
      return;
    }
    
    // Admin user doesn't exist, create it
    // The password is 'password', same as in the migration file
    const hashedPassword = '$2b$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG';
    
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@mace.com', hashedPassword, 'admin']
    );
    
    console.log('Admin user created successfully:', result.insertId);
    
    // Verify the user was created
    const [adminUser] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['admin@mace.com']);
    console.log('Admin user exists:', adminUser.length > 0);
    
  } catch (error) {
    console.error('Error adding admin user:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

addAdminUser();