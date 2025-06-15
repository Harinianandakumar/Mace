// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'mace sector head' | 'manager' | 'mace engineer' | 'admin' | 'driver';
}

// Van types
export interface Van {
  id: string;
  registrationNumber?: string;
  model?: string;
  capacity?: string;
  status?: 'active' | 'maintenance' | 'inactive';
  assignedDriver?: string;
  lastService?: string;
  nextService?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };

  // New fields for Van Master Page
  state: string;
  region: string;
  zone: string;
  sector: string;
  city: string;
  vehicleNo: string;
  make: string;
  type: string;
  modelYear: string;
  contractType: string;
  ownerName: string;
  travelsName: string;
  address: string;
  driverName: string;
  mobileNo: string;
  validFrom: string;
  validTo: string;
  rclIncharge: string;
  gpInstalled: string;
  gpsSimNo: string;
}

// Inventory types
export interface InventoryItem {
  id: string;
  vanId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  notes?: string;
  lastUpdated: string;
}

// Kilometer entry types
export interface KilometerEntry {
  id: string;
  vehicleNo: string;
  date: string;
  startReading: number;
  endReading: number;
  driverId?: string;
  authorized?: boolean;
  distance?: number;
  vanId?: string;
}

// Stoppage types
export interface Stoppage {
  id: string;
  vanId: string; // Use vanId for consistency with your code
  date: string;
  startTime: string;
  endTime?: string;
  toDate?: string; // Add the to_date field
  reason: string;
  status: 'ongoing' | 'resolved' | 'pending';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  authorized?: boolean;
  createdBy?: string;
  createdByName?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolverRole?: string;
  }

// Report types
export interface ReportFilters {
  vanId?: string;
  startDate?: string;
  endDate?: string;
  driverId?: string;
  reportType: 'distance' | 'stoppage' | 'inventory' | 'overview';
}