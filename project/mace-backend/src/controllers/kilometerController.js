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

    console.log('Received create data for kilometer entry:', req.body);

    // Validate readings
    if (end_reading <= start_reading) {
      return res.status(400).json({ 
        message: 'End reading must be greater than start reading' 
      });
    }

    // Ensure date is in the correct format (YYYY-MM-DD)
    let formattedDate = date;
    if (date && date.includes('T')) {
      formattedDate = date.split('T')[0];
      console.log('Formatted date for database:', formattedDate);
    }

    const [result] = await pool.execute(
      `INSERT INTO kilometer_entries 
       (van_id, vehicle_no, date, start_reading, end_reading, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [van_id, vehicle_no, formattedDate, start_reading, end_reading, created_by]
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
    
    console.log('Received update data for kilometer entry:', updates);
    
    // Remove computed fields
    delete updates.day_km;
    delete updates.created_by_name;
    delete updates.registration_number;
    
    // Ensure date is in the correct format (YYYY-MM-DD)
    if (updates.date) {
      // If date includes time component, extract just the date part
      if (updates.date.includes('T')) {
        updates.date = updates.date.split('T')[0];
      }
      console.log('Formatted date for database:', updates.date);
    }
    
    // Validate readings if both are provided
    if (updates.start_reading !== undefined && updates.end_reading !== undefined) {
      if (updates.end_reading <= updates.start_reading) {
        return res.status(400).json({ 
          message: 'End reading must be greater than start reading' 
        });
      }
    }
    
    // If only one reading is provided, get the other from the database to validate
    if ((updates.start_reading !== undefined && updates.end_reading === undefined) || 
        (updates.start_reading === undefined && updates.end_reading !== undefined)) {
      
      const [currentEntry] = await pool.execute(
        'SELECT start_reading, end_reading FROM kilometer_entries WHERE id = ?',
        [id]
      );
      
      if (currentEntry.length === 0) {
        return res.status(404).json({ message: 'Kilometer entry not found' });
      }
      
      const currentStartReading = currentEntry[0].start_reading;
      const currentEndReading = currentEntry[0].end_reading;
      
      // Check if the new values would result in end_reading <= start_reading
      if (updates.start_reading !== undefined && updates.start_reading >= currentEndReading) {
        return res.status(400).json({ 
          message: 'Start reading must be less than end reading' 
        });
      }
      
      if (updates.end_reading !== undefined && updates.end_reading <= currentStartReading) {
        return res.status(400).json({ 
          message: 'End reading must be greater than start reading' 
        });
      }
    }
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    console.log('SQL set clause:', setClause);
    console.log('SQL values:', values);
    
    await pool.execute(
      `UPDATE kilometer_entries SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    // Get the updated entry with the calculated day_km
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
    
    console.log('Updated entry with day_km:', updatedEntry[0]);
    
    res.json({ 
      message: 'Kilometer entry updated successfully', 
      entry: updatedEntry[0] 
    });
  } catch (error) {
    console.error('Update kilometer entry error:', error);
    
    // Check for specific error types
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ 
        message: 'Missing required fields. Please fill in all required information.' 
      });
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        message: 'One or more fields exceed the maximum allowed length.' 
      });
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      return res.status(400).json({ 
        message: 'Invalid value for one of the fields. Please check date formats and numeric values.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error. Please try again later.',
      error: error.message 
    });
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