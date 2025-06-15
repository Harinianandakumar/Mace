const { pool } = require('../config/database');

class Van {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM vans ORDER BY created_at DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM vans WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  }

  static async create(vanData) {
    const {
      state, region, zone, sector, city, vehicle_no, registration_number,
      make, type, model_year, contract_type, owner_name, travels_name,
      address, driver_name, mobile_no, valid_from, valid_to, rcl_incharge,
      gp_installed, gps_sim_no
    } = vanData;

    const [result] = await pool.execute(
      `INSERT INTO vans (
        state, region, zone, sector, city, vehicle_no, registration_number,
        make, type, model_year, contract_type, owner_name, travels_name,
        address, driver_name, mobile_no, valid_from, valid_to, rcl_incharge,
        gp_installed, gps_sim_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        state, region, zone, sector, city, vehicle_no, registration_number,
        make, type, model_year, contract_type, owner_name, travels_name,
        address, driver_name, mobile_no, valid_from, valid_to, rcl_incharge,
        gp_installed, gps_sim_no
      ]
    );

    return result.insertId;
  }

  static async update(id, updates) {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const [result] = await pool.execute(
      `UPDATE vans SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM vans WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = Van;