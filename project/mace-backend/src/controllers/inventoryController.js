const { pool } = require('../config/database');

const getAllInventory = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, v.vehicle_no, v.registration_number 
      FROM inventory i 
      LEFT JOIN vans v ON i.van_id = v.id 
      ORDER BY i.created_at DESC
    `);
    res.json({ inventory: rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getInventoryByVan = async (req, res) => {
  try {
    const { vanId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM inventory WHERE van_id = ? ORDER BY created_at DESC',
      [vanId]
    );
    res.json({ inventory: rows });
  } catch (error) {
    console.error('Get van inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const { van_id, bu, item, qty, uom } = req.body;

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
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
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
    
    if (updatedItem.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json({ 
      message: 'Inventory item updated successfully', 
      item: updatedItem[0] 
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
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