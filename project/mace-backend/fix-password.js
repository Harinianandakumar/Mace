const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function fixPassword() {
  try {
    // Connect to the database
    await pool.getConnection();
    console.log('Connected to database');
    
    // Get the driver user
    const [rows] = await pool.execute('SELECT id, email, password FROM users WHERE email = ?', ['driver@mace.com']);
    
    if (rows.length === 0) {
      console.log('Driver user not found');
      return;
    }
    
    const user = rows[0];
    console.log(`Found user: ${user.email}`);
    console.log(`Current password hash: ${user.password}`);
    
    // Test the current password
    const plainPassword = 'password';
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    console.log(`Current password verification: ${isMatch}`);
    
    if (!isMatch) {
      // Generate a new hash
      const newHash = await bcrypt.hash(plainPassword, 10);
      console.log(`New hash generated: ${newHash}`);
      
      // Update the password in the database
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [newHash, user.id]
      );
      
      console.log('Password updated successfully');
      
      // Verify the new password
      const [updatedUser] = await pool.execute('SELECT password FROM users WHERE id = ?', [user.id]);
      const verifyNew = await bcrypt.compare(plainPassword, updatedUser[0].password);
      console.log(`New password verification: ${verifyNew}`);
    } else {
      console.log('Password is already correct, no update needed');
    }
  } catch (error) {
    console.error('Error fixing password:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

fixPassword();