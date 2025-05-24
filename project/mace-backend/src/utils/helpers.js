/**
 * Format date to readable string
 * @param {string|Date} date 
 * @param {object} options 
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Date(date).toLocaleDateString('en-IN', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Format vehicle number with proper spacing
 * @param {string} vehicleNo 
 * @returns {string}
 */
export const formatVehicleNumber = (vehicleNo) => {
  if (!vehicleNo) return '';
  
  // Remove existing spaces and hyphens
  const cleaned = vehicleNo.replace(/[\s-]/g, '').toUpperCase();
  
  // Format as XX-00-XX-0000
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  return vehicleNo.toUpperCase();
};

/**
 * Format phone number
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Indian mobile number
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate 
 * @param {string|Date} endDate 
 * @returns {number}
 */
export const calculateDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 0;
  }
};

/**
 * Generate unique ID
 * @returns {string}
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function for search inputs
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Capitalize first letter of each word
 * @param {string} str 
 * @returns {string}
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Format currency (Indian Rupees)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format large numbers with commas
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Calculate percentage
 * @param {number} value 
 * @param {number} total 
 * @returns {number}
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  
  return Math.round((value / total) * 100);
};

/**
 * Get status color class based on status
 * @param {string} status 
 * @returns {string}
 */
export const getStatusColor = (status) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    authorized: 'bg-green-100 text-green-800',
    unauthorized: 'bg-red-100 text-red-800',
    ongoing: 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
    low: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-green-100 text-green-800',
  };
  
  return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Download data as CSV
 * @param {Array} data 
 * @param {string} filename 
 * @param {Array} headers 
 */
export const downloadCSV = (data, filename, headers = null) => {
  if (!data || data.length === 0) return;
  
  let csvContent = '';
  
  // Add headers if provided
  if (headers) {
    csvContent += headers.join(',') + '\n';
  } else if (data.length > 0) {
    // Use keys of first object as headers
    csvContent += Object.keys(data[0]).join(',') + '\n';
  }
  
  // Add data rows
  data.forEach(row => {
    const values = headers 
      ? headers.map(header => row[header] || '')
      : Object.values(row);
    
    csvContent += values.map(value => {
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',') + '\n';
  });
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Group array of objects by a key
 * @param {Array} array 
 * @param {string} key 
 * @returns {Object}
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Sort array of objects by a key
 * @param {Array} array 
 * @param {string} key 
 * @param {string} direction 
 * @returns {Array}
 */
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Filter array based on search query
 * @param {Array} array 
 * @param {string} query 
 * @param {Array} fields 
 * @returns {Array}
 */
export const searchFilter = (array, query, fields) => {
  if (!query) return array;
  
  const searchTerm = query.toLowerCase();
  
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchTerm);
      }
      return false;
    });
  });
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string}
 */
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get start of current month in YYYY-MM-DD format
 * @returns {string}
 */
export const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

/**
 * Get end of current month in YYYY-MM-DD format
 * @returns {string}
 */
export const getEndOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
};

/**
 * Check if user has permission for an action
 * @param {object} user 
 * @param {string} action 
 * @returns {boolean}
 */
export const hasPermission = (user, action) => {
  if (!user) return false;
  
  const permissions = {
    admin: ['create', 'read', 'update', 'delete', 'authorize'],
    manager: ['create', 'read', 'update', 'authorize'],
    driver: ['create', 'read']
  };
  
  return permissions[user.role]?.includes(action) || false;
};

/**
 * Truncate text with ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
};