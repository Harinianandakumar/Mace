const { pool } = require('../config/database');

const getAllInventory = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        i.*,
        v.id AS van_id,
        v.vehicle_no,
        v.registration_number,
        v.make,
        v.type,
        v.model_year
      FROM inventory i 
      LEFT JOIN vans v ON i.van_id = v.id 
      ORDER BY i.created_at DESC
    `);
    
    // Transform the data to include van information in a nested object
    const inventory = rows.map(row => {
      const { 
        van_id, vehicle_no, registration_number, make, type, model_year,
        ...inventoryData 
      } = row;
      
      return {
        ...inventoryData,
        van: {
          id: van_id,
          vehicleNo: vehicle_no,
          registrationNumber: registration_number,
          make,
          type,
          modelYear: model_year
        }
      };
    });
    
    res.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getInventoryByVan = async (req, res) => {
  try {
    const { vanId } = req.params;
    
    // First get the van details
    const [vanRows] = await pool.execute(
      'SELECT id, vehicle_no, registration_number, make, type, model_year FROM vans WHERE id = ?',
      [vanId]
    );
    
    if (vanRows.length === 0) {
      return res.status(404).json({ message: 'Van not found' });
    }
    
    const van = {
      id: vanRows[0].id,
      vehicleNo: vanRows[0].vehicle_no,
      registrationNumber: vanRows[0].registration_number,
      make: vanRows[0].make,
      type: vanRows[0].type,
      modelYear: vanRows[0].model_year
    };
    
    // Then get the inventory items for this van
    const [inventoryRows] = await pool.execute(
      'SELECT * FROM inventory WHERE van_id = ? ORDER BY created_at DESC',
      [vanId]
    );
    
    // Add the van information to each inventory item
    const inventory = inventoryRows.map(item => ({
      ...item,
      van
    }));
    
    res.json({ inventory });
  } catch (error) {
    console.error('Get van inventory error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    // Extract data from request body with defaults for optional fields
    const { 
      van_id, 
      bu = 'default', // Default value for bu
      item, 
      qty = 1,        // Default value for qty
      uom = 'units'   // Default value for uom
    } = req.body;

    // Validate required fields
    if (!van_id) {
      return res.status(400).json({ message: 'Van ID is required' });
    }
    
    if (!item) {
      return res.status(400).json({ message: 'Item is required' });
    }

    console.log('Creating inventory item with data:', { van_id, bu, item, qty, uom });

    const [result] = await pool.execute(
      'INSERT INTO inventory (van_id, bu, item, qty, uom) VALUES (?, ?, ?, ?, ?)',
      [van_id, bu, item, qty, uom]
    );

    const [newItem] = await pool.execute(
      'SELECT * FROM inventory WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      message: 'Inventory item created successfully', 
      item: newItem[0] 
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message // Include error message for debugging
    });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate that we have an ID
    if (!id) {
      return res.status(400).json({ message: 'Inventory item ID is required' });
    }
    
    // Check if the item exists before updating
    const [existingItem] = await pool.execute(
      'SELECT * FROM inventory WHERE id = ?',
      [id]
    );
    
    if (existingItem.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // If there are no updates, return the existing item
    if (Object.keys(updates).length === 0) {
      return res.json({ 
        message: 'No updates provided', 
        item: existingItem[0] 
      });
    }
    
    console.log('Updating inventory item with data:', updates);
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    await pool.execute(
      `UPDATE inventory SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    const [updatedItem] = await pool.execute(
      'SELECT * FROM inventory WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'Inventory item updated successfully', 
      item: updatedItem[0] 
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message // Include error message for debugging
    });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM inventory WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllInventory,
  getInventoryByVan,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};