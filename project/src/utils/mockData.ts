import { Van, InventoryItem, KilometerEntry, Stoppage } from '../types';

// Mock vans data
export const mockVans: Van[] = [
  {
    id: '1',
    registrationNumber: 'MH-12-AB-1234',
    model: 'Tata Ace',
    capacity: '750 kg',
    status: 'active',
    assignedDriver: 'John Doe',
    lastService: '2025-03-01',
    nextService: '2025-06-01',
    currentLocation: { 
      latitude: 18.5204, 
      longitude: 73.8567 
    }
  },
  {
    id: '2',
    registrationNumber: 'MH-12-CD-5678',
    model: 'Mahindra Supro',
    capacity: '1000 kg',
    status: 'maintenance',
    assignedDriver: 'Jane Smith',
    lastService: '2025-02-15',
    nextService: '2025-05-15',
    currentLocation: { 
      latitude: 18.5314, 
      longitude: 73.8446 
    }
  },
  {
    id: '3',
    registrationNumber: 'MH-12-EF-9012',
    model: 'Ashok Leyland Dost',
    capacity: '1250 kg',
    status: 'active',
    assignedDriver: 'David Johnson',
    lastService: '2025-03-10',
    nextService: '2025-06-10',
    currentLocation: { 
      latitude: 18.5108, 
      longitude: 73.8292 
    }
  },
  {
    id: '4',
    registrationNumber: 'MH-12-GH-3456',
    model: 'Force Trump 40',
    capacity: '2000 kg',
    status: 'active',
    assignedDriver: 'Michael Brown',
    lastService: '2025-02-28',
    nextService: '2025-05-28',
    currentLocation: { 
      latitude: 18.4968, 
      longitude: 73.8508 
    }
  },
  {
    id: '5',
    registrationNumber: 'MH-12-IJ-7890',
    model: 'Eicher Pro 1055',
    capacity: '5000 kg',
    status: 'inactive',
    lastService: '2025-01-20',
    nextService: '2025-04-20'
  }
];

// Mock inventory items
export const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    vanId: '1',
    name: 'Cement Bags',
    category: 'Construction Materials',
    quantity: 20,
    unit: 'bags',
    notes: 'Standard Portland Cement',
    lastUpdated: '2025-04-10'
  },
  {
    id: '2',
    vanId: '1',
    name: 'Sand',
    category: 'Construction Materials',
    quantity: 500,
    unit: 'kg',
    lastUpdated: '2025-04-10'
  },
  {
    id: '3',
    vanId: '2',
    name: 'Bricks',
    category: 'Construction Materials',
    quantity: 200,
    unit: 'pieces',
    lastUpdated: '2025-04-09'
  },
  {
    id: '4',
    vanId: '3',
    name: 'Steel Rods',
    category: 'Construction Materials',
    quantity: 50,
    unit: 'rods',
    notes: '10mm diameter',
    lastUpdated: '2025-04-08'
  },
  {
    id: '5',
    vanId: '4',
    name: 'Paint Buckets',
    category: 'Finishing Materials',
    quantity: 10,
    unit: 'buckets',
    notes: 'Weather-resistant exterior paint',
    lastUpdated: '2025-04-07'
  }
];

// Mock kilometer entries
export const mockKilometerEntries: KilometerEntry[] = [
  {
    id: '1',
    vanId: '1',
    date: new Date().toISOString().split('T')[0], // Today
    startReading: 12500,
    endReading: 12525,
    distance: 25,
    driverId: 'driver1',
    notes: 'Delivery to Site A'
  },
  {
    id: '2',
    vanId: '2',
    date: new Date().toISOString().split('T')[0], // Today
    startReading: 8750,
    endReading: 8780,
    distance: 30,
    driverId: 'driver2',
    notes: 'Material pickup from Supplier B'
  },
  {
    id: '3',
    vanId: '3',
    date: new Date().toISOString().split('T')[0], // Today
    startReading: 15200,
    endReading: 15235,
    distance: 35,
    driverId: 'driver3'
  },
  {
    id: '4',
    vanId: '1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    startReading: 12450,
    endReading: 12500,
    distance: 50,
    driverId: 'driver1',
    notes: 'Multiple site visits'
  },
  {
    id: '5',
    vanId: '4',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    startReading: 22100,
    endReading: 22160,
    distance: 60,
    driverId: 'driver4',
    notes: 'Long distance delivery'
  }
];

// Mock stoppage entries
export const mockStoppages: Stoppage[] = [
  {
    id: '1',
    vanId: '2',
    date: new Date().toISOString().split('T')[0], // Today
    startTime: '09:15:00',
    reason: 'Minor mechanical issue',
    location: {
      latitude: 18.5314,
      longitude: 73.8446,
      address: 'Main Street, Downtown'
    },
    status: 'ongoing',
    notes: 'Awaiting service team'
  },
  {
    id: '2',
    vanId: '5',
    date: new Date().toISOString().split('T')[0], // Today
    startTime: '08:30:00',
    endTime: '10:45:00',
    reason: 'Flat tire',
    location: {
      latitude: 18.5050,
      longitude: 73.8280,
      address: 'Highway 27, Outskirts'
    },
    status: 'resolved',
    notes: 'Tire replaced'
  },
  {
    id: '3',
    vanId: '3',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    startTime: '14:20:00',
    endTime: '15:00:00',
    reason: 'Traffic congestion',
    location: {
      latitude: 18.5108,
      longitude: 73.8292,
      address: 'City Center Junction'
    },
    status: 'resolved'
  },
  {
    id: '4',
    vanId: '1',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    startTime: '11:05:00',
    endTime: '12:30:00',
    reason: 'Engine overheating',
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Industrial Area'
    },
    status: 'resolved',
    notes: 'Coolant refilled and system checked'
  }
];