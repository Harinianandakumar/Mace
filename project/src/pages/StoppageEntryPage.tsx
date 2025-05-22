import { useState, useEffect } from 'react';
import { Plus, Calendar, Truck, Edit, AlertTriangle, X, Clock, Check } from 'lucide-react';
import { Stoppage, Van } from '../types';
import { mockStoppages, mockVans } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const StoppageEntryPage = () => {
  const { user } = useAuth();
  const [stoppages, setStoppages] = useState<Stoppage[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(''); // Show all by default
  const [selectedVan, setSelectedVan] = useState<string>('all');
  const [editingStoppage, setEditingStoppage] = useState<Stoppage | null>(null);

  // Only the required fields, no location
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
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setStoppages(mockStoppages.map(s => ({ ...s, authorized: s.authorized ?? false })));
        setVans(mockVans);
      } catch (error) {
        console.error('Error fetching stoppage data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Removed useEffect for location

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStoppage) {
      // Update existing stoppage
      const updatedStoppages = stoppages.map(stoppage =>
        stoppage.id === editingStoppage.id
          ? {
              ...stoppage,
              vanId: formData.vehicleNo,
              date: formData.fromDate,
              startTime: '09:00',
              endTime: formData.toDate ? '18:00' : undefined,
              reason: formData.reason,
              notes: formData.spareVehicle,
              status: stoppage.status,
            }
          : stoppage
      );
      setStoppages(updatedStoppages);
    } else {
      // Add new stoppage
      const newStoppage: Stoppage = {
        id: `${stoppages.length + 1}`,
        vanId: formData.vehicleNo,
        date: formData.fromDate,
        startTime: '09:00',
        endTime: formData.toDate ? '18:00' : undefined,
        reason: formData.reason,
        status: 'ongoing',
        notes: formData.spareVehicle,
      };
      setStoppages([...stoppages, newStoppage]);
    }

    handleCancelForm();
  };

  const handleEdit = (stoppage: Stoppage) => {
    setEditingStoppage(stoppage);
    setFormData({
      vehicleNo: stoppage.vanId,
      fromDate: stoppage.date,
      toDate: stoppage.endTime ? stoppage.date : '',
      spareVehicle: stoppage.notes || '',
      reason: stoppage.reason,
    });
    setShowForm(true);
  };

  const handleResolve = (id: string) => {
    const updatedStoppages = stoppages.map(stoppage =>
      stoppage.id === id
        ? {
            ...stoppage,
            status: 'resolved' as 'resolved',
            endTime: new Date().toTimeString().slice(0, 5),
          }
        : stoppage
    );
    setStoppages(updatedStoppages as Stoppage[]);
  };

  const handleAuthorize = (id: string) => {
    setStoppages(stoppages =>
      stoppages.map(stoppage =>
        stoppage.id === id ? { ...stoppage, authorized: !stoppage.authorized } : stoppage
      )
    );
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

  // Filter stoppages based on selected date and van
  const filteredStoppages = stoppages.filter(stoppage => {
    const matchesDate = !selectedDate || stoppage.date === selectedDate;
    const matchesVan = selectedVan === 'all' || stoppage.vanId === selectedVan;
    return matchesDate && matchesVan;
  });

  // Sort by status (ongoing first) and then by start time
  const sortedStoppages = [...filteredStoppages].sort((a, b) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
    if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
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
        {user?.role !== 'admin' && (
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
      {showForm && user?.role !== 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
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
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
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
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                    placeholder="Enter spare vehicle number"
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
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
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
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
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
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      stoppage.status === 'ongoing' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        stoppage.status === 'ongoing' ? 'text-red-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{stoppage.reason}</h3>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          stoppage.status === 'ongoing' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {stoppage.status.charAt(0).toUpperCase() + stoppage.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Van: {getVanRegistration(stoppage.vanId)}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(stoppage.date).toLocaleDateString()} at {stoppage.startTime}
                        {stoppage.endTime && ` - ${stoppage.endTime}`}
                      </div>
                      {stoppage.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          {stoppage.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs font-semibold ${stoppage.authorized ? 'text-green-700' : 'text-yellow-700'}`}>
                          {stoppage.authorized ? 'Authorized' : 'Yet to Authorize'}
                        </span>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleAuthorize(stoppage.id)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold border border-gray-300 ${
                              stoppage.authorized
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            } hover:bg-blue-50`}
                          >
                            {stoppage.authorized ? 'Revoke' : 'Authorize'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 md:self-start">
                    {stoppage.status === 'ongoing' && (
                      <>
                        <button
                          onClick={() => handleResolve(stoppage.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
                        </button>
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

