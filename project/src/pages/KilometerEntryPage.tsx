import { useState, useEffect } from 'react';
import { Calendar, Truck, X } from 'lucide-react';
import { KilometerEntry, Van } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const KilometerEntryPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<KilometerEntry[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedVan, setSelectedVan] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<KilometerEntry | null>(null);
  const [error, setError] = useState<string>('');
  const [inlineEditingEntry, setInlineEditingEntry] = useState<string | null>(null);
  const [inlineEditField, setInlineEditField] = useState<'startReading' | 'endReading' | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<number>(0);
  
  const [formData, setFormData] = useState<Partial<KilometerEntry>>({
    vehicleNo: '',
    date: '',
    startReading: 0,
    endReading: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [entriesData, vansData] = await Promise.all([
        apiService.getKilometerEntries(),
        apiService.getVans()
      ]);
      setEntries(entriesData.map(e => ({ ...e, authorized: e.authorized ?? false })));
      setVans(vansData);
    } catch (error) {
      console.error('Error fetching kilometer data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields, parse as numbers and filter non-numeric characters
    if (['startReading', 'endReading'].includes(name)) {
      // Only allow numeric input
      const numericValue = value.replace(/[^0-9]/g, '');
      
      // If the field is empty, set it to undefined instead of 0
      // This helps with validation in the form submission
      const numValue = numericValue === '' ? 0 : parseInt(numericValue);
      
      setFormData({ 
        ...formData, 
        [name]: numValue,
      });
      
      // Clear any previous errors
      setError('');
      
      // If both readings are present, validate them
      if (name === 'startReading' && formData.endReading !== undefined) {
        if (numValue >= formData.endReading) {
          setError('Opening KM must be less than Closing KM');
        }
      } else if (name === 'endReading' && formData.startReading !== undefined) {
        if (numValue <= formData.startReading) {
          setError('Closing KM must be greater than Opening KM');
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      
      // Validate form data
      if (!formData.vehicleNo) {
        setError('Please select a vehicle');
        return;
      }
      
      if (!formData.date) {
        setError('Please select a date');
        return;
      }
      
      if (formData.startReading === undefined || formData.startReading === null) {
        setError('Please enter an opening KM reading');
        return;
      }
      
      if (formData.endReading === undefined || formData.endReading === null) {
        setError('Please enter a closing KM reading');
        return;
      }
      
      // Validate readings
      if (formData.endReading <= formData.startReading) {
        setError('Closing KM must be greater than Opening KM');
        return;
      }
      
      // Map frontend field names to backend field names
      const selectedVan = vans.find(v => v.vehicleNo === formData.vehicleNo);
      
      if (!selectedVan || !selectedVan.id) {
        setError('Invalid vehicle selection. Please select a valid vehicle.');
        return;
      }
      
      // Ensure we have a valid date
      let formattedDate = '';
      if (formData.date) {
        // If the date already has a time component, extract just the date part
        if (formData.date.includes('T')) {
          formattedDate = formData.date.split('T')[0];
        } else {
          // Otherwise use it as is
          formattedDate = formData.date;
        }
      } else {
        // Default to today if no date provided
        formattedDate = new Date().toISOString().split('T')[0];
      }
      
      console.log('Using formatted date for submission:', formattedDate);
      
      try {
        if (editingEntry) {
          // Update existing entry
          const updateData = {
            van_id: selectedVan.id,
            vehicle_no: formData.vehicleNo,
            date: formattedDate,
            start_reading: Number(formData.startReading),
            end_reading: Number(formData.endReading)
          };
          
          console.log('Updating kilometer entry with data:', updateData);
          await apiService.updateKilometerEntry(editingEntry.id, updateData);
        } else {
          // Add new entry
          const entryData = {
            van_id: selectedVan.id,
            vehicle_no: formData.vehicleNo,
            date: formattedDate,
            start_reading: Number(formData.startReading),
            end_reading: Number(formData.endReading)
          };
          
          console.log('Creating kilometer entry with data:', entryData);
          await apiService.createKilometerEntry(entryData);
        }
        
        // Refresh data and close form
        await fetchData();
        handleCancelForm();
      } catch (error) {
        console.error('API error saving kilometer entry:', error);
        
        // Display more specific error messages
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to save kilometer entry. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleEdit = (entry: KilometerEntry) => {
    console.log('Editing entry:', entry);
    
    // Format the date properly for the date input
    let formattedDate = '';
    if (entry.date) {
      // If the date is in ISO format (with time), extract just the date part
      if (entry.date.includes('T')) {
        formattedDate = entry.date.split('T')[0];
      } else {
        // If it's already just a date string, use it directly
        formattedDate = entry.date;
      }
    }
    
    console.log('Formatted date for form:', formattedDate);
    
    setEditingEntry(entry);
    setFormData({
      vehicleNo: entry.vehicleNo,
      date: formattedDate,
      startReading: entry.startReading,
      endReading: entry.endReading,
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setError('');
    setFormData({
      vehicleNo: '',
      date: '',
      startReading: 0,
      endReading: 0,
    });
  };

  const handleAuthorize = async (id: string, currentStatus: boolean) => {
    try {
      setError('');
      await apiService.authorizeKilometerEntry(id, !currentStatus);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error authorizing entry:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update authorization. Please try again.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this kilometer entry?')) {
      try {
        setError('');
        await apiService.deleteKilometerEntry(id);
        await fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error deleting entry:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to delete kilometer entry. Please try again.');
        }
      }
    }
  };
  
  const startInlineEdit = (entry: KilometerEntry, field: 'startReading' | 'endReading') => {
    if (user?.role === 'mace sector head') return; // Sector heads can't edit
    
    setInlineEditingEntry(entry.id);
    setInlineEditField(field);
    setInlineEditValue(entry[field]);
  };
  
  const handleInlineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const inputValue = e.target.value.replace(/[^0-9]/g, '');
    
    // Convert to number or use 0 if empty
    const value = inputValue === '' ? 0 : parseInt(inputValue);
    
    setInlineEditValue(value);
    
    // Clear any previous errors
    setError('');
  };
  
  const saveInlineEdit = async (entry: KilometerEntry) => {
    if (!inlineEditField || inlineEditingEntry !== entry.id) return;
    
    try {
      setError('');
      
      // Get the new values for start and end readings
      const newStartReading = inlineEditField === 'startReading' ? Number(inlineEditValue) : Number(entry.startReading);
      const newEndReading = inlineEditField === 'endReading' ? Number(inlineEditValue) : Number(entry.endReading);
      
      // Validate that startReading is less than endReading
      if (newStartReading >= newEndReading) {
        setError(inlineEditField === 'startReading' 
          ? 'Opening KM cannot be greater than or equal to Closing KM' 
          : 'Closing KM cannot be less than or equal to Opening KM');
        return;
      }
      
      // Calculate the new distance
      const newDistance = newEndReading - newStartReading;
      
      // Validate the distance is reasonable (e.g., not more than 1000 km per day)
      if (newDistance > 1000) {
        setError('Distance seems unreasonable (>1000 km). Please verify readings.');
        return;
      }
      
      console.log('Updating kilometer entry with new values:', {
        startReading: newStartReading,
        endReading: newEndReading,
        distance: newDistance
      });
      
      // Only update the field that was changed to minimize conflicts
      const updateData: any = {};
      
      // Only add the fields that were actually edited
      if (inlineEditField === 'startReading') {
        updateData.start_reading = newStartReading;
      } else if (inlineEditField === 'endReading') {
        updateData.end_reading = newEndReading;
      }
      
      // Add these fields only if they're needed for validation on the backend
      if (!updateData.van_id && entry.vanId) {
        updateData.van_id = entry.vanId;
      }
      
      if (!updateData.vehicle_no && entry.vehicleNo) {
        updateData.vehicle_no = entry.vehicleNo;
      }
      
      if (!updateData.date && entry.date) {
        updateData.date = entry.date;
      }
      
      console.log('Sending update with data:', updateData);
      
      try {
        // Update the entry in the database
        const updatedEntry = await apiService.updateKilometerEntry(entry.id, updateData);
        console.log('Updated entry from API:', updatedEntry);
        
        // Update the entry in the local state immediately for better UX
        setEntries(prevEntries => 
          prevEntries.map(e => 
            e.id === entry.id 
              ? {
                  ...e,
                  startReading: newStartReading,
                  endReading: newEndReading,
                  distance: newDistance
                } 
              : e
          )
        );
        
        // Reset inline editing state
        cancelInlineEdit();
        
        // Then refresh all data from the server
        await fetchData();
      } catch (error) {
        console.error('Error from API when updating kilometer entry:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to update kilometer entry. Please try again.');
        }
        
        // Keep the inline edit mode active so the user can correct the input
      }
    } catch (error) {
      console.error('Error in saveInlineEdit function:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update kilometer entry. Please try again.');
      }
    }
  };
  
  const cancelInlineEdit = () => {
    setInlineEditingEntry(null);
    setInlineEditField(null);
    setInlineEditValue(0);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, entry: KilometerEntry) => {
    if (e.key === 'Enter') {
      saveInlineEdit(entry);
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  // Filter entries based on selected date and van
  const filteredEntries = entries.filter(entry => {
    const matchesDate = !selectedDate || entry.date === selectedDate;
    const matchesVan = selectedVan === 'all' || entry.vehicleNo === selectedVan;
    
    return matchesDate && matchesVan;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Kilometer Entry</h1>
        {user?.role !== 'mace sector head' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            Add Kilometer Entry
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                <option key={van.id} value={van.vehicleNo}>
                  {van.vehicleNo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kilometer Entry Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-gray-300" style={{ borderRadius: '0.5rem', boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingEntry ? 'Edit Kilometer Entry' : 'Add New Kilometer Entry'}
              </h2>
              <button 
                onClick={handleCancelForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <option value="">Select Vehicle</option>
                  {vans.map(van => (
                    <option key={van.id} value={van.vehicleNo}>
                      {van.vehicleNo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="startReading" className="block text-sm font-medium text-gray-700 mb-1">
                  Opening KM *
                </label>
                <input
                  id="startReading"
                  name="startReading"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  value={formData.startReading}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="endReading" className="block text-sm font-medium text-gray-700 mb-1">
                  Closing KM *
                </label>
                <input
                  id="endReading"
                  name="endReading"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  value={formData.endReading}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                />
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
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kilometer Entries Table */}
      <div className="bg-white shadow overflow-hidden">
        {user?.role !== 'mace sector head' && (
          <div className="bg-blue-50 p-3 border-b border-gray-300">
            <div className="flex items-center text-sm text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Tip:</strong> You can click on the Opening KM or Closing KM values to edit them directly. The Day KM will be automatically calculated.
              </span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full border-2 border-gray-800">
            <thead className="bg-gray-50 border-b-2 border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  Vehicle No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  {user?.role !== 'mace sector head' ? (
                    <div className="flex items-center">
                      <span>Opening KM</span>
                      <span className="ml-1 text-blue-500 text-xs normal-case font-normal">(editable)</span>
                    </div>
                  ) : (
                    <span>Opening KM</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  {user?.role !== 'mace sector head' ? (
                    <div className="flex items-center">
                      <span>Closing KM</span>
                      <span className="ml-1 text-blue-500 text-xs normal-case font-normal">(editable)</span>
                    </div>
                  ) : (
                    <span>Closing KM</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  <div className="flex items-center">
                    <span>Day KM</span>
                    <span className="ml-1 text-gray-400 text-xs normal-case font-normal">(calculated)</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authorization
                </th>

              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-gray-800">
              {isLoading ? (
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading kilometer entries...</p>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No kilometer entries found for the selected filters
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 border-b-2 border-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r-2 border-gray-800">
                      {entry.vehicleNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r-2 border-gray-800">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${user?.role !== 'mace sector head' ? 'cursor-pointer hover:bg-blue-50' : ''} border-r-2 border-gray-800`}
                      onClick={() => startInlineEdit(entry, 'startReading')}
                    >
                      {inlineEditingEntry === entry.id && inlineEditField === 'startReading' ? (
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="w-24 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                          value={inlineEditValue}
                          onChange={handleInlineInputChange}
                          onBlur={() => saveInlineEdit(entry)}
                          onKeyDown={(e) => handleKeyDown(e, entry)}
                          autoFocus
                        />
                      ) : (
                        <div className={`flex items-center ${user?.role !== 'mace sector head' ? 'group' : ''}`}>
                          <span className={user?.role !== 'mace sector head' ? 'border-b border-dashed border-gray-400 group-hover:border-blue-500 group-hover:text-blue-600' : ''}>
                            {entry.startReading}
                          </span>
                          {user?.role !== 'mace sector head' && (
                            <span className="ml-2 text-xs text-gray-500 group-hover:text-blue-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${user?.role !== 'mace sector head' ? 'cursor-pointer hover:bg-blue-50' : ''} border-r-2 border-gray-800`}
                      onClick={() => startInlineEdit(entry, 'endReading')}
                    >
                      {inlineEditingEntry === entry.id && inlineEditField === 'endReading' ? (
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className="w-24 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                          value={inlineEditValue}
                          onChange={handleInlineInputChange}
                          onBlur={() => saveInlineEdit(entry)}
                          onKeyDown={(e) => handleKeyDown(e, entry)}
                          autoFocus
                        />
                      ) : (
                        <div className={`flex items-center ${user?.role !== 'mace sector head' ? 'group' : ''}`}>
                          <span className={user?.role !== 'mace sector head' ? 'border-b border-dashed border-gray-400 group-hover:border-blue-500 group-hover:text-blue-600' : ''}>
                            {entry.endReading}
                          </span>
                          {user?.role !== 'mace sector head' && (
                            <span className="ml-2 text-xs text-gray-500 group-hover:text-blue-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r-2 border-gray-800">
                      <div className="flex items-center">
                        <span className={`${inlineEditingEntry === entry.id ? 'text-blue-600 font-medium' : ''}`}>
                          {inlineEditingEntry === entry.id && inlineEditField === 'startReading' 
                            ? (inlineEditValue < entry.endReading ? entry.endReading - inlineEditValue : 'Invalid')
                            : inlineEditingEntry === entry.id && inlineEditField === 'endReading'
                              ? (inlineEditValue > entry.startReading ? inlineEditValue - entry.startReading : 'Invalid')
                              : (entry.distance || (entry.endReading - entry.startReading))}
                        </span>
                        {inlineEditingEntry === entry.id ? (
                          <span className="ml-2 text-xs text-blue-600 italic">(preview)</span>
                        ) : user?.role !== 'mace sector head' && (
                          <span className="ml-2 text-xs text-gray-500">
                            (auto-calculated)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.authorized 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.authorized ? "Authorized" : "Pending"}
                      </span>
                      {user?.role === 'mace sector head' && (
                        <button
                          onClick={() => handleAuthorize(entry.id, entry.authorized || false)}
                          className={`ml-3 px-3 py-1 rounded-md text-xs font-semibold ${
                            entry.authorized
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } border border-gray-300`}
                        >
                          {entry.authorized ? "Revoke" : "Authorize"}
                        </button>
                      )}
                    </td>

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

export default KilometerEntryPage;