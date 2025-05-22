import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, X} from 'lucide-react';
import { Van } from '../types';
import { mockVans } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const VanMasterPage = () => {
  const { user } = useAuth();
  const [vans, setVans] = useState<Van[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVan, setEditingVan] = useState<Van | null>(null);
  const [formData, setFormData] = useState<any>({
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
    // In a real app, this would be an API call
    const fetchVans = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setVans(mockVans);
      } catch (error) {
        console.error('Error fetching vans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVans();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Add or update van logic (update as per your Van type if needed)
    if (editingVan) {
      const updatedVans = vans.map(van =>
        van.id === editingVan.id ? { ...van, ...formData } : van
      );
      setVans(updatedVans);
    } else {
      const newVan: any = {
        id: `${vans.length + 1}`,
        ...formData,
      };
      setVans([...vans, newVan]);
    }
    handleCancelForm();
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this van?')) {
      setVans(vans.filter(van => van.id !== id));
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

  const filteredVans = vans.filter(van =>
    (van.vehicleNo && van.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (van.make && van.make.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (van.driverName && van.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (van.city && van.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Van Master</h1>
        {/* Show Add New Van button only for drivers */}
        {user?.role !== 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Van</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search vans by registration number, model, or driver..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Van Form - only for drivers */}
      {showForm && user?.role !== 'admin' && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">Select State</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi">Delhi</option>
                    {/* Add more states as needed */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                  <select
                    name="region"
                    required
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">Select Region</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                    <option value="North">North</option>
                    {/* Add more regions as needed */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone *</label>
                  <select
                    name="zone"
                    required
                    value={formData.zone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">Select Zone</option>
                    <option value="Zone 1">Zone 1</option>
                    <option value="Zone 2">Zone 2</option>
                    {/* Add more zones as needed */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label>
                  <input
                    name="sector"
                    type="text"
                    required
                    value={formData.sector}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No *</label>
                  <input
                    name="vehicleNo"
                    type="text"
                    required
                    value={formData.vehicleNo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                  <input
                    name="make"
                    type="text"
                    required
                    value={formData.make}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <input
                    name="type"
                    type="text"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model (Year) *</label>
                  <input
                    name="modelYear"
                    type="text"
                    required
                    value={formData.modelYear}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type *</label>
                  <input
                    name="contractType"
                    type="text"
                    required
                    value={formData.contractType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <input
                    name="ownerName"
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Travels Name *</label>
                  <input
                    name="travelsName"
                    type="text"
                    required
                    value={formData.travelsName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                  <input
                    name="driverName"
                    type="text"
                    required
                    value={formData.driverName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No *</label>
                  <input
                    name="mobileNo"
                    type="text"
                    required
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                  <input
                    name="validFrom"
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To *</label>
                  <input
                    name="validTo"
                    type="date"
                    required
                    value={formData.validTo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RCL Incharge *</label>
                  <input
                    name="rclIncharge"
                    type="text"
                    required
                    value={formData.rclIncharge}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GP Installed *</label>
                  <select
                    name="gpInstalled"
                    required
                    value={formData.gpInstalled}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Sim No *</label>
                  <select
                    name="gpsSimNo"
                    required
                    value={formData.gpsSimNo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  >
                    <option value="">Select</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model (Year)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travels Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RCL Incharge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GP Installed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS Sim No</th>
                {/* Show Actions column only for drivers */}
                {user?.role !== 'admin' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
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
                    {searchQuery ? 'No vans matching your search' : 'No vans available'}
                  </td>
                </tr>
              ) : (
                filteredVans.map((van: any) => (
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
                    <td className="px-4 py-2">{van.validFrom}</td>
                    <td className="px-4 py-2">{van.validTo}</td>
                    <td className="px-4 py-2">{van.rclIncharge}</td>
                    <td className="px-4 py-2">{van.gpInstalled}</td>
                    <td className="px-4 py-2">{van.gpsSimNo}</td>
                    {/* Show Actions buttons only for drivers */}
                    {user?.role !== 'admin' && (
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(van)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(van.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash className="h-4 w-4" />
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