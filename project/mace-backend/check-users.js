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
    const [sectorHeadUser] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['mace_sector_head@gmail.com']);
    console.log('Mace Sector Head user exists:', sectorHeadUser.length > 0);
    
    const [maceEngineerUser] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['mace_engineer@mace.com']);
    console.log('Mace Engineer user exists:', maceEngineerUser.length > 0);
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

checkUsers();