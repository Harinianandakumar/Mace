const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function updateAdminRole() {
  try {
    // Connect to the database
    await pool.getConnection();
    console.log('Connected to database');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'update-admin-to-sector-head.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL commands
    const queries = sql.split(';').filter(query => query.trim() !== '');
    
    for (const query of queries) {
      await pool.query(query);
      console.log('Executed query:', query);
    }
    
    console.log('Role ENUM and admin user updated successfully');
    
    // Verify the update
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['admin@mace.com']);
    console.log('Updated user:', rows[0]);
    
  } catch (error) {
    console.error('Error updating admin role:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

updateAdminRole();