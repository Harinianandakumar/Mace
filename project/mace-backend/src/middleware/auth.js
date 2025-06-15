const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token:', token ? 'Token exists' : 'No token');

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'no_token',
        redirectTo: '/login'
      });
    }

    // Use a default secret if the environment variable is not set
    const jwtSecret = process.env.JWT_SECRET || 'mace_super_secret_jwt_key_2024_very_secure';
    console.log('Using JWT secret for verification:', jwtSecret ? 'Secret exists' : 'No secret');
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Decoded token:', decoded);
      
      // Check if token is about to expire (less than 1 day left)
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExpiresIn = decoded.exp - currentTime;
      console.log('Token expires in (seconds):', tokenExpiresIn);
      
      const [rows] = await pool.execute(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [decoded.userId]
      );
      console.log('User from database:', rows[0]);

      if (rows.length === 0) {
        return res.status(401).json({ 
          message: 'Invalid token - user not found',
          error: 'invalid_user',
          redirectTo: '/login'
        });
      }

      req.user = rows[0];
      console.log('User set in request:', req.user);
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      // Provide more specific error messages
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Your session has expired. Please log in again.',
          error: 'token_expired',
          redirectTo: '/login'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid authentication token',
          error: 'invalid_token',
          redirectTo: '/login'
        });
      }
      
      return res.status(403).json({ 
        message: 'Invalid token format or signature',
        error: 'token_error',
        redirectTo: '/login'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ 
      message: 'Invalid or expired token',
      error: 'auth_error',
      redirectTo: '/login'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('User role:', req.user?.role);
    console.log('Allowed roles:', roles);
    console.log('Role check result:', roles.includes(req.user?.role));
    
    // Enable proper role checking
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('Access denied: User role not in allowed roles');
      return res.status(403).json({ 
        message: 'Access denied. Your role does not have permission to perform this action.',
        userRole: req.user?.role,
        allowedRoles: roles
      });
    }
    
    console.log('Role check passed, proceeding to next middleware');
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };