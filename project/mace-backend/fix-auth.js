const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function fixUserAuthentication() {
  try {
    console.log('Connecting to database...');
    
    // Check if the mace engineer user exists
    const [engineerUsers] = await pool.execute(
      'SELECT * FROM users WHERE role = ?',
      ['mace engineer']
    );
    
    console.log(`Found ${engineerUsers.length} mace engineer users`);
    
    if (engineerUsers.length === 0) {
      console.log('No mace engineer users found. Creating one...');
      
      // Create a new mace engineer user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Mace Engineer', 'mace_engineer@mace.com', hashedPassword, 'mace engineer']
      );
      
      console.log('Created new mace engineer user:');
      console.log('Email: mace_engineer@mace.com');
      console.log('Password: password123');
    } else {
      // Reset the password for the first mace engineer user
      const user = engineerUsers[0];
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`Reset password for user: ${user.email}`);
      console.log('New password: password123');
    }
    
    // Check if the mace sector head user exists
    const [sectorHeadUsers] = await pool.execute(
      'SELECT * FROM users WHERE role = ?',
      ['mace sector head']
    );
    
    console.log(`Found ${sectorHeadUsers.length} mace sector head users`);
    
    if (sectorHeadUsers.length === 0) {
      console.log('No mace sector head users found. Creating one...');
      
      // Create a new mace sector head user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Mace Sector Head', 'mace_sector_head@gmail.com', hashedPassword, 'mace sector head']
      );
      
      console.log('Created new mace sector head user:');
      console.log('Email: mace_sector_head@gmail.com');
      console.log('Password: password123');
    } else {
      // Reset the password for the first mace sector head user
      const user = sectorHeadUsers[0];
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`Reset password for user: ${user.email}`);
      console.log('New password: password123');
    }
    
    console.log('\nAuthentication fix complete!');
    console.log('You can now log in with the mace engineer account.');
    
    // Close the database connection
    await pool.end();
    
  } catch (error) {
    console.error('Error fixing authentication:', error);
  }
}

fixUserAuthentication();