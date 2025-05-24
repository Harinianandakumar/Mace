const { pool } = require('./src/config/database');

async function checkUsers() {
  try {
    // Connect to the database
    await pool.getConnection();
    console.log('Connected to database');
    
    // Query all users
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users');
    
    console.log('Users in database:');
    console.log(rows);
    
    // Check if specific users exist
    const [adminUser] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['admin@mace.com']);
    console.log('Admin user exists:', adminUser.length > 0);
    
    const [driverUser] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['driver@mace.com']);
    console.log('Driver user exists:', driverUser.length > 0);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

checkUsers();