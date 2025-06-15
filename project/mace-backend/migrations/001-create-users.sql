CREATE DATABASE IF NOT EXISTS mace_tracking_system;
USE mace_tracking_system;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('mace sector head', 'manager', 'mace engineer') DEFAULT 'mace engineer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default users (password is 'password' for both)
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Mace Sector Head', 'mace_sector_head@gmail.com', '$2b$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'mace sector head');

INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Mace Engineer', 'mace_engineer@mace.com', '$2b$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'mace engineer');