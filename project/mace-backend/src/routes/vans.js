const express = require('express');
const { getAllVans, getVanById, createVan, updateVan, deleteVan } = require('../controllers/vanController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getAllVans);
router.get('/:id', authenticateToken, getVanById);
router.post('/', authenticateToken, authorizeRoles('admin', 'driver'), createVan);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'driver'), updateVan);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'driver'), deleteVan);

module.exports = router;