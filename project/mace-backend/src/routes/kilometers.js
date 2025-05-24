const express = require('express');
const {
  getAllKilometerEntries,
  getKilometerEntriesByVan,
  createKilometerEntry,
  updateKilometerEntry,
  authorizeKilometerEntry,
  deleteKilometerEntry
} = require('../controllers/kilometerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getAllKilometerEntries);
router.get('/van/:vanId', authenticateToken, getKilometerEntriesByVan);
router.post('/', authenticateToken, authorizeRoles('admin', 'driver'), createKilometerEntry);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'driver'), updateKilometerEntry);
router.patch('/:id/authorize', authenticateToken, authorizeRoles('admin'), authorizeKilometerEntry);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'driver'), deleteKilometerEntry);

module.exports = router;