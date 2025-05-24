const { pool } = require('../config/database');

const getAllVans = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vans ORDER BY created_at DESC'
    );
    res.json({ vans: rows });
  } catch (error) {
    console.error('Get vans error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM vans WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Van not found' });
    }
    
    res.json({ van: rows[0] });
  } catch (error) {
    console.error('Get van error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createVan = async (req, res) => {
  try {
    const {
      state, region, zone, sector, city, vehicle_no, registration_number,
      make, type, model_year, contract_type, owner_name, travels_name,
      address, driver_name, mobile_no, valid_from, valid_to, rcl_incharge,
      gp_installed, gps_sim_no
    } = req.body;

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

    const [newVan] = await pool.execute(
      'SELECT * FROM vans WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Van created successfully', van: newVan[0] });
  } catch (error) {
    console.error('Create van error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateVan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await pool.execute(
      `UPDATE vans SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    const [updatedVan] = await pool.execute(
      'SELECT * FROM vans WHERE id = ?',
      [id]
    );
    
    if (updatedVan.length === 0) {
      return res.status(404).json({ message: 'Van not found' });
    }
    
    res.json({ message: 'Van updated successfully', van: updatedVan[0] });
  } catch (error) {
    console.error('Update van error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteVan = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM vans WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Van not found' });
    }
    
    res.json({ message: 'Van deleted successfully' });
  } catch (error) {
    console.error('Delete van error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllVans, getVanById, createVan, updateVan, deleteVan };