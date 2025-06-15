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
router.post('/', authenticateToken, authorizeRoles('mace sector head', 'manager', 'mace engineer'), createKilometerEntry);
router.put('/:id', authenticateToken, authorizeRoles('mace sector head', 'manager', 'mace engineer'), updateKilometerEntry);
router.patch('/:id/authorize', authenticateToken, authorizeRoles('mace sector head'), authorizeKilometerEntry);
router.delete('/:id', authenticateToken, authorizeRoles('mace sector head', 'manager', 'mace engineer'), deleteKilometerEntry);

module.exports = router;