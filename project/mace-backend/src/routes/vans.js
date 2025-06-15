const express = require('express');
const { getAllVans, getVanById, createVan, updateVan, deleteVan } = require('../controllers/vanController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getAllVans);
router.get('/:id', authenticateToken, getVanById);
// Temporarily remove role restrictions completely
router.post('/', authenticateToken, createVan);
router.put('/:id', authenticateToken, updateVan);
router.delete('/:id', authenticateToken, deleteVan);

module.exports = router;