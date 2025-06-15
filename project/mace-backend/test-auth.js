const axios = require('axios');

// Test login function
async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'mace.engineer@example.com',  // Replace with a valid email
      password: 'password123'              // Replace with a valid password
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);
    console.log('Token expires at:', new Date(response.data.expiresAt).toLocaleString());
    
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test protected route
async function testProtectedRoute(token) {
  try {
    console.log('\nTesting protected route...');
    const response = await axios.get('http://127.0.0.1:5000/api/stoppages', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Protected route access successful!');
    console.log('Number of stoppages:', response.data.stoppages.length);
  } catch (error) {
    console.error('Protected route access failed:', error.response ? error.response.data : error.message);
  }
}

// Run tests
async function runTests() {
  const token = await testLogin();
  if (token) {
    await testProtectedRoute(token);
  }
}

runTests();