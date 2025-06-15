import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Van, InventoryItem } from '../types';

// Define a custom interface for our form data
interface InventoryFormData {
  items: string[]; // Changed from single item to array of items
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
  // Different variations of vanId that might be in the API response
  van_id?: string;
  vanID?: string;
  vanid?: string;
  van?: string | { id: string };
}

// Define a custom interface for our inventory items as they appear in the UI
interface UIInventoryItem {
  id: string;
  item: string; // This will now store multiple items as a comma-separated string
  items?: string[]; // Optional array of items for internal use
  qty: string;
  uom: string;
  vanId?: string; // Add vanId property to track which van this item belongs to
}

// Define the predefined item options
const ITEM_OPTIONS = [
  'rebound hammer',
  'cube mold',
  'water TDS meter',
  'cement',
  'Integral waterproofing',
  'Tile adhesive',
  'construction chemicals',
  'Doctor fixit',
  'Tile grout',
  'Concrete mixing Tools',
  'Cement spatula'
];

const VanInventoryPage = () => {
  const [inventory, setInventory] = useState<UIInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<UIInventoryItem | null>(null);
  const [vans, setVans] = useState<Van[]>([]);
  const [selectedVanId, setSelectedVanId] = useState<string>('');

  const [formData, setFormData] = useState<InventoryFormData>({
    items: [],
    qty: '',
    uom: '',
  });
  
  // State to hold temporary items before submission
  const [tempItems, setTempItems] = useState<{item: string; qty: string; uom: string}[]>([]);

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
      const uiInventoryItems = inventoryData.map((item: ExtendedInventoryItem) => {
        // Extract the vanId from the item using various possible property names
        let vanId = item.vanId || ''; // Start with the existing vanId if available
        
        // If vanId is not set, try to get it from other possible property names
        if (!vanId) {
          if (item.van_id) vanId = item.van_id;
          else if (item.vanID) vanId = item.vanID;
          else if (item.vanid) vanId = item.vanid;
          else if (item.van) {
            vanId = typeof item.van === 'object' ? item.van.id : item.van;
          }
        }
        
        // Get the item value, which might be a comma-separated list of items
        const itemValue = item.item || item.name || '';
        // Split the item value into an array if it contains commas
        const itemsArray = itemValue.includes(',') ? itemValue.split(',').map(i => i.trim()) : [itemValue];
        
        return {
          id: item.id,
          item: itemValue,  // Keep the original string format for backward compatibility
          items: itemsArray, // Store as array for internal use
          qty: (item.qty?.toString() || item.quantity?.toString() || '0'), // Using qty field or fallback to quantity
          uom: item.uom || item.unit || '',     // Using uom field or fallback to unit
          vanId: vanId || '' // Store the vanId in the UI item
        };
      });
      
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'qty' ? value.replace(/\D/, '') : value });
  };
  
  // Handler for adding an item to the temporary list
  const handleAddItemToList = () => {
    // Validate form data
    if (!formData.items[0]) {
      alert('Please select an item');
      return;
    }
    
    // Add the current item to the temporary list
    setTempItems([
      ...tempItems,
      {
        item: formData.items[0],
        qty: formData.qty || '1', // Default to 1 if qty is empty
        uom: formData.uom || 'units' // Default to 'units' if uom is empty
      }
    ]);
    
    // Reset the form for the next item
    setFormData({
      items: [],
      qty: '',
      uom: ''
    });
  };
  
  // Handler for removing an item from the temporary list
  const handleRemoveItem = (index: number) => {
    const newItems = [...tempItems];
    newItems.splice(index, 1);
    setTempItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVanId) {
      alert('Please select a van first');
      return;
    }
    
    // Create a working copy of tempItems
    let workingItems = [...tempItems];
    
    // If there's a quantity in the form, check if we should add the current form item
    if (formData.qty) {
      const hasValidCurrentItem = formData.items[0];
      
      // If there's a valid item selected, add it to our working items
      if (hasValidCurrentItem) {
        // Add the current form item to the working copy
        const currentItem = {
          item: formData.items[0],
          qty: formData.qty, 
          uom: formData.uom || 'units' // Default to 'units' if uom is empty
        };
        
        workingItems.push(currentItem);
      } else if (tempItems.length === 0) {
        // If no item is selected but qty is filled and no items in the list, show an error
        alert('Please select an item');
        return;
      }
    } else if (tempItems.length === 0) {
      // If no quantity and no items in the list, show an error
      alert('Please add at least one item or fill in the quantity');
      return;
    }
    
    try {
      // Create a single inventory item with all items joined together
      const allItems = workingItems.map(item => item.item).join(', ');
      const totalQty = workingItems.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
      const uomList = [...new Set(workingItems.map(item => item.uom))].filter(Boolean).join(', ');
      
      // Map frontend field names to backend field names
      const inventoryData = {
        van_id: selectedVanId,
        item: allItems, // Send all items as a comma-separated string
        qty: totalQty,
        uom: uomList || 'units',
        bu: 'default' // Add a default value for the bu field if needed
      };
      
      console.log('Submitting inventory data:', inventoryData);
      console.log('Current user role:', user?.role);
      
      let result;
      if (editingItem) {
        result = await apiService.updateInventoryItem(editingItem.id, inventoryData);
        console.log('Update result:', result);
      } else {
        result = await apiService.createInventoryItem(inventoryData);
        console.log('Create result:', result);
      }
      
      // Show success message
      alert(editingItem ? 'Inventory item updated successfully!' : 'Inventory item added successfully!');
      
      await fetchData(); // Refresh the list
      handleCancelForm();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      
      // Provide more user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Access denied') || error.message.includes('permission')) {
          alert('Access denied: You do not have permission to perform this action. Please contact your administrator.');
        } else if (error.message.includes('Authentication required')) {
          alert('Your session has expired. Please log in again.');
        } else {
          alert('Error saving inventory item: ' + error.message);
        }
      } else {
        alert('An unknown error occurred while saving the inventory item. Please try again later.');
      }
    }
  };

  const handleEdit = (item: UIInventoryItem) => {
    setEditingItem(item);
    
    // Convert the item string to an array if it's not already
    const itemsArray = item.items || 
                      (item.item.includes(',') ? 
                        item.item.split(',').map(i => i.trim()) : 
                        [item.item]);
    
    // Clear the form data
    setFormData({
      items: [],
      qty: '',
      uom: '',
    });
    
    // Set up temporary items from the comma-separated values
    const tempItemsList = itemsArray.map(itemName => {
      return {
        item: itemName,
        qty: item.qty, // We'll use the same quantity for all items initially
        uom: item.uom  // We'll use the same UOM for all items initially
      };
    });
    
    setTempItems(tempItemsList);
    
    // Set the selected van to the item's vanId when editing
    if (item.vanId) {
      setSelectedVanId(item.vanId);
    }
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
      items: [],
      qty: '',
      uom: '',
    });
    // Clear the temporary items list
    setTempItems([]);
    // Don't reset the selected van
  };

  // Filter inventory items based on search query
  const filteredInventory = inventory.filter(item =>
    item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Van Inventory Management</h1>
        {/* Replace this with your actual user logic */}
        {user?.role !== 'mace sector head' && (
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
      {showForm && user?.role !== 'mace sector head' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
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
            <form onSubmit={handleSubmit}>
              {/* Van selection at the top like a bill header */}
              <div className="border-b-2 border-gray-300 pb-4 mb-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Van Details</h3>
                    <label htmlFor="vanId" className="block text-sm font-medium text-gray-700 mb-1">
                      Van Number *
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
                  <div className="flex-1 ml-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Inventory Items</h3>
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Item entry section */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Item Details</h3>
                
                <div className="grid grid-cols-12 gap-4 mb-2 bg-gray-100 p-2 rounded">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700">Item *</label>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700">UOM</label>
                  </div>
                  <div className="col-span-1">
                    {/* Action column header */}
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-4 mb-4 items-center">
                  <div className="col-span-5">
                    <select
                      id="item"
                      name="item"
                      required
                      value={formData.items[0] || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        items: [e.target.value]
                      })}
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                    >
                      <option value="">Select an item</option>
                      {ITEM_OPTIONS.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
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
                  <div className="col-span-3">
                    <input
                      id="uom"
                      name="uom"
                      type="text"
                      value={formData.uom}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                      placeholder="Enter Unit of Measure"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={handleAddItemToList}
                      className="bg-blue-600 hover:bg-green-700 text-white p-2 rounded-md"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Display added items */}
              {tempItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Added Items</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tempItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">{item.item}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.qty}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.uom}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Form actions */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-300">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedVanId || (!formData.qty && tempItems.length === 0)}
                  className={`px-4 py-2 rounded-md ${
                    !selectedVanId || (!formData.qty && tempItems.length === 0)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Submit Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-2 border-gray-800">
            <thead className="bg-gray-50 border-b-2 border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  Van ID
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-800">
                  QTY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>

              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-gray-800">
              {isLoading ? (
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2">Loading inventory data...</p>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr className="border-b-2 border-gray-800">
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchQuery
                      ? 'No inventory items matching your search'
                      : 'No inventory items available'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 border-b-2 border-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-800">
                      {(() => {
                        // Use the item's vanId directly
                        const vanId = item.vanId || '';
                        // Find the van with this ID to display its registration number
                        const van = vans.find(v => v.id === vanId);
                        return van ? van.registrationNumber || van.vehicleNo || vanId : vanId || 'N/A';
                      })()}
                    </td>

                    <td className="px-6 py-4 border-r-2 border-gray-800">
                      {item.items && item.items.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {item.items.map((itemName, idx) => (
                            <li key={idx}>{itemName}</li>
                          ))}
                        </ul>
                      ) : (
                        item.item
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-800">{item.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.uom}</td>

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