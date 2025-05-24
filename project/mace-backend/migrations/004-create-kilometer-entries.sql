USE mace_tracking;

CREATE TABLE IF NOT EXISTS kilometer_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  van_id INT NOT NULL,
  vehicle_no VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  start_reading INT NOT NULL,
  end_reading INT NOT NULL,
  day_km INT GENERATED ALWAYS AS (end_reading - start_reading) STORED,
  authorized BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (van_id) REFERENCES vans(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);