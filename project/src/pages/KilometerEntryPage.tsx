import { useState, useEffect } from 'react';
import { Calendar, Truck, X } from 'lucide-react';
import { KilometerEntry, Van } from '../types';
import { mockKilometerEntries, mockVans } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const KilometerEntryPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<KilometerEntry[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // Set selectedDate to empty string by default
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedVan, setSelectedVan] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<KilometerEntry | null>(null);
  
  const [formData, setFormData] = useState<Partial<KilometerEntry>>({
    vehicleNo: '',
    date: '', // No default date
    startReading: 0,
    endReading: 0,
  });

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setEntries(mockKilometerEntries.map(e => ({ ...e, authorized: e.authorized ?? false })));
        setVans(mockVans);
      } catch (error) {
        console.error('Error fetching kilometer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields, parse as numbers
    if (['startReading', 'endReading'].includes(name)) {
      const numValue = parseInt(value) || 0;
      
      // Calculate distance when either start or end reading changes
      
      setFormData({ 
        ...formData, 
        [name]: numValue,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEntry) {
      // Update existing entry
      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? { 
          ...entry, 
          ...formData,
          driverId: user?.id || 'unknown'
        } : entry
      );
      setEntries(updatedEntries);
      } else {
      // Add new entry
      const newEntry: KilometerEntry = {
        id: `${entries.length + 1}`,
        vehicleNo: formData.vehicleNo || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        startReading: formData.startReading || 0,
        endReading: formData.endReading || 0,
    
      };
      setEntries([...entries, newEntry]);
    }
    
    // Reset form
    handleCancelForm();
  };

  const handleEdit = (entry: KilometerEntry) => {
    setEditingEntry(entry);
    setFormData({
      vehicleNo: entry.vehicleNo,
      date: entry.date,
      startReading: entry.startReading,
      endReading: entry.endReading,
    
  
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      vehicleNo: '',
      date: new Date().toISOString().split('T')[0],
      startReading: 0,
      endReading: 0,
    });
  };

  const handleAuthorize = (id: string) => {
    setEntries(entries =>
      entries.map(entry =>
        entry.id === id ? { ...entry, authorized: !entry.authorized } : entry
      )
    );
  };

  // Filter entries based on selected date and van
  const filteredEntries = entries.filter(entry => {
    const matchesDate = !selectedDate || entry.date === selectedDate;
    const matchesVan = selectedVan === 'all' || entry.vehicleNo === selectedVan;
    
    return matchesDate && matchesVan;
  });

  // Get the van registration number for display

  // Helper to get van details by id

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Kilometer Entry</h1>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            {/* Icon and label */}
            Add Kilometer Entry
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
                <input
                  id="vehicleNo"
                  name="vehicleNo"
                  type="text"
                  required
                  value={formData.vehicleNo || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                />
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
                  GPS Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening KM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing KM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day KM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authorization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading kilometer entries...</p>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
                      {(vans.find(v => v.vehicleNo === entry.vehicleNo)?.gpsSimNo) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.startReading}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.endReading}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.endReading - entry.startReading}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.authorized ? "Authorized" : "Yet to Authorize"}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleAuthorize(entry.id)}
                          className={`ml-3 px-3 py-1 rounded-md text-xs font-semibold ${
                            entry.authorized
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          } border border-gray-300 hover:bg-blue-50`}
                        >
                          {entry.authorized ? "Revoke" : "Authorize"}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
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