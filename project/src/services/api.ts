import { User, Van, InventoryItem, KilometerEntry, Stoppage} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Define response types for different API endpoints
interface ApiResponse<T> {
  message?: string;
  data?: T;
  token?: string;
  [key: string]: unknown;
}

// Auth response types
interface AuthResponse {
  token: string;
  user: User;
}

// Dashboard stats response type
interface DashboardStats {
  activeVans: number;
  totalKilometers: number;
  ongoingStoppages: number;
  inventoryAlerts: number;
}

// Report response types
interface VanUtilizationReport {
  vanId: string;
  utilizationPercentage: number;
  totalDays: number;
  activeDays: number;
  stoppageDays: number;
}

interface KilometerSummaryReport {
  vanId: string;
  totalKilometers: number;
  averagePerDay: number;
  entries: KilometerEntry[];
}

interface StoppageReport {
  vanId: string;
  totalStoppages: number;
  totalDuration: number;
  stoppages: Stoppage[];
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('mace_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log(`Frontend login attempt for: ${email}`);
    try {
      const data = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Login response:', data);
      
      if (data.token) {
        this.token = data.token;
        localStorage.setItem('mace_token', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Frontend login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('mace_token');
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  // Van methods
  async getVans(): Promise<Van[]> {
    const response = await this.request<{vans: any[]}>('/vans');
    
    if (!response.vans || !Array.isArray(response.vans)) {
      console.error('Invalid vans data received:', response);
      return [];
    }
    
    // Map backend fields to frontend fields
    return response.vans.map(van => ({
      id: van.id.toString(),
      state: van.state || '',
      region: van.region || '',
      zone: van.zone || '',
      sector: van.sector || '',
      city: van.city || '',
      vehicleNo: van.vehicle_no || '',
      registrationNumber: van.registration_number || '',
      make: van.make || '',
      type: van.type || '',
      modelYear: van.model_year || '',
      contractType: van.contract_type || '',
      ownerName: van.owner_name || '',
      travelsName: van.travels_name || '',
      address: van.address || '',
      driverName: van.driver_name || '',
      mobileNo: van.mobile_no || '',
      validFrom: van.valid_from || '',
      validTo: van.valid_to || '',
      rclIncharge: van.rcl_incharge || '',
      gpInstalled: van.gp_installed || '',
      gpsSimNo: van.gps_sim_no || ''
    }));
  }

  async createVan(vanData: {
    state: string;
    region: string;
    zone: string;
    sector: string;
    city: string;
    vehicle_no: string;
    registration_number?: string;
    make: string;
    type: string;
    model_year: string;
    contract_type: string;
    owner_name: string;
    travels_name: string;
    address: string;
    driver_name: string;
    mobile_no: string;
    valid_from: string;
    valid_to: string;
    rcl_incharge: string;
    gp_installed: string;
    gps_sim_no: string;
  }): Promise<Van> {
    console.log('API service creating van with data:', vanData);
    const response = await this.request<{van: Van}>('/vans', {
      method: 'POST',
      body: JSON.stringify(vanData),
    });
    return response.van;
  }

  async updateVan(id: string, vanData: Partial<{
    state: string;
    region: string;
    zone: string;
    sector: string;
    city: string;
    vehicle_no: string;
    registration_number?: string;
    make: string;
    type: string;
    model_year: string;
    contract_type: string;
    owner_name: string;
    travels_name: string;
    address: string;
    driver_name: string;
    mobile_no: string;
    valid_from: string;
    valid_to: string;
    rcl_incharge: string;
    gp_installed: string;
    gps_sim_no: string;
  }>): Promise<Van> {
    console.log('API service updating van with data:', vanData);
    const response = await this.request<{van: Van}>(`/vans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vanData),
    });
    return response.van;
  }

  async deleteVan(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/vans/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory methods
  async getInventory(): Promise<InventoryItem[]> {
    const response = await this.request<{inventory: InventoryItem[]}>('/inventory');
    return response.inventory || [];
  }

  async getInventoryByVan(vanId: string): Promise<InventoryItem[]> {
    const response = await this.request<{inventory: InventoryItem[]}>(`/inventory/van/${vanId}`);
    return response.inventory || [];
  }

  async createInventoryItem(itemData: {
    van_id: string;
    bu: string;
    item: string;
    qty: number;
    uom: string;
  }): Promise<InventoryItem> {
    console.log('API service creating inventory item with data:', itemData);
    const response = await this.request<{item: InventoryItem}>('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    return response.item;
  }

  async updateInventoryItem(id: string, itemData: Partial<{
    van_id?: string;
    bu?: string;
    item?: string;
    qty?: number;
    uom?: string;
  }>): Promise<InventoryItem> {
    console.log('API service updating inventory item with data:', itemData);
    const response = await this.request<{item: InventoryItem}>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
    return response.item;
  }

  async deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Kilometer entry methods
  async getKilometerEntries(): Promise<KilometerEntry[]> {
    const response = await this.request<{entries: KilometerEntry[]}>('/kilometers');
    return response.entries || [];
  }

  async getKilometerEntriesByVan(vanId: string): Promise<KilometerEntry[]> {
    console.log('API service getting kilometer entries for van:', vanId);
    const response = await this.request<{entries: KilometerEntry[]}>(`/kilometers/van/${vanId}`);
    return response.entries || [];
  }

  async createKilometerEntry(entryData: {
    van_id: string;
    vehicle_no: string;
    date: string;
    start_reading: number;
    end_reading: number;
  }): Promise<KilometerEntry> {
    console.log('API service creating kilometer entry with data:', entryData);
    const response = await this.request<{entry: KilometerEntry}>('/kilometers', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return response.entry;
  }

  async updateKilometerEntry(id: string, entryData: Partial<{
    van_id?: string;
    vehicle_no?: string;
    date?: string;
    start_reading?: number;
    end_reading?: number;
  }>): Promise<KilometerEntry> {
    console.log('API service updating kilometer entry with data:', entryData);
    const response = await this.request<{entry: KilometerEntry}>(`/kilometers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
    return response.entry;
  }

  async authorizeKilometerEntry(id: string, authorized: boolean): Promise<KilometerEntry> {
    console.log('API service authorizing kilometer entry:', id, authorized);
    const response = await this.request<{entry: KilometerEntry}>(`/kilometers/${id}/authorize`, {
      method: 'PATCH',
      body: JSON.stringify({ authorized }),
    });
    return response.entry;
  }

  async deleteKilometerEntry(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/kilometers/${id}`, {
      method: 'DELETE',
    });
  }

  // Stoppage methods
  async getStoppages(): Promise<Stoppage[]> {
    const response = await this.request<{stoppages: any[]}>('/stoppages');
    
    if (!response.stoppages || !Array.isArray(response.stoppages)) {
      console.error('Invalid stoppages data received:', response);
      return [];
    }
    
    // Map backend fields to frontend fields
    return response.stoppages.map(stoppage => {
      console.log('Processing stoppage:', stoppage);
      
      // Safely format the date
      let formattedDate = '';
      let startTime = '00:00';
      let endTime = undefined;
      
      try {
        if (stoppage.from_date) {
          formattedDate = stoppage.from_date.split('T')[0];
          // Don't try to extract time if it's just a date string
          if (stoppage.from_date.includes('T')) {
            startTime = stoppage.from_date.split('T')[1].substring(0, 5);
          }
        }
        
        if (stoppage.to_date) {
          if (stoppage.to_date.includes('T')) {
            endTime = stoppage.to_date.split('T')[1].substring(0, 5);
          } else {
            endTime = '23:59';
          }
        }
      } catch (e) {
        console.error('Error formatting stoppage dates:', e);
      }
      
      return {
        id: stoppage.id?.toString() || '',
        vanId: stoppage.van_id?.toString() || '',
        date: formattedDate,
        startTime: startTime,
        endTime: endTime,
        reason: stoppage.reason || '',
        status: stoppage.to_date ? 'resolved' : 'ongoing',
        notes: stoppage.spare_vehicle || '',
        authorized: Boolean(stoppage.authorized),
        // Add any other fields needed
      };
    });
  }

  async getStoppagesByVan(vanId: string): Promise<Stoppage[]> {
    const response = await this.request<{stoppages: any[]}>(`/stoppages/van/${vanId}`);
    
    if (!response.stoppages || !Array.isArray(response.stoppages)) {
      console.error('Invalid stoppages data received:', response);
      return [];
    }
    
    // Map backend fields to frontend fields using the same logic as getStoppages
    return response.stoppages.map(stoppage => {
      console.log('Processing van stoppage:', stoppage);
      
      // Safely format the date
      let formattedDate = '';
      let startTime = '00:00';
      let endTime = undefined;
      
      try {
        if (stoppage.from_date) {
          formattedDate = stoppage.from_date.split('T')[0];
          // Don't try to extract time if it's just a date string
          if (stoppage.from_date.includes('T')) {
            startTime = stoppage.from_date.split('T')[1].substring(0, 5);
          }
        }
        
        if (stoppage.to_date) {
          if (stoppage.to_date.includes('T')) {
            endTime = stoppage.to_date.split('T')[1].substring(0, 5);
          } else {
            endTime = '23:59';
          }
        }
      } catch (e) {
        console.error('Error formatting stoppage dates:', e);
      }
      
      return {
        id: stoppage.id?.toString() || '',
        vanId: stoppage.van_id?.toString() || '',
        date: formattedDate,
        startTime: startTime,
        endTime: endTime,
        reason: stoppage.reason || '',
        status: stoppage.to_date ? 'resolved' : 'ongoing',
        notes: stoppage.spare_vehicle || '',
        authorized: Boolean(stoppage.authorized),
      };
    });
  }

  async createStoppage(stoppageData: {
    van_id: string;
    vehicle_no: string;
    from_date: string;
    to_date?: string | null;
    spare_vehicle?: string;
    reason: string;
  }): Promise<Stoppage> {
    console.log('API service creating stoppage with data:', stoppageData);
    const response = await this.request<{stoppage: Stoppage}>('/stoppages', {
      method: 'POST',
      body: JSON.stringify(stoppageData),
    });
    return response.stoppage;
  }

  async updateStoppage(id: string, stoppageData: Partial<{
    van_id?: string;
    vehicle_no?: string;
    from_date?: string;
    to_date?: string | null;
    spare_vehicle?: string;
    reason?: string;
  }>): Promise<Stoppage> {
    console.log('API service updating stoppage with data:', stoppageData);
    const response = await this.request<{stoppage: Stoppage}>(`/stoppages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stoppageData),
    });
    return response.stoppage;
  }

  async authorizeStoppage(id: string, authorized: boolean): Promise<Stoppage> {
    console.log('API service authorizing stoppage:', id, authorized);
    const response = await this.request<{stoppage: Stoppage}>(`/stoppages/${id}/authorize`, {
      method: 'PATCH',
      body: JSON.stringify({ authorized }),
    });
    return response.stoppage;
  }

  async resolveStoppage(id: string, toDate?: string): Promise<Stoppage> {
    console.log('API service resolving stoppage:', id, toDate);
    const response = await this.request<{stoppage: Stoppage}>(`/stoppages/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ to_date: toDate }),
    });
    return response.stoppage;
  }

  async deleteStoppage(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/stoppages/${id}`, {
      method: 'DELETE',
    });
  }

  // Report methods
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/reports/dashboard');
  }

  async getVanUtilizationReport(fromDate?: string, toDate?: string): Promise<VanUtilizationReport[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    return this.request<VanUtilizationReport[]>(`/reports/van-utilization?${params}`);
  }

  async getKilometerSummaryReport(fromDate?: string, toDate?: string, vanId?: string): Promise<KilometerSummaryReport[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (vanId) params.append('vanId', vanId);
    
    return this.request<KilometerSummaryReport[]>(`/reports/kilometer-summary?${params}`);
  }

  async getStoppageReport(fromDate?: string, toDate?: string, vanId?: string): Promise<StoppageReport[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (vanId) params.append('vanId', vanId);
    
    return this.request<StoppageReport[]>(`/reports/stoppages?${params}`);
  }
}

export const apiService = new ApiService();