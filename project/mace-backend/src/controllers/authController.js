const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`Login attempt for email: ${email}`);

    // Find user by email
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'user_not_found'
      });
    }

    const user = rows[0];
    console.log(`User found: ${user.email}, role: ${user.role}`);

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`Password validation result: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'invalid_password'
      });
    }

    // Generate JWT token
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Secret exists' : 'No secret');
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
    
    // Use a default secret if the environment variable is not set
    const jwtSecret = process.env.JWT_SECRET || 'mace_super_secret_jwt_key_2024_very_secure';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!process.env.JWT_SECRET) {
      console.log('Using default JWT secret');
    }
    
    // Log the payload for debugging
    const payload = { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    console.log('JWT payload:', payload);
    
    const token = jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: expiresIn }
    );
    
    // Log token info for debugging
    const decoded = jwt.decode(token);
    console.log('Token expiration:', new Date(decoded.exp * 1000).toISOString());
    console.log('Token issued at:', new Date(decoded.iat * 1000).toISOString());

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    console.log(`Login successful for user: ${email}`);
    
    // Format the response to match what the frontend expects
    const response = {
      message: 'Login successful',
      token,
      user: {
        id: userWithoutPassword.id.toString(),
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role
      },
      expiresAt: decoded.exp * 1000 // Convert to milliseconds for frontend
    };
    
    console.log('Response being sent:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'driver' } = req.body;

    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // Get the created user
    const [newUser] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    // Format the user object to match what the frontend expects
    const user = {
      id: req.user.id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    };
    
    console.log('Profile response being sent:', JSON.stringify(user, null, 2));
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { login, register, getProfile };