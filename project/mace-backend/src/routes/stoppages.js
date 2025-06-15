const express = require('express');
const {
  getAllStoppages,
  getStoppagesByVan,
  createStoppage,
  updateStoppage,
  authorizeStoppage,
  resolveStoppage,
  deleteStoppage
} = require('../controllers/stoppageController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getAllStoppages);
router.get('/van/:vanId', authenticateToken, getStoppagesByVan);
router.post('/', authenticateToken, authorizeRoles('admin', 'driver', 'manager', 'mace engineer'), createStoppage);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'driver', 'manager', 'mace engineer'), updateStoppage);
router.patch('/:id/authorize', authenticateToken, authorizeRoles('admin', 'mace sector head'), authorizeStoppage);
router.patch('/:id/resolve', authenticateToken, authorizeRoles('admin', 'driver', 'manager', 'mace engineer'), resolveStoppage);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'driver', 'manager', 'mace engineer'), deleteStoppage);

module.exports = router;