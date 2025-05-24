const { pool } = require('../config/database');

const getAllStoppages = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.*, v.registration_number, u.name as created_by_name
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.from_date DESC, s.created_at DESC
    `);
    res.json({ stoppages: rows });
  } catch (error) {
    console.error('Get stoppages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getStoppagesByVan = async (req, res) => {
  try {
    const { vanId } = req.params;
    const [rows] = await pool.execute(`
      SELECT s.*, v.registration_number, u.name as created_by_name
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.van_id = ?
      ORDER BY s.from_date DESC, s.created_at DESC
    `, [vanId]);
    
    res.json({ stoppages: rows });
  } catch (error) {
    console.error('Get van stoppages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createStoppage = async (req, res) => {
  try {
    const { van_id, vehicle_no, from_date, to_date, spare_vehicle, reason } = req.body;
    const created_by = req.user.id;

    // Validate dates
    if (to_date && new Date(to_date) < new Date(from_date)) {
      return res.status(400).json({ 
        message: 'To date cannot be earlier than from date' 
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO stoppages 
       (van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [van_id, vehicle_no, from_date, to_date || null, spare_vehicle || null, reason, created_by]
    );

    const [newStoppage] = await pool.execute(`
      SELECT s.*, v.registration_number, u.name as created_by_name
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      message: 'Stoppage created successfully', 
      stoppage: newStoppage[0] 
    });
  } catch (error) {
    console.error('Create stoppage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStoppage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove computed fields
    delete updates.created_by_name;
    delete updates.registration_number;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await pool.execute(
      `UPDATE stoppages SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    const [updatedStoppage] = await pool.execute(`
      SELECT s.*, v.registration_number, u.name as created_by_name
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);
    
    if (updatedStoppage.length === 0) {
      return res.status(404).json({ message: 'Stoppage not found' });
    }
    
    res.json({ 
      message: 'Stoppage updated successfully', 
      stoppage: updatedStoppage[0] 
    });
  } catch (error) {
    console.error('Update stoppage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const authorizeStoppage = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorized } = req.body;
    
    await pool.execute(
      'UPDATE stoppages SET authorized = ? WHERE id = ?',
      [authorized, id]
    );
    
    const [updatedStoppage] = await pool.execute(`
      SELECT s.*, v.registration_number, u.name as created_by_name
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);
    
    res.json({ 
      message: 'Stoppage authorization updated', 
      stoppage: updatedStoppage[0] 
    });
  } catch (error) {
    console.error('Authorize stoppage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resolveStoppage = async (req, res) => {
  try {
    const { id } = req.params;
    const { to_date } = req.body;
    
    await pool.execute(
      'UPDATE stoppages SET to_date = ? WHERE id = ?',
      [to_date || new Date().toISOString().split('T')[0], id]
    );
    
    const [updatedStoppage] = await pool.execute(`
      SELECT s.*, v.registration_number, u.name as created_by_name
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);
    
    res.json({ 
      message: 'Stoppage resolved successfully', 
      stoppage: updatedStoppage[0] 
    });
  } catch (error) {
    console.error('Resolve stoppage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteStoppage = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM stoppages WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Stoppage not found' });
    }
    
    res.json({ message: 'Stoppage deleted successfully' });
  } catch (error) {
    console.error('Delete stoppage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllStoppages,
  getStoppagesByVan,
  createStoppage,
  updateStoppage,
  authorizeStoppage,
  resolveStoppage,
  deleteStoppage
};