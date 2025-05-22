import { useState, useEffect } from 'react';
import { 
  Calendar, Download, FileText, Filter, PieChart, BarChart2, 
  TrendingUp, Truck, Package, AlertTriangle 
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { ReportFilters, Van, KilometerEntry, Stoppage, InventoryItem } from '../types';
import { mockVans, mockKilometerEntries, mockStoppages, mockInventoryItems } from '../utils/mockData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ReportsPage = () => {
  const [vans, setVans] = useState<Van[]>([]);
  const [kmEntries, setKmEntries] = useState<KilometerEntry[]>([]);
  const [stoppages, setStoppages] = useState<Stoppage[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState<ReportFilters>({
    vanId: 'all',
    startDate: getStartOfMonth(),
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'overview'
  });

  function getStartOfMonth() {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    // In a real app, this would be API calls
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVans(mockVans);
        setKmEntries(mockKilometerEntries);
        setStoppages(mockStoppages);
        setInventory(mockInventoryItems);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Filter data based on current filters
  const filteredKmEntries = kmEntries.filter(entry => {
    const matchesVan = filters.vanId === 'all' || entry.vanId === filters.vanId;
    const matchesDate = (!filters.startDate || entry.date >= filters.startDate) && 
                         (!filters.endDate || entry.date <= filters.endDate);
    return matchesVan && matchesDate;
  });

  const filteredStoppages = stoppages.filter(stoppage => {
    const matchesVan = filters.vanId === 'all' || stoppage.vanId === filters.vanId;
    const matchesDate = (!filters.startDate || stoppage.date >= filters.startDate) && 
                         (!filters.endDate || stoppage.date <= filters.endDate);
    return matchesVan && matchesDate;
  });

  // Generate chart data
  const distanceChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Distance Travelled (km)',
        data: getDistanceData(),
        backgroundColor: '#3B82F6',
      },
    ],
  };

  const stoppageChartData = {
    labels: ['Mechanical Issues', 'Flat Tire', 'Traffic Congestion', 'Other'],
    datasets: [
      {
        label: 'Stoppage Reasons',
        data: [
          countStoppagesByReason('Mechanical Issue'),
          countStoppagesByReason('Flat Tire'),
          countStoppagesByReason('Traffic Congestion'),
          filteredStoppages.length - (
            countStoppagesByReason('Mechanical Issue') +
            countStoppagesByReason('Flat Tire') +
            countStoppagesByReason('Traffic Congestion')
          )
        ],
        backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#6B7280'],
      },
    ],
  };

  const efficiencyChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Efficiency Score',
        data: getEfficiencyData(),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Helper functions for charts
  function getChartLabels() {
    if (!filters.startDate || !filters.endDate) return [];
    
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    // If less than 14 days, show daily labels
    if (days <= 14) {
      const labels = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return labels;
    }
    
    // Otherwise, group by week
    const labels = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > end) weekEnd.setDate(end.getDate());
      
      labels.push(`${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return labels;
  }

  function getDistanceData() {
    const labels = getChartLabels();
    
    // If less than 14 days, show daily data
    if (labels.length <= 14 && !labels[0].includes('-')) {
      return labels.map(label => {
        const date = new Date(label).toISOString().split('T')[0];
        return filteredKmEntries
          .filter(entry => entry.date === date)
          .reduce((sum, entry) => sum + entry.distance, 0);
      });
    }
    
    // Otherwise, group by week
    return labels.map(label => {
      const [startStr, endStr] = label.split(' - ');
      const startMonth = startStr.split(' ')[0];
      const startDay = parseInt(startStr.split(' ')[1]);
      const endMonth = endStr.split(' ')[0];
      const endDay = parseInt(endStr.split(' ')[1]);
      
      // Calculate the actual dates
      const year = new Date().getFullYear();
      const startMonthNum = new Date(`${startMonth} 1, ${year}`).getMonth();
      const endMonthNum = new Date(`${endMonth} 1, ${year}`).getMonth();
      
      const startDate = new Date(year, startMonthNum, startDay);
      const endDate = new Date(year, endMonthNum, endDay);
      
      return filteredKmEntries
        .filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        })
        .reduce((sum, entry) => sum + entry.distance, 0);
    });
  }

  function countStoppagesByReason(reason: string) {
    return filteredStoppages.filter(s => s.reason === reason).length;
  }

  function getEfficiencyData() {
    // This is a simplified efficiency calculation
    // In a real app, this would be a more complex calculation based on multiple factors
    const labels = getChartLabels();
    
    // Calculate efficiency as ratio of distance to stoppage time (higher is better)
    // For simplicity, we'll use a random factor to simulate real data
    if (labels.length <= 14 && !labels[0].includes('-')) {
      return labels.map(label => {
        const date = new Date(label).toISOString().split('T')[0];
        const dayDistance = filteredKmEntries
          .filter(entry => entry.date === date)
          .reduce((sum, entry) => sum + entry.distance, 0);
        
        const dayStoppages = filteredStoppages.filter(s => s.date === date).length;
        
        // Efficiency score between 60-100
        return dayStoppages > 0 
          ? 60 + Math.min(40, (dayDistance / (dayStoppages * 10))) 
          : (dayDistance > 0 ? 90 + Math.random() * 10 : 75);
      });
    }
    
    // Weekly data
    return labels.map(() => 60 + Math.random() * 40);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Reports & Analytics</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Report Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              id="reportType"
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="distance">Distance Report</option>
              <option value="stoppage">Stoppage Report</option>
              <option value="inventory">Inventory Report</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="vanId" className="block text-sm font-medium text-gray-700 mb-1">
              Van
            </label>
            <select
              id="vanId"
              name="vanId"
              value={filters.vanId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Vans</option>
              {vans.map(van => (
                <option key={van.id} value={van.id}>
                  {van.registrationNumber}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={handleFilterChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={handleFilterChange}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Overview Report */}
          {filters.reportType === 'overview' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Distance</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">
                        {filteredKmEntries.reduce((sum, entry) => sum + entry.distance, 0)} km
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Stoppages</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">
                        {filteredStoppages.length}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Vans</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">
                        {vans.filter(van => van.status === 'active').length} / {vans.length}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Truck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Inventory Items</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">
                        {inventory.filter(item => 
                          filters.vanId === 'all' || item.vanId === filters.vanId
                        ).length}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Package className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Distance Travelled</h3>
                  <div className="h-64">
                    <Bar data={distanceChartData} options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Stoppage Reasons</h3>
                  <div className="h-64">
                    <Pie data={stoppageChartData} options={{ 
                      maintainAspectRatio: false
                    }} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Efficiency Trends</h3>
                <div className="h-64">
                  <Line data={efficiencyChartData} options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 100
                      }
                    }
                  }} />
                </div>
              </div>
            </>
          )}

          {/* Distance Report */}
          {filters.reportType === 'distance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center mb-4">
                  <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-medium text-gray-800">Distance Analysis</h2>
                </div>
                <div className="h-80">
                  <Bar data={distanceChartData} options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Kilometers'
                        }
                      }
                    }
                  }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Detailed Distance Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Van
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Reading
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Reading
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distance
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredKmEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No distance entries found for the selected filters
                          </td>
                        </tr>
                      ) : (
                        filteredKmEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vans.find(v => v.id === entry.vanId)?.registrationNumber || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.startReading} km
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.endReading} km
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {entry.distance} km
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Driver ID: {entry.driverId}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Stoppage Report */}
          {filters.reportType === 'stoppage' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center mb-4">
                  <PieChart className="h-5 w-5 text-red-600 mr-2" />
                  <h2 className="text-lg font-medium text-gray-800">Stoppage Analysis</h2>
                </div>
                <div className="h-80">
                  <Pie data={stoppageChartData} options={{ 
                    maintainAspectRatio: false
                  }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Stoppage Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Van
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStoppages.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No stoppage entries found for the selected filters
                          </td>
                        </tr>
                      ) : (
                        filteredStoppages.map((stoppage) => (
                          <tr key={stoppage.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(stoppage.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vans.find(v => v.id === stoppage.vanId)?.registrationNumber || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stoppage.reason}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stoppage.startTime} 
                              {stoppage.endTime ? ` - ${stoppage.endTime}` : ' (ongoing)'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                stoppage.status === 'ongoing' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {stoppage.status.charAt(0).toUpperCase() + stoppage.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stoppage.location?.address || 'No address recorded'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Report */}
          {filters.reportType === 'inventory' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 text-yellow-600 mr-2" />
                  <h2 className="text-lg font-medium text-gray-800">Inventory Status</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {inventory.filter(item => 
                        filters.vanId === 'all' || item.vanId === filters.vanId
                      ).length}
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Item Categories</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {new Set(inventory
                        .filter(item => filters.vanId === 'all' || item.vanId === filters.vanId)
                        .map(item => item.category)
                      ).size}
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Latest Update</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {inventory
                        .filter(item => filters.vanId === 'all' || item.vanId === filters.vanId)
                        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]
                        ?.lastUpdated
                        ? new Date(inventory
                            .filter(item => filters.vanId === 'all' || item.vanId === filters.vanId)
                            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]
                            .lastUpdated
                          ).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Vans With Inventory</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {new Set(inventory.map(item => item.vanId)).size} / {vans.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Inventory Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Van
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventory
                        .filter(item => filters.vanId === 'all' || item.vanId === filters.vanId)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No inventory items found for the selected van
                          </td>
                        </tr>
                      ) : (
                        inventory
                          .filter(item => filters.vanId === 'all' || item.vanId === filters.vanId)
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{item.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {vans.find(v => v.id === item.vanId)?.registrationNumber || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {item.quantity} {item.unit}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(item.lastUpdated).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;