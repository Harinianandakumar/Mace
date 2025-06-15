const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(migrationFileName) {
  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mace_tracking',
    multipleStatements: true
  });

  try {
    console.log('Connected to MySQL server');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFileName);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`Running migration: ${migrationFileName}...`);
    await connection.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('Connection closed');
  }
}

// Run the migration to add status column
runMigration('009-add-status-to-stoppages.sql')
  .then(() => {
    console.log('All migrations completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });