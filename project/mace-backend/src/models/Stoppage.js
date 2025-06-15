/**
 * Stoppage model
 * 
 * Represents a van stoppage record in the system.
 * A stoppage occurs when a van is temporarily out of service.
 */

class Stoppage {
  /**
   * Create a new Stoppage instance
   * 
   * @param {Object} data - The stoppage data
   * @param {number} data.id - Unique identifier
   * @param {number} data.van_id - ID of the van that is stopped
   * @param {string} data.vehicle_no - Vehicle number
   * @param {Date} data.from_date - Start date of the stoppage
   * @param {Date|null} data.to_date - End date of the stoppage (null if ongoing)
   * @param {string|null} data.spare_vehicle - Spare vehicle information if any
   * @param {string} data.reason - Reason for the stoppage
   * @param {boolean} data.authorized - Whether the stoppage is authorized
   * @param {number} data.created_by - ID of the user who created the stoppage
   * @param {number|null} data.resolved_by - ID of the user who resolved the stoppage
   * @param {Date} data.created_at - Creation timestamp
   * @param {Date} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.van_id = data.van_id;
    this.vehicle_no = data.vehicle_no;
    this.from_date = data.from_date;
    this.to_date = data.to_date;
    this.spare_vehicle = data.spare_vehicle;
    this.reason = data.reason;
    this.authorized = data.authorized;
    this.created_by = data.created_by;
    this.resolved_by = data.resolved_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Check if the stoppage is resolved
   * 
   * @returns {boolean} True if the stoppage is resolved
   */
  isResolved() {
    return !!this.to_date;
  }

  /**
   * Get the status of the stoppage
   * 
   * @returns {string} 'ongoing' or 'resolved'
   */
  getStatus() {
    return this.isResolved() ? 'resolved' : 'ongoing';
  }
}

module.exports = Stoppage;