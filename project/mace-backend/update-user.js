const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function updateUser() {
  try {
    // Connect to the database
    await pool.getConnection();
    console.log('Connected to database');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'update-driver-to-mace-engineer.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL commands
    const queries = sql.split(';').filter(query => query.trim() !== '');
    
    for (const query of queries) {
      await pool.query(query);
      console.log('Executed query:', query);
    }
    
    console.log('User updated successfully');
    
    // Verify the update
    const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE email = ?', ['mace_engineer@mace.com']);
    console.log('Updated user:', rows[0]);
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

updateUser();