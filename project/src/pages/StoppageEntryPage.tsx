import { useState, useEffect } from 'react';
import { Plus, Calendar, Truck, Edit, X } from 'lucide-react';
import { Stoppage, Van } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StoppageEntryPage = () => {
  const { user } = useAuth();
  const [stoppages, setStoppages] = useState<Stoppage[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedVan, setSelectedVan] = useState<string>('all');
  const [editingStoppage, setEditingStoppage] = useState<Stoppage | null>(null);

  const [formData, setFormData] = useState<{
    vehicleNo: string;
    fromDate: string;
    toDate: string;
    spareVehicle: string;
    reason: string;
  }>({
    vehicleNo: '',
    fromDate: '',
    toDate: '',
    spareVehicle: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching stoppages and vans data...');
      
      const [stoppagesData, vansData] = await Promise.all([
        apiService.getStoppages().catch(error => {
          console.error('Failed to fetch stoppages:', error);
          return [];
        }),
        apiService.getVans().catch(error => {
          console.error('Failed to fetch vans:', error);
          return [];
        })
      ]);
      
      setStoppages(stoppagesData);
      setVans(vansData);
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Special handling for spareVehicle field to enforce vehicle number format
    if (name === 'spareVehicle') {
      // Allow only uppercase letters, numbers, and hyphens in the correct format
      // Format: XX-YY-ZZZZ (state code-district code-unique number)
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First, verify that we have a valid token
      const token = localStorage.getItem('mace_token');
      if (!token) {
        console.error('No token found before submitting stoppage form');
        alert('Your session appears to be invalid. Please log in again.');
        window.location.href = '/login';
        return;
      }
      
      console.log('Token verification before form submission:', token ? 'Token exists' : 'No token');
      
      // Map frontend field names to backend field names
      const selectedVan = vans.find(v => v.id === formData.vehicleNo);
      
      // Get current date and time
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      // Determine the status based on whether toDate is provided
      const status = formData.toDate ? 'resolved' : 'ongoing';
      
      // Make sure we have a valid vehicle_no
      if (!selectedVan) {
        alert('Please select a valid vehicle');
        return;
      }
      
      // Use registration number as the primary identifier, fallback to vehicleNo
      const vehicleIdentifier = selectedVan.registrationNumber || selectedVan.vehicleNo;
      
      if (!vehicleIdentifier) {
        alert('Selected vehicle has no registration number or vehicle number');
        return;
      }
      
      console.log('Selected van:', selectedVan);
      
      // Format dates to ensure they're in YYYY-MM-DD format
      const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        
        // Otherwise, parse and format
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      
      const stoppageData = {
        van_id: formData.vehicleNo,
        vehicle_no: vehicleIdentifier,
        from_date: formatDate(formData.fromDate) || '', // Format date properly
        to_date: formatDate(formData.toDate), // Format date properly
        spare_vehicle: formData.spareVehicle || '',
        reason: formData.reason,
        status: status as 'ongoing' | 'resolved',
      };
      
      console.log('Submitting stoppage data:', stoppageData);
      
      // Check user role
      console.log('Current user role:', user?.role);
      
      let result;
      try {
        // Verify token again right before API call
        const tokenBeforeApiCall = localStorage.getItem('mace_token');
        console.log('Token before API call:', tokenBeforeApiCall ? 'Token exists' : 'No token');
        
        if (editingStoppage) {
          result = await apiService.updateStoppage(editingStoppage.id, stoppageData);
        } else {
          result = await apiService.createStoppage(stoppageData);
        }
        
        // Show success message
        alert(editingStoppage ? 'Stoppage updated successfully!' : 'Stoppage added successfully!');
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Check if token is still valid after the error
        const tokenAfterError = localStorage.getItem('mace_token');
        console.log('Token after API error:', tokenAfterError ? 'Token exists' : 'No token');
        
        throw apiError; // Re-throw to be caught by the outer catch block
      }
      
      console.log('Stoppage saved successfully:', result);
      
      // Close the form first to improve perceived performance
      handleCancelForm();
      
      // Then refresh the data
      try {
        await fetchData();
      } catch (fetchError) {
        console.error('Error refreshing data after save:', fetchError);
        // If we can't refresh, at least add the new item to the current list
        if (!editingStoppage && result) {
          setStoppages(prev => [...prev, result]);
        }
      }
    } catch (error) {
      console.error('Error saving stoppage:', error);
      
      // Provide more detailed error information
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more user-friendly messages for common errors
        if (errorMessage.includes('van_id')) {
          errorMessage = 'Please select a valid vehicle';
        } else if (errorMessage.includes('date format')) {
          errorMessage = 'Please enter valid dates in YYYY-MM-DD format';
        } else if (errorMessage.includes('required field')) {
          errorMessage = 'Please fill in all required fields';
        } else if (errorMessage.includes('maximum allowed length')) {
          errorMessage = 'One or more fields are too long. Please shorten your input.';
        } else if (errorMessage.includes('Access denied') || errorMessage.includes('permission')) {
          errorMessage = 'You do not have permission to perform this action. Please contact your administrator.';
        } else if (errorMessage.includes('Authentication required')) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (errorMessage.includes('Database error')) {
          errorMessage = 'There was a problem saving your data. Please try again or contact support.';
        }
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      console.log('Detailed error information:', {
        error,
        errorType: typeof error,
        errorMessage
      });
      
      alert('Error saving stoppage: ' + errorMessage);
      
      // If it's an authentication error, redirect to login
      if (errorMessage.includes('session has expired') || 
          errorMessage.includes('log in again') ||
          errorMessage.includes('Authentication required') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('401')) {
        
        console.log('Authentication error detected, clearing token and redirecting to login');
        
        // Clear all auth data
        localStorage.removeItem('mace_token');
        localStorage.removeItem('mace_user');
        
        // Show a user-friendly message
        alert('Your session has expired or is invalid. You will be redirected to the login page.');
        
        // Redirect after a short delay to ensure the alert is seen
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
  };

  const handleEdit = (stoppage: Stoppage) => {
    console.log('Editing stoppage:', stoppage);
    
    // Format the dates properly for the form
    let fromDate = '';
    let toDate = '';
    
    // Process fromDate
    if (stoppage.date) {
      // If the date is in ISO format (with time), extract just the date part
      if (stoppage.date.includes('T')) {
        fromDate = stoppage.date.split('T')[0];
      } else {
        // If it's already just a date string, use it directly
        fromDate = stoppage.date;
      }
    }
    
    // Process toDate - use the toDate field if available
    if (stoppage.toDate) {
      // If it's already a date string, use it directly
      toDate = stoppage.toDate;
      console.log('Using toDate from stoppage:', toDate);
    } else if (stoppage.status === 'resolved' && stoppage.date) {
      // Fallback: if status is resolved but no toDate, use the same date as fromDate
      toDate = fromDate;
      console.log('Fallback: Using fromDate as toDate:', toDate);
    }
    
    console.log('Stoppage data:', {
      id: stoppage.id,
      vanId: stoppage.vanId,
      date: stoppage.date,
      toDate: stoppage.toDate,
      status: stoppage.status
    });
    console.log('Formatted dates for form - fromDate:', fromDate, 'toDate:', toDate);
    
    setEditingStoppage(stoppage);
    setFormData({
      vehicleNo: stoppage.vanId,
      fromDate: fromDate,
      toDate: toDate,
      spareVehicle: stoppage.notes || '',
      reason: stoppage.reason,
    });
    setShowForm(true);
  };

  const handleAuthorize = async (id: string, currentStatus: boolean) => {
    try {
      await apiService.authorizeStoppage(id, !currentStatus);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error authorizing stoppage:', error);
    }
  };
  


  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStoppage(null);
    setFormData({
      vehicleNo: '',
      fromDate: '',
      toDate: '',
      spareVehicle: '',
      reason: '',
    });
  };

  // Log the current state of stoppages and vans
  console.log('Current stoppages state:', stoppages);
  console.log('Current vans state:', vans);
  
  // Safely filter stoppages, handling potential undefined values
  const filteredStoppages = stoppages.filter(stoppage => {
    if (!stoppage) {
      console.warn('Found invalid stoppage in filter:', stoppage);
      return false;
    }
    
    const matchesDate = !selectedDate || stoppage.date === selectedDate;
    const matchesVan = selectedVan === 'all' || stoppage.vanId === selectedVan;
    return matchesDate && matchesVan;
  });

  // Sort by date and time
  const sortedStoppages = [...filteredStoppages].sort((a, b) => {
    // Sort by date and time
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Get the van registration number for display
  const getVanRegistration = (vehicleNo: string) => {
    const van = vans.find(v => v.id === vehicleNo);
    return van ? van.registrationNumber : vehicleNo;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Van Stoppage Entry</h1>
        {user?.role !== 'mace sector head' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Report Stoppage</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:w-64">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Truck className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedVan}
              onChange={(e) => setSelectedVan(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Vans</option>
              {vans.map(van => (
                <option key={van.id} value={van.id}>
                  {van.registrationNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stoppage Entry Form */}
      {showForm && user?.role !== 'mace sector head' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-300" style={{ borderRadius: '0.5rem', boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingStoppage ? 'Edit Stoppage' : 'Report New Stoppage'}
              </h2>
              <button 
                onClick={handleCancelForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vehicleNo" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle No *
                  </label>
                  <select
                    id="vehicleNo"
                    name="vehicleNo"
                    required
                    value={formData.vehicleNo || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select vehicle</option>
                    {vans.map(van => (
                      <option key={van.id} value={van.id}>
                        {van.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                    From Date *
                  </label>
                  <input
                    id="fromDate"
                    name="fromDate"
                    type="date"
                    required
                    value={formData.fromDate || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                    To Date *
                  </label>
                  <input
                    id="toDate"
                    name="toDate"
                    type="date"
                    required
                    value={formData.toDate || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="spareVehicle" className="block text-sm font-medium text-gray-700 mb-1">
                    Spare Vehicle (if any)
                  </label>
                  <input
                    id="spareVehicle"
                    name="spareVehicle"
                    type="text"
                    value={formData.spareVehicle || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Format: XX-YY-ZZZZ (e.g., MH-01-AB1234)"
                    pattern="[A-Z0-9-]+"
                    title="Please enter a valid vehicle number format (e.g., MH-01-AB1234). Only uppercase letters, numbers, and hyphens are allowed."
                    maxLength={13}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Stoppage *
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    required
                    value={formData.reason || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="Mechanical Issue">Mechanical Issue</option>
                    <option value="Flat Tire">Flat Tire</option>
                    <option value="Traffic Congestion">Traffic Congestion</option>
                    <option value="Accident">Accident</option>
                    <option value="Weather Conditions">Weather Conditions</option>
                    <option value="Driver Break">Driver Break</option>
                    <option value="Fuel Refill">Fuel Refill</option>
                    <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {editingStoppage ? 'Update Stoppage' : 'Report Stoppage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stoppages List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-2 text-gray-500">Loading stoppage data...</p>
          </div>
        ) : sortedStoppages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No stoppage records found for the selected filters
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedStoppages.map((stoppage) => (
              <div key={stoppage.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{stoppage.reason}</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Van: {getVanRegistration(stoppage.vanId)}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(stoppage.date).toLocaleDateString()}
                      </div>
                      {stoppage.toDate && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          End Date: {new Date(stoppage.toDate).toLocaleDateString()}
                        </div>
                      )}
                      {stoppage.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          Spare Vehicle: {stoppage.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs font-semibold ${stoppage.authorized ? 'text-green-700' : 'text-yellow-700'}`}>
                          {stoppage.authorized ? 'Authorized' : 'Yet to Authorize'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 md:self-start">
                    {user?.role === 'mace sector head' ? (
                      /* Authorize button for mace sector head users */
                      <button
                        onClick={() => handleAuthorize(stoppage.id, stoppage.authorized || false)}
                        className={`inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md ${
                          stoppage.authorized
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        } hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {stoppage.authorized ? 'Revoke Authorization' : 'Authorize'}
                      </button>
                    ) : (
                      <>
                        {/* Edit button for non-admin users */}
                        <button
                          onClick={() => handleEdit(stoppage)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        

                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoppageEntryPage;

