const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigrations() {
  // First, connect without specifying a database
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Youar3speci4l',
    multipleStatements: true // Enable multiple SQL statements in a single query
  });

  // Create the database if it doesn't exist
  const dbName = process.env.DB_NAME || 'mace_tracking_system';
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
  
  // Close the initial connection
  await connection.end();
  
  // Reconnect with the database specified
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Youar3speci4l',
    database: dbName,
    multipleStatements: true // Enable multiple SQL statements in a single query
  });

  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      // Split the SQL into individual statements and execute them one by one
      // First, remove the database creation and use statements since we're already connected
      let sqlContent = sql.replace(/CREATE DATABASE.*?;/g, '')
                         .replace(/USE.*?;/g, '');
      
      // Split by semicolon and filter out empty statements
      const statements = sqlContent.split(';')
                                  .map(stmt => stmt.trim())
                                  .filter(stmt => stmt.length > 0);
      
      // Execute each statement separately
      for (const statement of statements) {
        // Skip comments-only statements
        if (statement.startsWith('--') || statement === '') continue;
        
        try {
          await connection.execute(statement + ';');
        } catch (error) {
          console.error(`Error executing statement: ${statement}`);
          throw error;
        }
      }
      console.log(`Completed migration: ${file}`);
    }
  }

  await connection.end();
  console.log('All migrations completed!');
}

runMigrations().catch(console.error);