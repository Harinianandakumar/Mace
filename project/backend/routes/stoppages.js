const createStoppage = async (req, res) => {
  const { van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, created_by, status } = req.body;
  
  try {
    const [result] = await pool.execute(`
      INSERT INTO stoppages 
        (van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, created_by, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [van_id, vehicle_no, from_date, to_date, spare_vehicle, reason, created_by, status]);
    
    res.status(201).json({
      id: result.insertId,
      van_id,
      vehicle_no,
      from_date,
      to_date,
      spare_vehicle,
      reason,
      created_by,
      status
    });
  } catch (error) {
    console.error('Error creating stoppage:', error);
    res.status(500).json({ message: 'Error creating stoppage entry' });
  }
};