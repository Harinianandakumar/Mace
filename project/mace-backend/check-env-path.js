const path = require('path');
const dotenv = require('dotenv');

// Log the current directory
console.log('Current directory:', __dirname);

// Log the path to the .env file
const envPath = path.resolve(__dirname, '.env');
console.log('Path to .env file:', envPath);

// Check if the file exists
const fs = require('fs');
console.log('File exists:', fs.existsSync(envPath));

// Load the .env file
dotenv.config({ path: envPath });

// Log the environment variables
console.log('Environment variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);