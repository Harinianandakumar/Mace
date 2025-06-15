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
      SELECT s.*, 
             v.registration_number, 
             u1.name as created_by_name,
             u2.name as resolved_by_name,
             u2.role as resolver_role
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.resolved_by = u2.id
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
    console.log('==== STOPPAGE CREATION ====');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const { van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, status } = req.body;
    const created_by = req.user.id;

    console.log('Received create data for stoppage:', req.body);

    // Validate required fields
    if (!van_id || !from_date || !reason) {
      return res.status(400).json({
        message: 'Missing required fields: van_id, from_date, and reason are required'
      });
    }

    // Ensure vehicle_no is provided
    if (!vehicle_no) {
      return res.status(400).json({
        message: 'Vehicle number is required'
      });
    }

    // Validate dates
    if (to_date && new Date(to_date) < new Date(from_date)) {
      return res.status(400).json({ 
        message: 'To date cannot be earlier than from date' 
      });
    }

    // Determine resolved_by if the stoppage is already resolved
    const resolved_by = (to_date || status === 'resolved') ? req.user.id : null;
    
    // Determine the status based on to_date if not provided
    const finalStatus = status || (to_date ? 'resolved' : 'ongoing');

    console.log('Creating stoppage with status:', finalStatus, 'resolved_by:', resolved_by);
    console.log('Data to be inserted:', {
      van_id, 
      vehicle_no, 
      from_date, 
      to_date: to_date || null, 
      spare_vehicle: spare_vehicle || null, 
      reason, 
      created_by, 
      resolved_by, 
      finalStatus
    });

    try {
      // Ensure van_id is an integer
      const vanId = parseInt(van_id, 10);
      if (isNaN(vanId)) {
        return res.status(400).json({
          message: 'Invalid van_id: must be a number'
        });
      }
      
      // Format dates properly
      let formattedFromDate = from_date;
      let formattedToDate = to_date;
      
      // If dates include time component, extract just the date part
      if (formattedFromDate && formattedFromDate.includes('T')) {
        formattedFromDate = formattedFromDate.split('T')[0];
      }
      
      if (formattedToDate && formattedToDate.includes('T')) {
        formattedToDate = formattedToDate.split('T')[0];
      }
      
      console.log('Formatted dates:', {
        from: formattedFromDate,
        to: formattedToDate
      });
      
      // Set default value for authorized
      const authorized = req.body.authorized === true;
      
      // First, check if the status column exists
      try {
        const [columns] = await pool.execute('SHOW COLUMNS FROM stoppages');
        const hasStatusColumn = columns.some(col => col.Field === 'status');
        
        console.log('Stoppages table has status column:', hasStatusColumn);
        
        // Prepare the SQL and parameters based on whether status column exists
      
        
        // First, check if the resolved_by column exists
        const hasResolvedByColumn = columns.some(col => col.Field === 'resolved_by');
        console.log('Stoppages table has resolved_by column:', hasResolvedByColumn);
        
        // Prepare SQL and parameters based on which columns exist
        let sql, params;
        
        if (hasStatusColumn && hasResolvedByColumn) {
          // Both status and resolved_by columns exist
          sql = `INSERT INTO stoppages 
             (van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, authorized, created_by, resolved_by, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          
          params = [
            vanId, 
            vehicle_no, 
            formattedFromDate, 
            formattedToDate || null, 
            spare_vehicle || null, 
            reason, 
            authorized, 
            created_by, 
            resolved_by, 
            finalStatus
          ];
        } else if (hasStatusColumn && !hasResolvedByColumn) {
          // Only status column exists, but not resolved_by
          sql = `INSERT INTO stoppages 
             (van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, authorized, created_by, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          
          params = [
            vanId, 
            vehicle_no, 
            formattedFromDate, 
            formattedToDate || null, 
            spare_vehicle || null, 
            reason, 
            authorized, 
            created_by, 
            finalStatus
          ];
        } else if (!hasStatusColumn && hasResolvedByColumn) {
          // Only resolved_by column exists, but not status
          sql = `INSERT INTO stoppages 
             (van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, authorized, created_by, resolved_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          
          params = [
            vanId, 
            vehicle_no, 
            formattedFromDate, 
            formattedToDate || null, 
            spare_vehicle || null, 
            reason, 
            authorized, 
            created_by, 
            resolved_by
          ];
        } else {
          // Neither status nor resolved_by columns exist
          sql = `INSERT INTO stoppages 
             (van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, authorized, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          
          params = [
            vanId, 
            vehicle_no, 
            formattedFromDate, 
            formattedToDate || null, 
            spare_vehicle || null, 
            reason, 
            authorized, 
            created_by
          ];
        }
      
      // Log the exact SQL and parameters
      console.log('SQL Query:', sql);
      console.log('Parameters:', JSON.stringify(params, null, 2));
      
      // Execute the query
      const [result] = await pool.execute(sql, params);

      console.log('Insert result:', result);

      const [newStoppage] = await pool.execute(`
        SELECT s.*, v.registration_number, u.name as created_by_name
        FROM stoppages s
        LEFT JOIN vans v ON s.van_id = v.id
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.id = ?
      `, [result.insertId]);

      if (!newStoppage || newStoppage.length === 0) {
        return res.status(500).json({
          message: 'Stoppage was created but could not be retrieved'
        });
      }

      res.status(201).json({ 
        message: 'Stoppage created successfully', 
        stoppage: newStoppage[0] 
      });
      } catch (dbError) {
      console.error('Database error during stoppage creation:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error number:', dbError.errno);
      console.error('SQL message:', dbError.sqlMessage);
      console.error('SQL state:', dbError.sqlState);
      console.error('SQL:', dbError.sql);
      
      // Provide more specific error messages based on the error code
      if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
          message: 'The van ID does not exist in the database',
          error: dbError.message,
          details: {
            code: dbError.code,
            sqlMessage: dbError.sqlMessage
          }
        });
      } else if (dbError.code === 'ER_BAD_NULL_ERROR') {
        return res.status(400).json({
          message: 'A required field is missing',
          error: dbError.message,
          details: {
            code: dbError.code,
            sqlMessage: dbError.sqlMessage
          }
        });
      } else if (dbError.code === 'ER_TRUNCATED_WRONG_VALUE') {
        return res.status(400).json({
          message: 'Invalid date format',
          error: dbError.message,
          details: {
            code: dbError.code,
            sqlMessage: dbError.sqlMessage
          }
        });
      } else if (dbError.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({
          message: 'One or more fields exceed the maximum allowed length',
          error: dbError.message,
          details: {
            code: dbError.code,
            sqlMessage: dbError.sqlMessage
          }
        });
      } else if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({
          message: 'Database schema error: One or more fields do not exist in the table',
          error: dbError.message,
          details: {
            code: dbError.code,
            sqlMessage: dbError.sqlMessage
          }
        });
      }
      
      return res.status(500).json({
        message: 'Database error during stoppage creation',
        error: dbError.message,
        details: {
          code: dbError.code,
          sqlMessage: dbError.sqlMessage,
          sqlState: dbError.sqlState
        }
      });
    }
  } catch (error) {
    console.error('Create stoppage error:', error);
    
    // Provide more detailed error information in development
    const errorDetails = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'Unknown error';
    
    // Log detailed error information for debugging
    console.error('Detailed error information:', {
      error,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      code: error.code
    });
    
    res.status(500).json({ 
      message: 'Error creating stoppage entry', 
      error: errorDetails 
    });
  } } catch (error) {
    console.error('Update stoppage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStoppage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Received update data for stoppage:', updates);
    
    // Remove computed fields
    delete updates.created_by_name;
    delete updates.registration_number;
    
    // Update status based on to_date if not explicitly provided
    if (updates.to_date && !updates.status) {
      updates.status = 'resolved';
    } else if (updates.to_date === null && !updates.status) {
      updates.status = 'ongoing';
    }
    
    // Log the final update data
    console.log('Final update data:', updates);
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    console.log('SQL set clause:', setClause);
    console.log('SQL values:', values);
    
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
    const resolved_by = req.user.id; // Get the user who is resolving the stoppage
    
    console.log('Resolving stoppage:', id, 'with to_date:', to_date, 'resolved_by:', resolved_by);
    
    // Format the to_date if not provided
    const formattedToDate = to_date || new Date().toISOString().split('T')[0];
    
    console.log('Formatted to_date for database:', formattedToDate);
    
    // Update the stoppage with to_date, resolved_by, and set status to 'resolved'
    await pool.execute(
      'UPDATE stoppages SET to_date = ?, resolved_by = ?, status = ? WHERE id = ?',
      [formattedToDate, resolved_by, 'resolved', id]
    );
    
    // Get the updated stoppage with user information
    const [updatedStoppage] = await pool.execute(`
      SELECT s.*, 
             v.registration_number, 
             u1.name as created_by_name,
             u2.name as resolved_by_name,
             u2.role as resolver_role
      FROM stoppages s
      LEFT JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u1 ON s.created_by = u1.id
      LEFT JOIN users u2 ON s.resolved_by = u2.id
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