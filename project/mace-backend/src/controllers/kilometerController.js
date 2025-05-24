const { pool } = require('../config/database');

const getAllKilometerEntries = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT k.*, v.registration_number, u.name as created_by_name
      FROM kilometer_entries k
      LEFT JOIN vans v ON k.van_id = v.id
      LEFT JOIN users u ON k.created_by = u.id
      ORDER BY k.date DESC, k.created_at DESC
    `);
    res.json({ entries: rows });
  } catch (error) {
    console.error('Get kilometer entries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getKilometerEntriesByVan = async (req, res) => {
  try {
    const { vanId } = req.params;
    const [rows] = await pool.execute(`
      SELECT k.*, v.registration_number, u.name as created_by_name
      FROM kilometer_entries k
      LEFT JOIN vans v ON k.van_id = v.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.van_id = ?
      ORDER BY k.date DESC, k.created_at DESC
    `, [vanId]);
    
    res.json({ entries: rows });
  } catch (error) {
    console.error('Get van kilometer entries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createKilometerEntry = async (req, res) => {
  try {
    const { van_id, vehicle_no, date, start_reading, end_reading } = req.body;
    const created_by = req.user.id;

    // Validate readings
    if (end_reading <= start_reading) {
      return res.status(400).json({ 
        message: 'End reading must be greater than start reading' 
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO kilometer_entries 
       (van_id, vehicle_no, date, start_reading, end_reading, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [van_id, vehicle_no, date, start_reading, end_reading, created_by]
    );

    const [newEntry] = await pool.execute(`
      SELECT k.*, v.registration_number, u.name as created_by_name
      FROM kilometer_entries k
      LEFT JOIN vans v ON k.van_id = v.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      message: 'Kilometer entry created successfully', 
      entry: newEntry[0] 
    });
  } catch (error) {
    console.error('Create kilometer entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateKilometerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove computed fields
    delete updates.day_km;
    delete updates.created_by_name;
    delete updates.registration_number;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await pool.execute(
      `UPDATE kilometer_entries SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    const [updatedEntry] = await pool.execute(`
      SELECT k.*, v.registration_number, u.name as created_by_name
      FROM kilometer_entries k
      LEFT JOIN vans v ON k.van_id = v.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.id = ?
    `, [id]);
    
    if (updatedEntry.length === 0) {
      return res.status(404).json({ message: 'Kilometer entry not found' });
    }
    
    res.json({ 
      message: 'Kilometer entry updated successfully', 
      entry: updatedEntry[0] 
    });
  } catch (error) {
    console.error('Update kilometer entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const authorizeKilometerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorized } = req.body;
    
    await pool.execute(
      'UPDATE kilometer_entries SET authorized = ? WHERE id = ?',
      [authorized, id]
    );
    
    const [updatedEntry] = await pool.execute(`
      SELECT k.*, v.registration_number, u.name as created_by_name
      FROM kilometer_entries k
      LEFT JOIN vans v ON k.van_id = v.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.id = ?
    `, [id]);
    
    res.json({ 
      message: 'Kilometer entry authorization updated', 
      entry: updatedEntry[0] 
    });
  } catch (error) {
    console.error('Authorize kilometer entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteKilometerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM kilometer_entries WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kilometer entry not found' });
    }
    
    res.json({ message: 'Kilometer entry deleted successfully' });
  } catch (error) {
    console.error('Delete kilometer entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllKilometerEntries,
  getKilometerEntriesByVan,
  createKilometerEntry,
  updateKilometerEntry,
  authorizeKilometerEntry,
  deleteKilometerEntry
};