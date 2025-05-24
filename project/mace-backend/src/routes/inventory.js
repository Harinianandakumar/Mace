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
router.post('/', authenticateToken, authorizeRoles('admin', 'driver'), createInventoryItem);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'driver'), updateInventoryItem);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'driver'), deleteInventoryItem);

module.exports = router;