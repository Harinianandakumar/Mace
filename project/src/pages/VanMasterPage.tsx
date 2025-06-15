﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, X, AlertCircle } from 'lucide-react';
import { Van } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Define validation error type
type ValidationErrors = {
  [key in keyof Omit<Van, 'id'>]?: string;
};

const VanMasterPage = () => {
  const { user: currentUser } = useAuth();
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVan, setEditingVan] = useState<Van | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<Omit<Van, 'id'>>({
    state: '',
    region: '',
    zone: '',
    sector: '',
    city: '',
    vehicleNo: '',
    make: '',
    type: '',
    modelYear: '',
    contractType: '',
    ownerName: '',
    travelsName: '',
    address: '',
    driverName: '',
    mobileNo: '',
    validFrom: '',
    validTo: '',
    rclIncharge: '',
    gpInstalled: 'No', // Default value matching database ENUM
    gpsSimNo: 'Inactive', // Default value matching database ENUM
  });

  useEffect(() => {
    fetchVans();
  }, []);

  const fetchVans = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching vans data...');
      const vansData = await apiService.getVans();
      console.log('Vans data received:', vansData);
      
      // Only update state if we received valid data
      if (Array.isArray(vansData)) {
        console.log('Setting vans state with', vansData.length, 'items');
        setVans(vansData);
      } else {
        console.warn('Received non-array vans data:', vansData);
      }
    } catch (error) {
      console.error('Error fetching vans:', error);
      // Don't reset the state to empty array on error
      // This prevents the UI from showing empty data when there's a temporary API issue
    } finally {
      setIsLoading(false);
    }
  };

  // Validation functions
  const validateField = (name: keyof Omit<Van, 'id'>, value: string): string => {
    switch (name) {
      case 'state':
      case 'region':
      case 'zone':
        return value ? '' : `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
      
      case 'sector':
        if (!value) return 'Sector is required';
        if (!/^\d+$/.test(value)) return 'Sector must contain only numeric values';
        if (value.length > 4) return 'Sector must be up to 4 digits only';
        return '';
      
      case 'city':
        if (!value) return 'City is required';
        if (/\d/.test(value)) return 'City should not contain numeric values';
        return '';
      
      case 'vehicleNo':
        if (!value) return 'Vehicle number is required';
        // Basic vehicle number format validation (adjust regex as needed for your specific format)
        if (!/^[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{4}$/i.test(value)) {
          return 'Invalid vehicle number format (e.g., TN-01-AB-1234)';
        }
        return '';
      
      case 'make':
        return value ? '' : 'Make is required';
      
      case 'type':
        return value ? '' : 'Type is required';
      
      case 'modelYear':
        if (!value) return 'Model year is required';
        if (!/^\d{4}$/.test(value)) return 'Model year must be a 4-digit year';
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (year < 1980 || year > currentYear + 1) {
          return `Model year must be between 1980 and ${currentYear + 1}`;
        }
        return '';
      
      case 'contractType':
        if (!value) return 'Contract type is required';
        if (!/^[A-Za-z0-9]+$/.test(value)) return 'Contract type should contain only alphanumeric characters';
        if (value.length > 20) return 'Contract type should not exceed 20 characters';
        return '';
      
      case 'ownerName':
        if (!value) return 'Owner name is required';
        if (/[^A-Za-z\s]/.test(value)) return 'Owner name should contain only alphabets';
        if (value.length > 30) return 'Owner name should not exceed 30 characters';
        return '';
      
      case 'travelsName':
        return value ? '' : 'Travels name is required';
      
      case 'address':
        return value ? '' : 'Address is required';
      
      case 'driverName':
        if (!value) return 'Driver name is required';
        if (/[^A-Za-z\s]/.test(value)) return 'Driver name should contain only alphabets';
        if (value.length > 30) return 'Driver name should not exceed 30 characters';
        return '';
      
      case 'mobileNo':
        if (!value) return 'Mobile number is required';
        if (!/^[6-9]\d{9}$/.test(value)) return 'Enter a valid 10-digit mobile number';
        return '';
      
      case 'validFrom':
        if (!value) return 'Valid from date is required';
        return '';
      
      case 'validTo':
        if (!value) return 'Valid to date is required';
        return '';
      
      case 'rclIncharge':
        if (!value) return 'RCL incharge is required';
        if (/[^A-Za-z\s]/.test(value)) return 'RCL incharge should contain only alphabets';
        if (value.length > 30) return 'RCL incharge should not exceed 30 characters';
        return '';
      
      case 'gpInstalled':
        return value ? '' : 'GPS installed status is required';
      
      case 'gpsSimNo':
        if (formData.gpInstalled === 'Yes' && !value) {
          return 'GPS SIM status is required when GPS is installed';
        }
        return '';
      
      default:
        return '';
    }
  };

  // Validate all fields and return if the form is valid
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate each field
    Object.entries(formData).forEach(([key, value]) => {
      const fieldName = key as keyof Omit<Van, 'id'>;
      const error = validateField(fieldName, value as string);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof Omit<Van, 'id'>;
    
    // Special handling for fields that should only contain alphabets
    if (fieldName === 'city' && /\d/.test(value)) {
      return; // Don't update if the value contains numbers
    }
    
    // Prevent non-alphabetic characters in name fields
    if ((fieldName === 'ownerName' || fieldName === 'driverName' || fieldName === 'rclIncharge') 
        && /[^A-Za-z\s]/.test(value)) {
      return; // Don't update if the value contains non-alphabetic characters
    }
    
    // Prevent non-alphanumeric characters in contract type field
    if (fieldName === 'contractType' && /[^A-Za-z0-9]/.test(value)) {
      return; // Don't update if the value contains non-alphanumeric characters
    }
    
    // Update form data
    setFormData({ ...formData, [fieldName]: value });
    
    // Validate the field as user types
    const error = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    // Special case for validTo - revalidate when validFrom changes
    if (fieldName === 'validFrom' && formData.validTo) {
      const validToError = validateField('validTo', formData.validTo);
      setErrors(prev => ({
        ...prev,
        validTo: validToError
      }));
    }
    
    // Special case for gpInstalled - revalidate gpsSimNo when gpInstalled changes
    if (fieldName === 'gpInstalled' && formData.gpsSimNo) {
      const gpsSimNoError = validateField('gpsSimNo', formData.gpsSimNo);
      setErrors(prev => ({
        ...prev,
        gpsSimNo: gpsSimNoError
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Check if user is logged in and has permission
      if (!currentUser) {
        alert('You must be logged in to perform this action.');
        return;
      }
      
      // Validate all form fields
      if (!validateForm()) {
        // Find the first error and scroll to it
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (element as HTMLElement).focus();
          }
        }
        return;
      }
      
      // Format date fields if needed
      let validFrom = formData.validFrom || '';
      let validTo = formData.validTo || '';
      
      // Log the date values
      console.log('Date values before submission:', {
        validFrom,
        validTo
      });
      
      // Format gpInstalled and gpsSimNo to match database ENUM values
      const gpInstalled = formData.gpInstalled === 'Yes' ? 'Yes' : 'No';
      const gpsSimNo = formData.gpsSimNo === 'Active' ? 'Active' : 'Inactive';
      
      // Map frontend field names to backend field names
      const vanData = {
        state: formData.state,
        region: formData.region,
        zone: formData.zone,
        sector: formData.sector,
        city: formData.city,
        vehicle_no: formData.vehicleNo,
        registration_number: formData.vehicleNo, // Using vehicleNo as registration_number
        make: formData.make,
        type: formData.type,
        model_year: formData.modelYear,
        contract_type: formData.contractType,
        owner_name: formData.ownerName,
        travels_name: formData.travelsName,
        address: formData.address,
        driver_name: formData.driverName,
        mobile_no: formData.mobileNo,
        valid_from: validFrom,
        valid_to: validTo,
        rcl_incharge: formData.rclIncharge,
        gp_installed: gpInstalled,
        gps_sim_no: gpsSimNo
      };

      console.log('Submitting van data:', vanData);
      console.log('Current user role:', currentUser.role);

      let result;
      if (editingVan) {
        result = await apiService.updateVan(editingVan.id, vanData);
      } else {
        result = await apiService.createVan(vanData);
      }
      
      console.log('Van saved successfully:', result);
      
      // Close the form first to improve perceived performance
      handleCancelForm();
      
      // Then refresh the data
      try {
        await fetchVans();
      } catch (fetchError) {
        console.error('Error refreshing data after save:', fetchError);
        // If we can't refresh, at least add the new item to the current list
        if (!editingVan && result) {
          setVans(prev => [...prev, result]);
        }
      }
    } catch (error) {
      console.error('Error saving van:', error);
      
      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Access denied') || error.message.includes('permission')) {
          alert('Access denied: You do not have permission to perform this action. Please contact your administrator.');
        } else if (error.message.includes('Authentication required')) {
          alert('Your session has expired. Please log in again.');
          // Optionally redirect to login page
        } else if (error.message.includes('duplicate')) {
          alert('A van with this vehicle number already exists.');
        } else {
          alert('Error saving van: ' + error.message);
        }
      } else {
        alert('An unknown error occurred while saving the van. Please try again later.');
      }
    }
  };

  const handleEdit = (van: Van) => {
    console.log('Editing van:', van);
    
    // Format date fields if needed
    let validFrom = van.validFrom || '';
    let validTo = van.validTo || '';
    
    // Log the date values
    console.log('Date values before setting form data:', {
      validFrom,
      validTo
    });
    
    setEditingVan(van);
    setFormData({
      state: van.state,
      region: van.region,
      zone: van.zone,
      sector: van.sector,
      city: van.city,
      vehicleNo: van.vehicleNo,
      make: van.make,
      type: van.type,
      modelYear: van.modelYear,
      contractType: van.contractType,
      ownerName: van.ownerName,
      travelsName: van.travelsName,
      address: van.address,
      driverName: van.driverName,
      mobileNo: van.mobileNo,
      validFrom: validFrom,
      validTo: validTo,
      rclIncharge: van.rclIncharge,
      gpInstalled: van.gpInstalled,
      gpsSimNo: van.gpsSimNo,
    });
    
    // Log the form data after setting
    console.log('Form data after setting:', {
      validFrom: validFrom,
      validTo: validTo
    });
    
    // Clear any previous validation errors
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this van?')) {
      try {
        await apiService.deleteVan(id);
        await fetchVans(); // Refresh the list
      } catch (error) {
        console.error('Error deleting van:', error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVan(null);
    // Clear any validation errors
    setErrors({});
    setFormData({
      state: '',
      region: '',
      zone: '',
      sector: '',
      city: '',
      vehicleNo: '',
      make: '',
      type: '',
      modelYear: '',
      contractType: '',
      ownerName: '',
      travelsName: '',
      address: '',
      driverName: '',
      mobileNo: '',
      validFrom: '',
      validTo: '',
      rclIncharge: '',
      gpInstalled: 'No', // Default value matching database ENUM
      gpsSimNo: 'Inactive', // Default value matching database ENUM
    });
  };

  // Log the current state of vans and user
  console.log('Current vans state:', vans);
  console.log('Current user:', currentUser);
  console.log('User role:', currentUser?.role);
  
  // Safely filter vans, handling potential undefined values
  const filteredVans = vans.filter(van => {
    if (!van || !van.vehicleNo) {
      console.warn('Found invalid van in filter:', van);
      return false;
    }
    return van.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Check if user has permission to add/edit vans
  // Allow all roles except 'mace sector head' to add/edit vans
  const canManageVans = currentUser && currentUser.role !== 'mace sector head';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Van Master</h1>
        {canManageVans && (
          <button
            onClick={() => {
              console.log('Add New Van button clicked');
              console.log('Current user role:', currentUser?.role);
              // Reset form data to defaults
              setFormData({
                state: '',
                region: '',
                zone: '',
                sector: '',
                city: '',
                vehicleNo: '',
                make: '',
                type: '',
                modelYear: '',
                contractType: '',
                ownerName: '',
                travelsName: '',
                address: '',
                driverName: '',
                mobileNo: '',
                validFrom: '',
                validTo: '',
                rclIncharge: '',
                gpInstalled: 'No',
                gpsSimNo: 'Inactive',
              });
              // Clear any previous validation errors
              setErrors({});
              setEditingVan(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Van</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vehicle number..."
            className="flex-1 border border-gray-300 rounded-md shadow-sm px-3 py-2"
          />
          <button
            onClick={() => setSearchQuery('')}
            className="bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-md px-4 py-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Van Form */}
      {showForm && canManageVans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingVan ? 'Edit Van' : 'Add New Van'}
              </h2>
              <button 
                onClick={handleCancelForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  >
                    <option value="">Select State</option>
                    <option value="Tamilnadu">Tamilnadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.state}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.region ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  >
                    <option value="">Select Region</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                  {errors.region && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.region}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.zone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  >
                    <option value="">Select Zone</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                  {errors.zone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.zone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sector <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="sector"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={formData.sector}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.sector ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                    style={{ appearance: 'textfield' }}
                  />
                  {errors.sector && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.sector}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    pattern="[A-Za-z\s]+"
                    title="City name should only contain letters and spaces"
                    className={`block w-full border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle No <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="vehicleNo"
                    value={formData.vehicleNo}
                    onChange={handleInputChange}
                    placeholder="e.g., TN-01-AB-1234"
                    className={`block w-full border ${errors.vehicleNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.vehicleNo && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.vehicleNo}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    placeholder="e.g., Tata, Mahindra"
                    className={`block w-full border ${errors.make ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.make && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.make}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., SUV, Sedan"
                    className={`block w-full border ${errors.type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.type}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="modelYear"
                    value={formData.modelYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2022"
                    type="number"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    className={`block w-full border ${errors.modelYear ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.modelYear && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.modelYear}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleInputChange}
                    maxLength={20}
                    pattern="[A-Za-z0-9]+"
                    title="Contract type should only contain alphanumeric characters"
                    className={`block w-full border ${errors.contractType ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.contractType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.contractType}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    maxLength={30}
                    pattern="[A-Za-z\s]+"
                    title="Owner name should only contain letters and spaces"
                    className={`block w-full border ${errors.ownerName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.ownerName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.ownerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Travels Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="travelsName"
                    value={formData.travelsName}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.travelsName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.travelsName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.travelsName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleInputChange}
                    maxLength={30}
                    pattern="[A-Za-z\s]+"
                    title="Driver name should only contain letters and spaces"
                    className={`block w-full border ${errors.driverName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.driverName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.driverName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile No <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="mobileNo"
                    type="tel"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`block w-full border ${errors.mobileNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.mobileNo && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.mobileNo}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.validFrom ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.validFrom && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.validFrom}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid To <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="validTo"
                    type="date"
                    value={formData.validTo}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.validTo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.validTo && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.validTo}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RCL Incharge <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="rclIncharge"
                    value={formData.rclIncharge}
                    onChange={handleInputChange}
                    maxLength={30}
                    pattern="[A-Za-z\s]+"
                    title="RCL incharge should only contain letters and spaces"
                    className={`block w-full border ${errors.rclIncharge ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  />
                  {errors.rclIncharge && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.rclIncharge}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPS Installed <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gpInstalled"
                    value={formData.gpInstalled}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.gpInstalled ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                  >
                    <option value="">Select Option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {errors.gpInstalled && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.gpInstalled}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GPS SIM Status {formData.gpInstalled === 'Yes' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    name="gpsSimNo"
                    value={formData.gpsSimNo}
                    onChange={handleInputChange}
                    className={`block w-full border ${errors.gpsSimNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2`}
                    disabled={formData.gpInstalled !== 'Yes'}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {errors.gpsSimNo && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.gpsSimNo}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  {editingVan ? 'Update Van' : 'Add Van'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vans Table */}
      <div className="bg-white shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-2 border-gray-800">
            <thead className="bg-gray-50 border-b-2 border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Vehicle No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Make</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Model Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Contract Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Owner Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Travels Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Driver Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Mobile No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Valid From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">Valid To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">RCL Incharge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">GPS Installed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800 whitespace-nowrap">GPS SIM No</th>
                {currentUser && currentUser.role !== 'mace sector head' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-gray-800">
              {isLoading ? (
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={currentUser && currentUser.role !== 'mace sector head' ? 21 : 20} className="px-6 py-4 text-center text-sm text-gray-500 whitespace-nowrap">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading vans data...</p>
                  </td>
                </tr>
              ) : filteredVans.length === 0 ? (
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={currentUser && currentUser.role !== 'mace sector head' ? 21 : 20} className="px-6 py-4 text-center text-sm text-gray-500 whitespace-nowrap">
                    No vans found.
                  </td>
                </tr>
              ) : (
                filteredVans.map((van: Van) => (
                  <tr key={van.id} className="hover:bg-gray-50 border-b-2 border-gray-800">
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.state}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.region}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.zone}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.sector}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.city}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.vehicleNo}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.make}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.type}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.modelYear}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.contractType}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.ownerName}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.travelsName}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.address}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.driverName}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.mobileNo}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{new Date(van.validFrom).toLocaleDateString()}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{new Date(van.validTo).toLocaleDateString()}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.rclIncharge}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.gpInstalled}</td>
                    <td className="px-4 py-2 border-r-2 border-gray-800 whitespace-nowrap">{van.gpsSimNo}</td>
                    {currentUser && currentUser.role !== 'mace sector head' && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(van)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(van.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VanMasterPage;