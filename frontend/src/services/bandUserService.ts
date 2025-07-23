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
    if (!db) throw new Error('Database not available');
    
    try {
      // Check if user already has a relationship with this band
      const existingQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('bandId', '==', claimData.bandId)
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        throw new Error('You have already submitted a claim for this band');
      }

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
      const verificationData: any = {};
      if (claimData.email) {
        verificationData.email = claimData.email;
      }
      if (claimData.socialProof) {
        verificationData.socialProof = claimData.socialProof;
      }
      if (claimData.manualData) {
        verificationData.manualData = claimData.manualData;
      }

      // Only add verificationData if it has content
      if (Object.keys(verificationData).length > 0) {
        relationshipData.verificationData = verificationData;
      }

      const docRef = await addDoc(collection(db, this.collectionName), relationshipData);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting band claim:', error);
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
