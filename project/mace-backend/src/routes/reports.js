const express = require('express');
const {
  getVanUtilizationReport,
  getKilometerSummaryReport,
  getStoppageReport,
  getDashboardStats
} = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboardStats);
router.get('/van-utilization', authenticateToken, authorizeRoles('admin', 'manager'), getVanUtilizationReport);
router.get('/kilometer-summary', authenticateToken, authorizeRoles('admin', 'manager'), getKilometerSummaryReport);
router.get('/stoppages', authenticateToken, authorizeRoles('admin', 'manager'), getStoppageReport);

module.exports = router;