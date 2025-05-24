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
router.post('/', authenticateToken, authorizeRoles('admin', 'driver'), createStoppage);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'driver'), updateStoppage);
router.patch('/:id/authorize', authenticateToken, authorizeRoles('admin'), authorizeStoppage);
router.patch('/:id/resolve', authenticateToken, authorizeRoles('admin', 'driver'), resolveStoppage);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'driver'), deleteStoppage);

module.exports = router;