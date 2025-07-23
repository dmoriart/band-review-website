import { auth } from '../firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get Firebase ID token for API requests
 */
const getAuthToken = async (): Promise<string | null> => {
  if (!auth?.currentUser) {
    console.warn('No authenticated user found');
    return null;
  }

  try {
    const token = await auth.currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Make API request with authentication
 */
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// API Client Class
export class ApiClient {
  
  // ===== AUTH ENDPOINTS =====
  
  /**
   * Verify current Firebase token and sync user data
   */
  static async verifyAuth() {
    return apiRequest('/auth/verify', { method: 'POST' });
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser() {
    return apiRequest('/auth/me');
  }

  // ===== BAND ENDPOINTS =====

  /**
   * Get all bands with pagination
   */
  static async getBands(page = 1, limit = 20, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return apiRequest(`/bands?${params}`);
  }

  /**
   * Get a specific band by slug
   */
  static async getBand(slug: string) {
    return apiRequest(`/bands/${slug}`);
  }

  /**
   * Create a new band (requires authentication)
   */
  static async createBand(bandData: {
    name: string;
    slug?: string;
    bio?: string;
    genres?: string[];
    hometown?: string;
    county?: string;
    website?: string;
    contact_email?: string;
  }) {
    return apiRequest('/bands', {
      method: 'POST',
      body: JSON.stringify(bandData),
    });
  }

  /**
   * Update a band (requires ownership)
   */
  static async updateBand(slug: string, bandData: any) {
    return apiRequest(`/bands/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(bandData),
    });
  }

  /**
   * Submit a band ownership claim
   */
  static async submitBandClaim(bandId: string, claimData: {
    bandName: string;
    claimMethod: 'email' | 'social' | 'manual';
    email?: string;
    socialProof?: {
      platform: string;
      postUrl: string;
      verificationCode: string;
    };
    manualData?: {
      description: string;
      supportingLinks: string[];
    };
  }) {
    return apiRequest(`/bands/${bandId}/claim`, {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  }

  /**
   * Check if current user can edit a specific band
   */
  static async checkBandOwnership(bandId: string) {
    return apiRequest(`/bands/${bandId}/ownership`);
  }

  /**
   * Get bands that current user can edit
   */
  static async getUserBands() {
    return apiRequest('/bands/my-bands');
  }

  /**
   * Get current user's band claims (all statuses)
   */
  static async getUserClaims() {
    return apiRequest('/bands/my-claims');
  }

  // ===== ADMIN ENDPOINTS =====

  /**
   * Get pending claims for admin review
   */
  static async getAdminClaims(status = 'pending', limit = 50, offset = 0) {
    return apiRequest(`/admin/claims?status=${status}&limit=${limit}&offset=${offset}`);
  }

  /**
   * Approve a band claim (admin only)
   */
  static async approveClaim(claimId: number) {
    return apiRequest(`/admin/claims/${claimId}/approve`, { method: 'POST' });
  }

  /**
   * Reject a band claim (admin only)
   */
  static async rejectClaim(claimId: number, reason?: string) {
    return apiRequest(`/admin/claims/${claimId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats() {
    return apiRequest('/admin/stats');
  }
}

// Legacy compatibility - individual functions for existing code
export const bandApiClient = {
  submitBandClaim: ApiClient.submitBandClaim,
  checkBandOwnership: ApiClient.checkBandOwnership,
  getUserBands: ApiClient.getUserBands,
  getUserClaims: ApiClient.getUserClaims,
};

export default ApiClient;
