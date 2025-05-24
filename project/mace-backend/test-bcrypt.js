const bcrypt = require('bcryptjs');

// The hashed password from the migration file
const hashedPassword = '$2b$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG';
const plainPassword = 'password';

// Test if the password matches the hash
async function testPassword() {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`Password match result: ${isMatch}`);
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(plainPassword, 10);
    console.log(`New hash generated: ${newHash}`);
    
    // Compare with the new hash
    const isNewMatch = await bcrypt.compare(plainPassword, newHash);
    console.log(`New hash match result: ${isNewMatch}`);
  } catch (error) {
    console.error('Error testing password:', error);
  }
}

testPassword();