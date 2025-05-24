/**
 * Email validation
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation
 * @param {string} password 
 * @returns {object} validation result
 */
export const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return {
    isValid: password.length >= minLength,
    errors: {
      minLength: password.length < minLength,
      hasUpperCase: !hasUpperCase,
      hasLowerCase: !hasLowerCase,
      hasNumbers: !hasNumbers,
    },
    message: password.length < minLength 
      ? `Password must be at least ${minLength} characters long`
      : ''
  };
};

/**
 * Phone number validation
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Vehicle number validation (Indian format)
 * @param {string} vehicleNo 
 * @returns {boolean}
 */
export const isValidVehicleNumber = (vehicleNo) => {
  // Indian vehicle number format: XX00XX0000 or XX-00-XX-0000
  const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$|^[A-Z]{2}-[0-9]{2}-[A-Z]{2}-[0-9]{4}$/;
  return vehicleRegex.test(vehicleNo.replace(/\s/g, ''));
};

/**
 * Date validation
 * @param {string} date 
 * @returns {object} validation result
 */
export const validateDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  const isValidDate = inputDate instanceof Date && !isNaN(inputDate);
  const isFutureDate = inputDate > today;
  
  return {
    isValid: isValidDate && !isFutureDate,
    errors: {
      invalidDate: !isValidDate,
      futureDate: isFutureDate,
    },
    message: !isValidDate 
      ? 'Please enter a valid date'
      : isFutureDate 
        ? 'Date cannot be in the future'
        : ''
  };
};

/**
 * Kilometer reading validation
 * @param {number} startReading 
 * @param {number} endReading 
 * @returns {object} validation result
 */
export const validateKilometerReadings = (startReading, endReading) => {
  const start = Number(startReading);
  const end = Number(endReading);
  
  const isValidStart = !isNaN(start) && start >= 0;
  const isValidEnd = !isNaN(end) && end >= 0;
  const isEndGreater = end > start;
  const distance = end - start;
  const isReasonableDistance = distance <= 1000; // Max 1000 km per day
  
  return {
    isValid: isValidStart && isValidEnd && isEndGreater && isReasonableDistance,
    errors: {
      invalidStart: !isValidStart,
      invalidEnd: !isValidEnd,
      endNotGreater: !isEndGreater,
      unreasonableDistance: !isReasonableDistance,
    },
    distance,
    message: !isValidStart 
      ? 'Please enter a valid opening kilometer reading'
      : !isValidEnd 
        ? 'Please enter a valid closing kilometer reading'
        : !isEndGreater 
          ? 'Closing reading must be greater than opening reading'
          : !isReasonableDistance 
            ? 'Distance seems unreasonable (>1000 km). Please verify readings.'
            : ''
  };
};

/**
 * Required field validation
 * @param {string} value 
 * @param {string} fieldName 
 * @returns {object} validation result
 */
export const validateRequired = (value, fieldName) => {
  const isValid = value && value.toString().trim().length > 0;
  
  return {
    isValid,
    message: !isValid ? `${fieldName} is required` : ''
  };
};

/**
 * Van form validation
 * @param {object} vanData 
 * @returns {object} validation result
 */
export const validateVanForm = (vanData) => {
  const errors = {};
  
  // Required fields
  const requiredFields = [
    'state', 'region', 'zone', 'sector', 'city', 'vehicleNo', 
    'make', 'type', 'modelYear', 'contractType', 'ownerName', 
    'driverName', 'mobileNo', 'validFrom', 'validTo'
  ];
  
  requiredFields.forEach(field => {
    const validation = validateRequired(vanData[field], field);
    if (!validation.isValid) {
      errors[field] = validation.message;
    }
  });
  
  // Vehicle number validation
  if (vanData.vehicleNo && !isValidVehicleNumber(vanData.vehicleNo)) {
    errors.vehicleNo = 'Please enter a valid vehicle number';
  }
  
  // Phone number validation
  if (vanData.mobileNo && !isValidPhone(vanData.mobileNo)) {
    errors.mobileNo = 'Please enter a valid mobile number';
  }
  
  // Date validation
  if (vanData.validFrom && vanData.validTo) {
    const fromDate = new Date(vanData.validFrom);
    const toDate = new Date(vanData.validTo);
    
    if (toDate <= fromDate) {
      errors.validTo = 'Valid to date must be after valid from date';
    }
  }
  
  // Model year validation
  if (vanData.modelYear) {
    const currentYear = new Date().getFullYear();
    const year = parseInt(vanData.modelYear);
    
    if (year < 1950 || year > currentYear + 1) {
      errors.modelYear = `Model year must be between 1950 and ${currentYear + 1}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Kilometer entry form validation
 * @param {object} entryData 
 * @returns {object} validation result
 */
export const validateKilometerEntryForm = (entryData) => {
  const errors = {};
  
  // Required field validation
  const requiredValidation = validateRequired(entryData.vehicleNo, 'Vehicle Number');
  if (!requiredValidation.isValid) {
    errors.vehicleNo = requiredValidation.message;
  }
  
  const dateValidation = validateRequired(entryData.date, 'Date');
  if (!dateValidation.isValid) {
    errors.date = dateValidation.message;
  } else {
    const dateCheck = validateDate(entryData.date);
    if (!dateCheck.isValid) {
      errors.date = dateCheck.message;
    }
  }
  
  // Kilometer readings validation
  const kmValidation = validateKilometerReadings(entryData.startReading, entryData.endReading);
  if (!kmValidation.isValid) {
    if (kmValidation.errors.invalidStart) {
      errors.startReading = 'Please enter a valid opening kilometer reading';
    }
    if (kmValidation.errors.invalidEnd) {
      errors.endReading = 'Please enter a valid closing kilometer reading';
    }
    if (kmValidation.errors.endNotGreater) {
      errors.endReading = 'Closing reading must be greater than opening reading';
    }
    if (kmValidation.errors.unreasonableDistance) {
      errors.endReading = 'Distance seems unreasonable (>1000 km). Please verify readings.';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    distance: kmValidation.distance || 0
  };
};

/**
 * Stoppage form validation
 * @param {object} stoppageData 
 * @returns {object} validation result
 */
export const validateStoppageForm = (stoppageData) => {
  const errors = {};
  
  // Required fields
  const requiredFields = ['vehicleNo', 'fromDate', 'reason'];
  
  requiredFields.forEach(field => {
    const validation = validateRequired(stoppageData[field], field);
    if (!validation.isValid) {
      errors[field] = validation.message;
    }
  });
  
  // Date validation
  if (stoppageData.fromDate) {
    const dateValidation = validateDate(stoppageData.fromDate);
    if (!dateValidation.isValid) {
      errors.fromDate = dateValidation.message;
    }
  }
  
  if (stoppageData.toDate) {
    const dateValidation = validateDate(stoppageData.toDate);
    if (!dateValidation.isValid) {
      errors.toDate = dateValidation.message;
    }
    
    // Check if to date is after from date
    if (stoppageData.fromDate && stoppageData.toDate) {
      const fromDate = new Date(stoppageData.fromDate);
      const toDate = new Date(stoppageData.toDate);
      
      if (toDate <= fromDate) {
        errors.toDate = 'End date must be after start date';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Inventory item validation
 * @param {object} itemData 
 * @returns {object} validation result
 */
export const validateInventoryForm = (itemData) => {
  const errors = {};
  
  // Required fields
  const requiredFields = ['item', 'qty', 'uom'];
  
  requiredFields.forEach(field => {
    const validation = validateRequired(itemData[field], field);
    if (!validation.isValid) {
      errors[field] = validation.message;
    }
  });
  
  // Quantity validation
  if (itemData.qty) {
    const qty = Number(itemData.qty);
    if (isNaN(qty) || qty < 0) {
      errors.qty = 'Please enter a valid quantity';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};