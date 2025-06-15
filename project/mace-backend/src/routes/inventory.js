const express = require('express');
const {
  getAllInventory,
  getInventoryByVan,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getAllInventory);
router.get('/van/:vanId', authenticateToken, getInventoryByVan);
router.post('/', authenticateToken, authorizeRoles('mace sector head', 'manager', 'mace engineer'), createInventoryItem);
router.put('/:id', authenticateToken, authorizeRoles('mace sector head', 'manager', 'mace engineer'), updateInventoryItem);
router.delete('/:id', authenticateToken, authorizeRoles('mace sector head', 'manager', 'mace engineer'), deleteInventoryItem);

module.exports = router;