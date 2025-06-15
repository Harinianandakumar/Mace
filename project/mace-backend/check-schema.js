const { pool } = require('./src/config/database');

async function checkStoppagesTable() {
  try {
    console.log('Checking stoppages table structure...');
    
    // Get table columns
    const [columns] = await pool.execute('SHOW COLUMNS FROM stoppages');
    console.log('Stoppages table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Check if status column exists
    const statusColumn = columns.find(col => col.Field === 'status');
    if (statusColumn) {
      console.log('\nStatus column details:', statusColumn);
    } else {
      console.log('\nWARNING: status column does not exist in the stoppages table!');
    }
    
    // Check for any sample data
    const [sampleData] = await pool.execute('SELECT * FROM stoppages LIMIT 1');
    if (sampleData.length > 0) {
      console.log('\nSample data from stoppages table:');
      console.log(sampleData[0]);
    } else {
      console.log('\nNo data found in stoppages table');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking stoppages table:', err);
    process.exit(1);
  }
}

checkStoppagesTable();