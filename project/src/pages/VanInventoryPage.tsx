import { useState, useEffect } from 'react';
import { Search, Edit, Trash, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VanInventoryPage = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Only new fields
  const [formData, setFormData] = useState({
    bu: '',
    item: '',
    qty: '',
    uom: '',
  });

  const { user } = useAuth();

  useEffect(() => {
    // Simulate API call
    setIsLoading(false);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'qty' ? value.replace(/\D/, '') : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const updatedInventory = inventory.map(item =>
        item.id === editingItem.id ? { ...item, ...formData } : item
      );
      setInventory(updatedInventory);
    } else {
      const newItem = {
        id: `${inventory.length + 1}`,
        ...formData,
      };
      setInventory([...inventory, newItem]);
    }
    handleCancelForm();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      bu: item.bu,
      item: item.item,
      qty: item.qty,
      uom: item.uom,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      setInventory(inventory.filter(item => item.id !== id));
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