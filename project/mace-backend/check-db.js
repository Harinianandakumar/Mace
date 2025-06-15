const { pool } = require('./src/config/database');

async function checkDatabase() {
  try {
    // Connect to the database
    await pool.getConnection();
    console.log('Connected to database');
    
    // Check the users table structure
    const [tableInfo] = await pool.execute('DESCRIBE users');
    console.log('Users table structure:');
    console.table(tableInfo);
    
    // Check all users in the database
    const [users] = await pool.execute('SELECT * FROM users');
    console.log('All users in database:');
    console.table(users);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

checkDatabase();