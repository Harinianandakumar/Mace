const { pool } = require('../config/database');

const getVanUtilizationReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let query = `
      SELECT 
        v.id,
        v.vehicle_no,
        v.registration_number,
        v.driver_name,
        COUNT(DISTINCT k.id) as total_trips,
        COALESCE(SUM(k.day_km), 0) as total_km,
        COUNT(DISTINCT s.id) as total_stoppages,
        COALESCE(SUM(DATEDIFF(COALESCE(s.to_date, CURDATE()), s.from_date)), 0) as total_stoppage_days
      FROM vans v
      LEFT JOIN kilometer_entries k ON v.id = k.van_id
      LEFT JOIN stoppages s ON v.id = s.van_id
    `;
    
    const params = [];
    
    if (fromDate && toDate) {
      query += ` WHERE (k.date BETWEEN ? AND ?) OR (s.from_date BETWEEN ? AND ?)`;
      params.push(fromDate, toDate, fromDate, toDate);
    }
    
    query += ` GROUP BY v.id ORDER BY total_km DESC`;
    
    const [rows] = await pool.execute(query, params);
    res.json({ report: rows });
  } catch (error) {
    console.error('Van utilization report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getKilometerSummaryReport = async (req, res) => {
  try {
    const { fromDate, toDate, vanId } = req.query;
    
    let query = `
      SELECT 
        k.date,
        v.vehicle_no,
        v.registration_number,
        v.driver_name,
        k.start_reading,
        k.end_reading,
        k.day_km,
        k.authorized,
        u.name as created_by
      FROM kilometer_entries k
      JOIN vans v ON k.van_id = v.id
      LEFT JOIN users u ON k.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fromDate && toDate) {
      query += ` AND k.date BETWEEN ? AND ?`;
      params.push(fromDate, toDate);
    }
    
    if (vanId && vanId !== 'all') {
      query += ` AND k.van_id = ?`;
      params.push(vanId);
    }
    
    query += ` ORDER BY k.date DESC, v.vehicle_no`;
    
    const [rows] = await pool.execute(query, params);
    res.json({ report: rows });
  } catch (error) {
    console.error('Kilometer summary report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getStoppageReport = async (req, res) => {
  try {
    const { fromDate, toDate, vanId } = req.query;
    
    let query = `
      SELECT 
        s.from_date,
        s.to_date,
        v.vehicle_no,
        v.registration_number,
        v.driver_name,
        s.reason,
        s.spare_vehicle,
        COALESCE(DATEDIFF(COALESCE(s.to_date, CURDATE()), s.from_date), 0) as duration_days,
        s.authorized,
        u.name as created_by
      FROM stoppages s
      JOIN vans v ON s.van_id = v.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fromDate && toDate) {
      query += ` AND s.from_date BETWEEN ? AND ?`;
      params.push(fromDate, toDate);
    }
    
    if (vanId && vanId !== 'all') {
      query += ` AND s.van_id = ?`;
      params.push(vanId);
    }
    
    query += ` ORDER BY s.from_date DESC, v.vehicle_no`;
    
    const [rows] = await pool.execute(query, params);
    res.json({ report: rows });
  } catch (error) {
    console.error('Stoppage report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get total vans
    const [vansCount] = await pool.execute('SELECT COUNT(*) as count FROM vans');
    
    // Get active vans (not currently stopped)
    const [activeVans] = await pool.execute(`
      SELECT COUNT(*) as count FROM vans v
      WHERE v.id NOT IN (
        SELECT DISTINCT van_id FROM stoppages 
        WHERE to_date IS NULL OR to_date >= CURDATE()
      )
    `);
    
    // Get today's kilometer entries
    const [todayKm] = await pool.execute(`
      SELECT COALESCE(SUM(day_km), 0) as total_km 
      FROM kilometer_entries 
      WHERE date = CURDATE()
    `);
    
    // Get ongoing stoppages
    const [ongoingStoppages] = await pool.execute(`
      SELECT COUNT(*) as count FROM stoppages 
      WHERE to_date IS NULL OR to_date >= CURDATE()
    `);
    
    // Get pending authorizations
    const [pendingAuth] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM kilometer_entries WHERE authorized = FALSE) +
        (SELECT COUNT(*) FROM stoppages WHERE authorized = FALSE) as count
    `);
    
    res.json({
      stats: {
        totalVans: vansCount[0].count,
        activeVans: activeVans[0].count,
        todayKilometers: todayKm[0].total_km,
        ongoingStoppages: ongoingStoppages[0].count,
        pendingAuthorizations: pendingAuth[0].count
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getVanUtilizationReport,
  getKilometerSummaryReport,
  getStoppageReport,
  getDashboardStats
};