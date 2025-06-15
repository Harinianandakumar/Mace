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
  private userId: string | null = null;

  constructor() {
    this.token = localStorage.getItem('mace_token');
    
    // Try to get the user ID from localStorage if available
    try {
      const userJson = localStorage.getItem('mace_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        this.userId = user.id;
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Check if this is a login or register request (which doesn't need a token)
    const isAuthRequest = (endpoint === '/auth/login' || endpoint === '/auth/register') && options.method === 'POST';
    
    // Always get the latest token from localStorage for every request
    const freshToken = localStorage.getItem('mace_token');
    this.token = freshToken; // Update the instance token
    
    console.log(`Current token for ${endpoint} request:`, this.token ? 'Token exists' : 'No token');
    
    // Only require token for non-auth requests
    if (!this.token && !isAuthRequest) {
      console.error(`No authentication token found for ${endpoint}. User may need to log in again.`);
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Create headers, only add Authorization for non-auth requests
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Only add Authorization header if we have a token and it's not an auth request
    if (this.token && !isAuthRequest) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log(`Adding Authorization header for ${endpoint}`);
    }
    
    // Log the actual Authorization header for debugging
    console.log('Authorization header:', headers.Authorization || 'No Authorization header');
    
    const config: RequestInit = {
      headers,
      ...options,
    };

    console.log(`Making API request to ${endpoint}:`, {
      method: options.method || 'GET',
      headers: config.headers,
      body: options.body ? JSON.parse(options.body as string) : undefined
    });

    try {
      const response = await fetch(url, config);
      console.log(`Response status for ${endpoint}:`, response.status, response.statusText);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log(`Response data for ${endpoint}:`, data);
      } else {
        const text = await response.text();
        console.log(`Response text for ${endpoint}:`, text);
        try {
          // Try to parse it anyway in case the Content-Type header is wrong
          data = JSON.parse(text);
        } catch (e) {
          // If it's not JSON, just use the text
          data = { message: text };
        }
      }
      
      if (!response.ok) {
        console.error(`API error for ${endpoint}:`, data);
        
        // Handle specific error cases
        if (response.status === 401) {
          // Log detailed information about the token
          const currentToken = localStorage.getItem('mace_token');
          console.error('Authentication failed. Token details:', {
            endpoint,
            tokenExists: !!currentToken,
            tokenLength: currentToken ? currentToken.length : 0,
            tokenInInstance: !!this.token,
            headers: headers
          });
          
          // Clear token on authentication failure
          localStorage.removeItem('mace_token');
          this.token = null;
          
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          // Include more detailed information about the role issue
          if (data.userRole && data.allowedRoles) {
            throw new Error(`Access denied. Your role (${data.userRole}) does not have permission to perform this action. Required roles: ${data.allowedRoles.join(', ')}`);
          } else {
            throw new Error(data.message || 'Access denied. You do not have permission to perform this action.');
          }
        } else if (response.status === 404) {
          throw new Error('Resource not found.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid request. Please check your input.');
        } else {
          throw new Error(data.message || `API request failed with status ${response.status}`);
        }
      }

      return data as T;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log(`Frontend login attempt for: ${email}`);
    try {
      // Clear any existing tokens before attempting login
      localStorage.removeItem('mace_token');
      localStorage.removeItem('mace_user');
      this.token = null;
      this.userId = null;
      
      // Use the request method for login
      const data = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Login response:', data);
      
      if (data.token) {
        // Store token in localStorage first
        localStorage.setItem('mace_token', data.token);
        // Then update the instance variable
        this.token = data.token;
        console.log('Token saved to localStorage and updated in API service');
        
        // Verify token was stored correctly
        const storedToken = localStorage.getItem('mace_token');
        console.log('Verification - Token in localStorage:', storedToken ? 'Token exists' : 'No token');
      } else {
        console.warn('No token received in login response');
        throw new Error('No authentication token received from server');
      }
      
      if (data.user) {
        localStorage.setItem('mace_user', JSON.stringify(data.user));
        this.userId = data.user.id;
        console.log('User data saved to localStorage and updated in API service');
      } else {
        console.warn('No user data received in login response');
      }
      
      return data;
    } catch (error) {
      console.error('Frontend login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('mace_token');
    localStorage.removeItem('mace_user');
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
    return response.vans.map(van => {
      // Format date fields for the form
      let validFromFormatted = '';
      if (van.valid_from) {
        // If it's a Date object or string with time component
        if (van.valid_from instanceof Date) {
          validFromFormatted = van.valid_from.toISOString().split('T')[0];
        } else if (typeof van.valid_from === 'string') {
          // If it's a string, check if it has a time component
          if (van.valid_from.includes('T')) {
            validFromFormatted = van.valid_from.split('T')[0];
          } else {
            validFromFormatted = van.valid_from;
          }
        }
      }
      
      let validToFormatted = '';
      if (van.valid_to) {
        // If it's a Date object or string with time component
        if (van.valid_to instanceof Date) {
          validToFormatted = van.valid_to.toISOString().split('T')[0];
        } else if (typeof van.valid_to === 'string') {
          // If it's a string, check if it has a time component
          if (van.valid_to.includes('T')) {
            validToFormatted = van.valid_to.split('T')[0];
          } else {
            validToFormatted = van.valid_to;
          }
        }
      }
      
      console.log('Van date fields:', {
        valid_from: van.valid_from,
        valid_to: van.valid_to,
        validFromFormatted,
        validToFormatted
      });
      
      return {
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
        validFrom: validFromFormatted,
        validTo: validToFormatted,
        rclIncharge: van.rcl_incharge || '',
        gpInstalled: van.gp_installed || '',
        gpsSimNo: van.gps_sim_no || ''
      };
    });
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
    
    // Debug token before request
    const currentToken = localStorage.getItem('mace_token');
    console.log('Token before createVan request:', currentToken ? 'Token exists' : 'No token');
    
    if (!currentToken) {
      console.error('No authentication token found for createVan request');
      throw new Error('Authentication required. Please log in again.');
    }
    
    try {
      // Validate vehicle number format
      if (!vanData.vehicle_no || vanData.vehicle_no.trim() === '') {
        throw new Error('Vehicle number is required');
      }
      
      const response = await this.request<{van: Van}>('/vans', {
        method: 'POST',
        body: JSON.stringify(vanData),
      });
      console.log('Create van response:', response);
      return response.van;
    } catch (error) {
      console.error('Create van error details:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Access denied. You may not have permission to perform this action or your session has expired.');
        } else if (error.message.includes('duplicate')) {
          throw new Error('A van with this vehicle number already exists.');
        }
      }
      
      throw error;
    }
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
    bu?: string;
    item: string; // This can now be a comma-separated list of items
    qty: number;
    uom: string;
  }): Promise<InventoryItem> {
    console.log('API service creating inventory item with data:', itemData);
    
    // Debug token before request
    const currentToken = localStorage.getItem('mace_token');
    console.log('Token before createInventoryItem request:', currentToken ? 'Token exists' : 'No token');
    
    if (!currentToken) {
      console.error('No authentication token found for createInventoryItem request');
      throw new Error('Authentication required. Please log in again.');
    }
    
    try {
      const response = await this.request<{item: InventoryItem; message: string}>('/inventory', {
        method: 'POST',
        body: JSON.stringify(itemData),
      });
      
      console.log('Create inventory item response:', response);
      return response.item;
    } catch (error) {
      console.error('Create inventory item error:', error);
      
      // Rethrow the error to be handled by the component
      throw error;
    }
  }

  async updateInventoryItem(id: string, itemData: Partial<{
    van_id?: string;
    bu?: string;
    item?: string;
    qty?: number;
    uom?: string;
  }>): Promise<InventoryItem> {
    console.log('API service updating inventory item with ID:', id, 'and data:', itemData);
    
    // Debug token before request
    const currentToken = localStorage.getItem('mace_token');
    console.log('Token before updateInventoryItem request:', currentToken ? 'Token exists' : 'No token');
    
    if (!currentToken) {
      console.error('No authentication token found for updateInventoryItem request');
      throw new Error('Authentication required. Please log in again.');
    }
    
    try {
      const response = await this.request<{item: InventoryItem; message: string}>(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      });
      
      console.log('Update inventory item response:', response);
      return response.item;
    } catch (error) {
      console.error('Update inventory item error:', error);
      
      // Rethrow the error to be handled by the component
      throw error;
    }
  }

  async deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Kilometer entry methods
  async getKilometerEntries(): Promise<KilometerEntry[]> {
    const response = await this.request<{entries: any[]}>('/kilometers');
    
    if (!response.entries || !Array.isArray(response.entries)) {
      console.error('Invalid kilometer entries data received:', response);
      return [];
    }
    
    // Map backend fields to frontend fields
    return response.entries.map(entry => {
      // Format the date properly
      let formattedDate = '';
      if (entry.date) {
        // If it's a Date object or string with time component
        if (entry.date instanceof Date) {
          formattedDate = entry.date.toISOString().split('T')[0];
        } else if (typeof entry.date === 'string') {
          // If it's a string, check if it has a time component
          if (entry.date.includes('T')) {
            formattedDate = entry.date.split('T')[0];
          } else {
            formattedDate = entry.date;
          }
        }
      }
      
      console.log('API received date:', entry.date, 'Formatted as:', formattedDate);
      
      return {
        id: entry.id.toString(),
        vehicleNo: entry.vehicle_no || '',
        date: formattedDate,
        startReading: entry.start_reading || 0,
        endReading: entry.end_reading || 0,
        driverId: entry.created_by?.toString() || '',
        authorized: Boolean(entry.authorized),
        distance: entry.day_km || (entry.end_reading - entry.start_reading),
        vanId: entry.van_id?.toString() || ''
      };
    });
  }

  async getKilometerEntriesByVan(vanId: string): Promise<KilometerEntry[]> {
    console.log('API service getting kilometer entries for van:', vanId);
    const response = await this.request<{entries: any[]}>(`/kilometers/van/${vanId}`);
    
    if (!response.entries || !Array.isArray(response.entries)) {
      console.error('Invalid kilometer entries data received:', response);
      return [];
    }
    
    // Map backend fields to frontend fields
    return response.entries.map(entry => {
      // Format the date properly
      let formattedDate = '';
      if (entry.date) {
        // If it's a Date object or string with time component
        if (entry.date instanceof Date) {
          formattedDate = entry.date.toISOString().split('T')[0];
        } else if (typeof entry.date === 'string') {
          // If it's a string, check if it has a time component
          if (entry.date.includes('T')) {
            formattedDate = entry.date.split('T')[0];
          } else {
            formattedDate = entry.date;
          }
        }
      }
      
      return {
        id: entry.id.toString(),
        vehicleNo: entry.vehicle_no || '',
        date: formattedDate,
        startReading: entry.start_reading || 0,
        endReading: entry.end_reading || 0,
        driverId: entry.created_by?.toString() || '',
        authorized: Boolean(entry.authorized),
        distance: entry.day_km || (entry.end_reading - entry.start_reading),
        vanId: entry.van_id?.toString() || ''
      };
    });
  }

  async createKilometerEntry(entryData: {
    van_id: string;
    vehicle_no: string;
    date: string;
    start_reading: number;
    end_reading: number;
  }): Promise<KilometerEntry> {
    console.log('API service creating kilometer entry with data:', entryData);
    
    // Validate that end_reading is greater than start_reading
    if (entryData.end_reading <= entryData.start_reading) {
      throw new Error('Closing KM must be greater than Opening KM');
    }
    
    try {
      // Make sure we're sending valid numeric values
      entryData.start_reading = Number(entryData.start_reading);
      entryData.end_reading = Number(entryData.end_reading);
      
      console.log('Sending data to API:', entryData);
      
      const response = await this.request<{entry: any; message?: string}>('/kilometers', {
        method: 'POST',
        body: JSON.stringify(entryData),
      });
      
      console.log('Create kilometer entry response:', response);
      
      if (!response.entry) {
        throw new Error('Invalid response from server. Entry data is missing.');
      }
      
      // Transform the backend response to match frontend field names
      const transformedEntry: KilometerEntry = {
        id: response.entry.id?.toString() || '',
        vehicleNo: response.entry.vehicle_no || '',
        date: response.entry.date || '',
        startReading: Number(response.entry.start_reading) || 0,
        endReading: Number(response.entry.end_reading) || 0,
        distance: Number(response.entry.day_km) || 
                 (Number(response.entry.end_reading) - Number(response.entry.start_reading)),
        authorized: Boolean(response.entry.authorized),
        vanId: response.entry.van_id?.toString() || '',
        driverId: response.entry.created_by?.toString() || ''
      };
      
      return transformedEntry;
    } catch (error) {
      console.error('Create kilometer entry error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('greater than')) {
          throw error; // Keep validation errors as is
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Access denied. You may not have permission to perform this action or your session has expired.');
        }
      }
      
      // Rethrow the error to be handled by the component
      throw error;
    }
  }

  async updateKilometerEntry(id: string, entryData: Partial<{
    van_id?: string;
    vehicle_no?: string;
    date?: string;
    start_reading?: number;
    end_reading?: number;
  }>): Promise<KilometerEntry> {
    console.log('API service updating kilometer entry with ID:', id, 'and data:', entryData);
    
    // Debug token before request
    const currentToken = localStorage.getItem('mace_token');
    console.log('Token before updateKilometerEntry request:', currentToken ? 'Token exists' : 'No token');
    
    if (!currentToken) {
      console.error('No authentication token found for updateKilometerEntry request');
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Validate that end_reading is greater than start_reading
    if (entryData.start_reading !== undefined && entryData.end_reading !== undefined) {
      if (entryData.end_reading <= entryData.start_reading) {
        throw new Error('Closing KM must be greater than Opening KM');
      }
    }
    
    try {
      // Make sure we're sending valid numeric values
      if (entryData.start_reading !== undefined) {
        entryData.start_reading = Number(entryData.start_reading);
      }
      
      if (entryData.end_reading !== undefined) {
        entryData.end_reading = Number(entryData.end_reading);
      }
      
      console.log('Sending data to API:', entryData);
      
      const response = await this.request<{entry: any; message: string}>(`/kilometers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(entryData),
      });
      
      console.log('Update kilometer entry response:', response);
      
      if (!response.entry) {
        throw new Error('Invalid response from server. Entry data is missing.');
      }
      
      // Transform the backend response to match frontend field names
      const transformedEntry: KilometerEntry = {
        id: response.entry.id?.toString() || id,
        vehicleNo: response.entry.vehicle_no || '',
        date: response.entry.date || '',
        startReading: Number(response.entry.start_reading) || 0,
        endReading: Number(response.entry.end_reading) || 0,
        distance: Number(response.entry.day_km) || 
                 (Number(response.entry.end_reading) - Number(response.entry.start_reading)),
        authorized: Boolean(response.entry.authorized),
        vanId: response.entry.van_id?.toString() || '',
        driverId: response.entry.created_by?.toString() || ''
      };
      
      return transformedEntry;
    } catch (error) {
      console.error('Update kilometer entry error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('greater than')) {
          throw error; // Keep validation errors as is
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Access denied. You may not have permission to perform this action or your session has expired.');
        }
      }
      
      // Rethrow the error to be handled by the component
      throw error;
    }
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
    try {
      const response = await this.request<{stoppages: any[]}>('/stoppages');
      
      if (!response.stoppages || !Array.isArray(response.stoppages)) {
        console.warn('No stoppages data received:', response);
        return [];
      }
      
      return response.stoppages.map(stoppage => {
        if (!stoppage) return null;
        
        try {
          let formattedDate = '';
          let startTime = '00:00';
          
          if (stoppage.from_date) {
            formattedDate = stoppage.from_date.split('T')[0];
            if (stoppage.from_date.includes('T')) {
              startTime = stoppage.from_date.split('T')[1].substring(0, 5);
            }
          }

          // Determine the status based on to_date
          const status = stoppage.to_date ? 'resolved' : 'ongoing';
          
          // Format the to_date if it exists
          let toDateFormatted = '';
          if (stoppage.to_date) {
            if (stoppage.to_date.includes('T')) {
              toDateFormatted = stoppage.to_date.split('T')[0];
            } else {
              toDateFormatted = stoppage.to_date;
            }
          }
          
          return {
            id: String(stoppage.id || ''),
            vanId: String(stoppage.van_id || ''),
            date: formattedDate,
            startTime,
            endTime: stoppage.to_date ? (stoppage.to_date.includes('T') ? 
              stoppage.to_date.split('T')[1].substring(0, 5) : '23:59') : undefined,
            toDate: toDateFormatted, // Add the formatted to_date
            reason: stoppage.reason || '',
            status: status,
            notes: stoppage.spare_vehicle || '',
            authorized: Boolean(stoppage.authorized),
            createdBy: String(stoppage.created_by || ''),
            createdByName: stoppage.created_by_name || ''
          };
        } catch (e) {
          console.error('Error processing stoppage:', stoppage, e);
          return null;
        }
      }).filter(Boolean) as Stoppage[];
    } catch (error) {
      console.error('Failed to fetch stoppages:', error);
      throw error;
    }
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
      
      // Determine the status based on to_date
      const status = stoppage.to_date ? 'resolved' : 'ongoing';
      
      console.log('Processing stoppage with to_date:', stoppage.to_date, 'status:', status);
      
      // Format the to_date if it exists
      let toDateFormatted = '';
      if (stoppage.to_date) {
        if (stoppage.to_date.includes('T')) {
          toDateFormatted = stoppage.to_date.split('T')[0];
        } else {
          toDateFormatted = stoppage.to_date;
        }
      }
      
      return {
        id: stoppage.id?.toString() || '',
        vanId: stoppage.van_id?.toString() || '',
        date: formattedDate,
        startTime: startTime,
        endTime: endTime,
        toDate: toDateFormatted, // Add the formatted to_date
        reason: stoppage.reason || '',
        status: status,
        notes: stoppage.spare_vehicle || '',
        authorized: Boolean(stoppage.authorized),
        createdBy: stoppage.created_by?.toString() || '',
        createdByName: stoppage.created_by_name || '',
        resolvedBy: stoppage.resolved_by?.toString() || '',
        resolvedByName: stoppage.resolved_by_name || '',
        resolverRole: stoppage.resolver_role || ''
      };
    });
  }

  async createStoppage(data: {
    van_id: string;
    vehicle_no: string;
    from_date: string;
    to_date?: string | null;
    spare_vehicle?: string;
    reason: string;
    status?: 'ongoing' | 'resolved';
  }): Promise<Stoppage> {
    console.log('API service createStoppage called with data:', data);
    
    // Check authentication before proceeding
    const currentToken = localStorage.getItem('mace_token');
    if (!currentToken) {
      console.error('No token found before creating stoppage');
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Update the instance token to ensure it's current
    this.token = currentToken;
    console.log('Token verification before creating stoppage:', this.token ? 'Token exists' : 'No token');
    
    // Validate required fields before sending to server
    if (!data.van_id) {
      throw new Error('Van ID is required');
    }
    
    if (!data.vehicle_no) {
      throw new Error('Vehicle number is required');
    }
    
    if (!data.from_date) {
      throw new Error('From date is required');
    }
    
    if (!data.reason) {
      throw new Error('Reason is required');
    }
    
    // Simplify the data structure to minimize potential issues
    const stoppageData = {
      van_id: data.van_id,
      vehicle_no: data.vehicle_no,
      from_date: data.from_date,
      to_date: data.to_date || null,
      spare_vehicle: data.spare_vehicle || '',
      reason: data.reason,
      // Only include status if explicitly provided
      ...(data.status && { status: data.status })
    };

    console.log('Sending stoppage data to server:', stoppageData);
    
    try {
      // Use a more robust request approach with explicit Authorization header
      const response = await this.request<{message: string, stoppage: Stoppage}>('/stoppages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(stoppageData)
      });
      
      console.log('Received response from server:', response);
      
      if (!response.stoppage) {
        console.error('No stoppage data in response:', response);
        throw new Error('Failed to create stoppage: Invalid server response');
      }
      
      return response.stoppage;
    } catch (error) {
      console.error('Error creating stoppage:', error);
      
      // Check if token is still valid after the error
      const tokenAfterError = localStorage.getItem('mace_token');
      console.log('Token after error:', tokenAfterError ? 'Token exists' : 'No token');
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') || 
            error.message.includes('401') || 
            error.message.includes('unauthorized')) {
          // Clear token and provide clear message
          localStorage.removeItem('mace_token');
          this.token = null;
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(`Failed to create stoppage: ${error.message}`);
      }
      throw error;
    }
  }

  async updateStoppage(id: string, stoppageData: Partial<{
    van_id?: string;
    vehicle_no?: string;
    from_date?: string;
    to_date?: string | null;
    spare_vehicle?: string;
    reason?: string;
    status?: 'ongoing' | 'resolved';
  }>): Promise<Stoppage> {
    console.log('API service updating stoppage with data:', stoppageData);
    try {
      const response = await this.request<{message: string, stoppage: Stoppage}>(`/stoppages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(stoppageData),
      });
      
      console.log('Received update response from server:', response);
      
      if (!response.stoppage) {
        console.error('No stoppage data in update response:', response);
        throw new Error('Failed to update stoppage: Invalid server response');
      }
      
      return response.stoppage;
    } catch (error) {
      console.error('Error updating stoppage:', error);
      throw error;
    }
  }

  async authorizeStoppage(id: string, authorized: boolean): Promise<Stoppage> {
    console.log('API service authorizing stoppage:', id, authorized);
    const response = await this.request<{stoppage: Stoppage}>(`/stoppages/${id}/authorize`, {
      method: 'PATCH',
      body: JSON.stringify({ authorized }),
    });
    return response.stoppage;
  }

  async resolveStoppage(id: string, toDate?: string | null): Promise<Stoppage> {
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