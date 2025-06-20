USE mace_tracking;

CREATE TABLE IF NOT EXISTS stoppages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  van_id INT NOT NULL,
  vehicle_no VARCHAR(20) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NULL,
  spare_vehicle VARCHAR(20),
  reason TEXT NOT NULL,
  authorized BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  resolved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (van_id) REFERENCES vans(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);