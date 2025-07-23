import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  DocumentData 
} from 'firebase/firestore';

// Types for band user relationships
export interface BandUserRelationship {
  id?: string;
  userId: string;
  userEmail: string;
  bandId: string; // Sanity band _id
  bandName: string;
  role: 'owner' | 'editor' | 'member';
  status: 'pending' | 'approved' | 'rejected';
  claimMethod: 'email' | 'social' | 'manual';
  verificationData?: {
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
  };
  requestedAt: any;
  approvedAt?: any;
  approvedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export interface BandClaimRequest {
  bandId: string;
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
}

class BandUserService {
  private collectionName = 'bandUserRelationships';

  // Test database connection
  async testConnection(): Promise<boolean> {
    if (!db) {
      console.error('❌ [bandUserService] Database not initialized');
      return false;
    }
    
    try {
      console.log('🔗 [bandUserService] Testing database connection...');
      // Try a simple query to test connection
      const testQuery = query(collection(db, this.collectionName));
      const testPromise = getDocs(testQuery);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timed out')), 5000);
      });
      
      await Promise.race([testPromise, timeoutPromise]);
      console.log('✅ [bandUserService] Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ [bandUserService] Database connection failed:', error);
      return false;
    }
  }

  // Check if current user can edit a specific band
  async canUserEditBand(userId: string, bandId: string): Promise<boolean> {
    if (!db) return false;
    
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('bandId', '==', bandId),
        where('status', '==', 'approved'),
        where('role', 'in', ['owner', 'editor'])
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user band permissions:', error);
      return false;
    }
  }

  // Get all bands a user can edit
  async getUserEditableBands(userId: string): Promise<BandUserRelationship[]> {
    if (!db) return [];
    
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', 'approved'),
        where('role', 'in', ['owner', 'editor']),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BandUserRelationship));
    } catch (error) {
      console.error('Error fetching user editable bands:', error);
      return [];
    }
  }

  // Submit a band claim request
  async submitBandClaim(userId: string, userEmail: string, claimData: BandClaimRequest): Promise<string> {
    console.log('🔥 [bandUserService] Starting submitBandClaim', { userId, userEmail, bandId: claimData.bandId });
    
    if (!db) {
      console.error('❌ [bandUserService] Database not available');
      throw new Error('Database not available - please check your internet connection');
    }
    
    try {
      console.log('🔍 [bandUserService] Checking for existing claim...');
      
      // Use a more robust query with timeout
      const existingQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('bandId', '==', claimData.bandId)
      );
      
      // Add timeout to the query
      const queryPromise = getDocs(existingQuery);
      const queryTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timed out')), 15000);
      });
      
      const existingDocs = await Promise.race([queryPromise, queryTimeoutPromise]);
      console.log(`📊 [bandUserService] Found ${(existingDocs as any).size} existing claims`);
      
      if (!(existingDocs as any).empty) {
        console.log('⚠️ [bandUserService] User already has a claim for this band');
        throw new Error('You have already submitted a claim for this band');
      }

      console.log('📝 [bandUserService] Preparing relationship data...');
      
      // Create new relationship record
      const relationshipData: Omit<BandUserRelationship, 'id'> = {
        userId,
        userEmail,
        bandId: claimData.bandId,
        bandName: claimData.bandName,
        role: 'owner', // Default to owner for new claims
        status: 'pending',
        claimMethod: claimData.claimMethod,
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add verification data that exists to avoid undefined values in Firestore
      console.log('🔒 [bandUserService] Processing verification data...');
      const verificationData: any = {};
      if (claimData.email) {
        verificationData.email = claimData.email;
        console.log('📧 [bandUserService] Added email verification');
      }
      if (claimData.socialProof) {
        verificationData.socialProof = claimData.socialProof;
        console.log('📱 [bandUserService] Added social proof verification');
      }
      if (claimData.manualData) {
        verificationData.manualData = claimData.manualData;
        console.log('📝 [bandUserService] Added manual verification');
      }

      // Only add verificationData if it has content
      if (Object.keys(verificationData).length > 0) {
        relationshipData.verificationData = verificationData;
        console.log('✅ [bandUserService] Verification data added to relationship');
      } else {
        console.log('⚠️ [bandUserService] No verification data to add');
      }

      console.log('💾 [bandUserService] Saving to Firestore...', { collection: this.collectionName });
      
      // Add timeout to document creation
      const addDocPromise = addDoc(collection(db, this.collectionName), relationshipData);
      const addDocTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Document creation timed out')), 15000);
      });
      
      const docRef = await Promise.race([addDocPromise, addDocTimeoutPromise]);
      console.log('✅ [bandUserService] Document created with ID:', (docRef as any).id);
      return (docRef as any).id;
    } catch (error) {
      console.error('❌ [bandUserService] Error submitting band claim:', error);
      console.error('❌ [bandUserService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details
      });
      
      // Handle specific Firebase errors
      if ((error as any)?.code === 'unavailable') {
        throw new Error('Database is temporarily unavailable. Please try again in a few moments.');
      } else if ((error as any)?.code === 'permission-denied') {
        throw new Error('You do not have permission to perform this action. Please ensure you are logged in.');
      } else if ((error as any)?.message?.includes('timeout')) {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      } else if ((error as any)?.message?.includes('400')) {
        throw new Error('Network error occurred. Please refresh the page and try again.');
      }
      
      throw error;
    }
  }

  // Approve a band claim (admin function)
  async approveBandClaim(relationshipId: string, approvedBy: string): Promise<void> {
    if (!db) throw new Error('Database not available');
    
    try {
      const docRef = doc(db, this.collectionName, relationshipId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error approving band claim:', error);
      throw error;
    }
  }

  // Reject a band claim (admin function)
  async rejectBandClaim(relationshipId: string, rejectedBy: string): Promise<void> {
    if (!db) throw new Error('Database not available');
    
    try {
      const docRef = doc(db, this.collectionName, relationshipId);
      await updateDoc(docRef, {
        status: 'rejected',
        approvedBy: rejectedBy,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error rejecting band claim:', error);
      throw error;
    }
  }

  // Get all pending claims (admin function)
  async getPendingClaims(): Promise<BandUserRelationship[]> {
    if (!db) return [];
    
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BandUserRelationship));
    } catch (error) {
      console.error('Error fetching pending claims:', error);
      return [];
    }
  }

  // Check if band is already claimed
  async isBandClaimed(bandId: string): Promise<boolean> {
    if (!db) return false;
    
    try {
      const q = query(
        collection(db, this.collectionName),
        where('bandId', '==', bandId),
        where('status', '==', 'approved')
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if band is claimed:', error);
      return false;
    }
  }

  // Generate verification code for social proof
  generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const bandUserService = new BandUserService();
