import { useState, useEffect } from 'react';
import { Search, Edit, Trash, X } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Van, InventoryItem } from '../types';

// Define a custom interface for our form data
interface InventoryFormData {
  bu: string;
  item: string;
  qty: string;
  uom: string;
}

// Define an interface that extends the standard InventoryItem with legacy fields
interface ExtendedInventoryItem extends InventoryItem {
  // Legacy fields that might be present in the API response
  bu?: string;
  item?: string;
  qty?: number;
  uom?: string;
}

// Define a custom interface for our inventory items as they appear in the UI
interface UIInventoryItem {
  id: string;
  bu: string;
  item: string;
  qty: string;
  uom: string;
}

const VanInventoryPage = () => {
  const [inventory, setInventory] = useState<UIInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<UIInventoryItem | null>(null);
  const [vans, setVans] = useState<Van[]>([]);
  const [selectedVanId, setSelectedVanId] = useState<string>('');

  const [formData, setFormData] = useState<InventoryFormData>({
    bu: '',
    item: '',
    qty: '',
    uom: '',
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [inventoryData, vansData] = await Promise.all([
        apiService.getInventory(),
        apiService.getVans()
      ]);
      
      console.log('Inventory data received:', inventoryData);
      console.log('Vans data received:', vansData);
      
      // Map the API inventory items to our UI model
      const uiInventoryItems = inventoryData.map((item: ExtendedInventoryItem) => ({
        id: item.id,
        bu: item.bu || item.category || '', // Using bu field or fallback to category
        item: item.item || item.name || '',  // Using item field or fallback to name
        qty: (item.qty?.toString() || item.quantity?.toString() || '0'), // Using qty field or fallback to quantity
        uom: item.uom || item.unit || ''     // Using uom field or fallback to unit
      }));
      
      setInventory(uiInventoryItems);
      setVans(vansData);
      
      // Set default van if available
      if (vansData.length > 0 && !selectedVanId) {
        setSelectedVanId(vansData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'qty' ? value.replace(/\D/, '') : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVanId) {
      alert('Please select a van first');
      return;
    }
    
    try {
      // Map frontend field names to backend field names
      const inventoryData = {
        van_id: selectedVanId,
        bu: formData.bu,
        item: formData.item,
        qty: parseInt(formData.qty) || 0,
        uom: formData.uom
      };
      
      console.log('Submitting inventory data:', inventoryData);
      
      if (editingItem) {
        await apiService.updateInventoryItem(editingItem.id, inventoryData);
      } else {
        await apiService.createInventoryItem(inventoryData);
      }
      await fetchData(); // Refresh the list
      handleCancelForm();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const handleEdit = (item: UIInventoryItem) => {
    setEditingItem(item);
    setFormData({
      bu: item.bu,
      item: item.item,
      qty: item.qty,
      uom: item.uom,
    });
    // Don't change the selected van when editing
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await apiService.deleteInventoryItem(id);
        await fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      bu: '',
      item: '',
      qty: '',
      uom: '',
    });
    // Don't reset the selected van
  };

  // Filter inventory items based on search query
  const filteredInventory = inventory.filter(item =>
    item.bu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Van Inventory Management</h1>
        {/* Replace this with your actual user logic */}
        {user?.role !== 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            {/* Icon and label */}
            Add Inventory Entry
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Inventory Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
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
                <label htmlFor="vanId" className="block text-sm font-medium text-gray-700 mb-1">
                  Van *
                </label>
                <select
                  id="vanId"
                  name="vanId"
                  required
                  value={selectedVanId}
                  onChange={(e) => setSelectedVanId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                >
                  <option value="">Select a van</option>
                  {vans.map(van => (
                    <option key={van.id} value={van.id}>
                      {van.vehicleNo || van.registrationNumber || `Van ID: ${van.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bu" className="block text-sm font-medium text-gray-700 mb-1">
                  BU *
                </label>
                <input
                  id="bu"
                  name="bu"
                  type="text"
                  required
                  value={formData.bu}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter BU"
                />
              </div>
              <div>
                <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                  Item *
                </label>
                <input
                  id="item"
                  name="item"
                  type="text"
                  required
                  value={formData.item}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter Item"
                />
              </div>
              <div>
                <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-1">
                  QTY *
                </label>
                <input
                  id="qty"
                  name="qty"
                  type="number"
                  min="0"
                  required
                  value={formData.qty}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter Quantity"
                />
              </div>
              <div>
                <label htmlFor="uom" className="block text-sm font-medium text-gray-700 mb-1">
                  UOM *
                </label>
                <input
                  id="uom"
                  name="uom"
                  type="text"
                  required
                  value={formData.uom}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                  placeholder="Enter Unit of Measure"
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
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QTY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading inventory data...</p>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchQuery
                      ? 'No inventory items matching your search'
                      : 'No inventory items available'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.bu}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.item}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.uom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash className="h-4 w-4" />
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

export default VanInventoryPage;