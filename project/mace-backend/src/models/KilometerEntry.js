// KilometerEntry model
// This is a simple representation of the kilometer_entries table

/**
 * KilometerEntry model
 * @typedef {Object} KilometerEntry
 * @property {number} id - Entry ID
 * @property {number} van_id - Van ID
 * @property {string} vehicle_no - Vehicle number
 * @property {string} date - Entry date
 * @property {number} start_reading - Starting odometer reading
 * @property {number} end_reading - Ending odometer reading
 * @property {number} day_km - Calculated kilometers for the day (end_reading - start_reading)
 * @property {boolean} authorized - Whether the entry is authorized
 * @property {number} created_by - User ID who created the entry
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

// Note: This is a model representation only.
// The actual database operations are handled directly in the controller using the database pool.