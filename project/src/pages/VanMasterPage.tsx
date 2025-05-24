import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, X} from 'lucide-react';
import { Van } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const VanMasterPage = () => {
  const { user: currentUser } = useAuth();
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVan, setEditingVan] = useState<Van | null>(null);
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
    gpInstalled: '',
    gpsSimNo: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
        valid_from: formData.validFrom,
        valid_to: formData.validTo,
        rcl_incharge: formData.rclIncharge,
        gp_installed: formData.gpInstalled,
        gps_sim_no: formData.gpsSimNo
      };

      console.log('Submitting van data:', vanData);

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
      alert('Error saving van: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (van: Van) => {
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
      validFrom: van.validFrom,
      validTo: van.validTo,
      rclIncharge: van.rclIncharge,
      gpInstalled: van.gpInstalled,
      gpsSimNo: van.gpsSimNo,
    });
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
      gpInstalled: '',
      gpsSimNo: '',
    });
  };

  // Log the current state of vans
  console.log('Current vans state:', vans);
  
  // Safely filter vans, handling potential undefined values
  const filteredVans = vans.filter(van => {
    if (!van || !van.vehicleNo) {
      console.warn('Found invalid van in filter:', van);
      return false;
    }
    return van.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Van Master</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Van</span>
        </button>
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
      {showForm && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <input
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <input
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No *</label>
                  <input
                    name="vehicleNo"
                    required
                    value={formData.vehicleNo}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                  <input
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
                  <input
                    name="modelYear"
                    value={formData.modelYear}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                  <input
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <input
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Travels Name</label>
                  <input
                    name="travelsName"
                    value={formData.travelsName}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                  <input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                  <input
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    name="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input
                    name="validTo"
                    type="date"
                    value={formData.validTo}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RCL Incharge</label>
                  <input
                    name="rclIncharge"
                    value={formData.rclIncharge}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Installed</label>
                  <input
                    name="gpInstalled"
                    value={formData.gpInstalled}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS SIM No</label>
                  <input
                    name="gpsSimNo"
                    value={formData.gpsSimNo}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travels Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCL Incharge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS Installed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS SIM No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={21} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading vans data...</p>
                  </td>
                </tr>
              ) : filteredVans.length === 0 ? (
                <tr>
                  <td colSpan={21} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vans found.
                  </td>
                </tr>
              ) : (
                filteredVans.map((van: Van) => (
                  <tr key={van.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{van.state}</td>
                    <td className="px-4 py-2">{van.region}</td>
                    <td className="px-4 py-2">{van.zone}</td>
                    <td className="px-4 py-2">{van.sector}</td>
                    <td className="px-4 py-2">{van.city}</td>
                    <td className="px-4 py-2">{van.vehicleNo}</td>
                    <td className="px-4 py-2">{van.make}</td>
                    <td className="px-4 py-2">{van.type}</td>
                    <td className="px-4 py-2">{van.modelYear}</td>
                    <td className="px-4 py-2">{van.contractType}</td>
                    <td className="px-4 py-2">{van.ownerName}</td>
                    <td className="px-4 py-2">{van.travelsName}</td>
                    <td className="px-4 py-2">{van.address}</td>
                    <td className="px-4 py-2">{van.driverName}</td>
                    <td className="px-4 py-2">{van.mobileNo}</td>
                    <td className="px-4 py-2">{new Date(van.validFrom).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{new Date(van.validTo).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{van.rclIncharge}</td>
                    <td className="px-4 py-2">{van.gpInstalled}</td>
                    <td className="px-4 py-2">{van.gpsSimNo}</td>
                    <td className="px-4 py-2">
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