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
    
    // For numeric fields, parse as numbers
    if (['startReading', 'endReading'].includes(name)) {
      const numValue = parseInt(value) || 0;
      setFormData({ 
        ...formData, 
        [name]: numValue,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      
      // Map frontend field names to backend field names
      const selectedVan = vans.find(v => v.vehicleNo === formData.vehicleNo);
      
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
      
      if (editingEntry) {
        // Update existing entry
        const updateData = {
          van_id: selectedVan?.id || '',
          vehicle_no: formData.vehicleNo || '',
          date: formattedDate,
          start_reading: formData.startReading || 0,
          end_reading: formData.endReading || 0
        };
        
        console.log('Updating kilometer entry with data:', updateData);
        await apiService.updateKilometerEntry(editingEntry.id, updateData);
      } else {
        // Add new entry
        const entryData = {
          van_id: selectedVan?.id || '',
          vehicle_no: formData.vehicleNo || '',
          date: formattedDate,
          start_reading: formData.startReading || 0,
          end_reading: formData.endReading || 0
        };
        
        console.log('Creating kilometer entry with data:', entryData);
        await apiService.createKilometerEntry(entryData);
      }
      
      // Refresh data and close form
      await fetchData();
      handleCancelForm();
    } catch (error) {
      console.error('Error saving kilometer entry:', error);
      setError('Failed to save kilometer entry. Please try again.');
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
      setError('Failed to update authorization. Please try again.');
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
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
                  type="number"
                  min="0"
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
                  type="number"
                  min={formData.startReading}
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening KM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing KM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authorization
                </th>
                {user?.role !== 'mace sector head' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={user?.role !== 'mace sector head' ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading kilometer entries...</p>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'mace sector head' ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No kilometer entries found for the selected filters
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.vehicleNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.startReading.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.endReading.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(entry.distance || (entry.endReading - entry.startReading)).toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                    {user?.role !== 'mace sector head' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
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

export default KilometerEntryPage;