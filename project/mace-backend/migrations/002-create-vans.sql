USE mace_tracking;

CREATE TABLE IF NOT EXISTS vans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  state VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  sector VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  vehicle_no VARCHAR(20) UNIQUE NOT NULL,
  registration_number VARCHAR(20) UNIQUE NOT NULL,
  make VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  model_year VARCHAR(10) NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  travels_name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  mobile_no VARCHAR(15) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  rcl_incharge VARCHAR(100) NOT NULL,
  gp_installed ENUM('Yes', 'No') DEFAULT 'No',
  gps_sim_no ENUM('Active', 'Inactive') DEFAULT 'Inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);