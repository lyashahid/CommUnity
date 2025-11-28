import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  getDocs,
  addDoc,
  getDoc,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { postsCol } from './firebase';
import { HelpRequest, HelpRequestStatus, RequestType } from '../types/helpRequest';

export class RequestService {
  private static listeners: Map<string, () => void> = new Map();

  // Listen to all requests for the feed
  static listenToFeedRequests(
    callback: (requests: HelpRequest[]) => void,
    currentUserId?: string
  ) {
    if (!currentUserId) return () => {};

    const q = query(
      postsCol,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpRequest[];

      callback(requests);
    });

    const listenerId = `feed_${currentUserId}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return unsubscribe;
  }

  // Listen to user's requests (My Requests)
  static listenToUserRequests(
    userId: string,
    callback: (requests: HelpRequest[]) => void
  ) {
    const q = query(
      postsCol,
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpRequest[];

      callback(requests);
    });

    const listenerId = `user_requests_${userId}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return unsubscribe;
  }

  // Listen to user's offers (My Offers)
  static listenToUserOffers(
    userId: string,
    callback: (offers: HelpRequest[]) => void
  ) {
    const q = query(
      postsCol,
      where('helperId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const offers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpRequest[];

      callback(offers);
    });

    const listenerId = `user_offers_${userId}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return unsubscribe;
  }

  // Listen to a specific request's status
  static listenToRequestStatus(
    requestId: string,
    callback: (request: HelpRequest | null) => void
  ) {
    const requestRef = doc(postsCol, requestId);
    
    const unsubscribe = onSnapshot(requestRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as HelpRequest);
      } else {
        callback(null);
      }
    });

    const listenerId = `request_status_${requestId}`;
    this.listeners.set(listenerId, unsubscribe);
    
    return unsubscribe;
  }

  // Update request status
  static async updateRequestStatus(
    requestId: string,
    status: HelpRequestStatus,
    additionalData?: Partial<HelpRequest>
  ) {
    const requestRef = doc(postsCol, requestId);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData
    };

    // Add timestamp based on status
    switch (status) {
      case 'pending':
        updateData.requestSentAt = serverTimestamp();
        break;
      case 'ongoing':
        updateData.acceptedAt = serverTimestamp();
        break;
      case 'completed':
        updateData.completedAt = serverTimestamp();
        break;
      case 'rejected':
        updateData.rejectedAt = serverTimestamp();
        break;
      case 'cancelled':
        updateData.cancelledAt = serverTimestamp();
        break;
    }

    await updateDoc(requestRef, updateData);
  }

  // Create official chat request
  static async createOfficialRequest(requestData: Partial<HelpRequest>) {
    const requestDoc = {
      ...requestData,
      type: 'official_chat_request' as RequestType,
      status: 'pending' as HelpRequestStatus,
      isOfficialRequest: true,
      createdAt: serverTimestamp(),
      requestSentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'requests'), requestDoc);
    return docRef.id;
  }

  // Accept a request
  static async acceptRequest(requestId: string, helperId: string, helperName: string) {
    const requestRef = doc(postsCol, requestId);
    
    await updateDoc(requestRef, {
      status: 'ongoing' as HelpRequestStatus,
      helperId,
      helperName,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Reject a request
  static async rejectRequest(requestId: string, reason?: string) {
    const requestRef = doc(postsCol, requestId);
    
    await updateDoc(requestRef, {
      status: 'rejected' as HelpRequestStatus,
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Complete a request with rating
  static async completeRequest(
    requestId: string, 
    rating: number, 
    feedback?: string, 
    ratingTags?: string[]
  ) {
    const requestRef = doc(postsCol, requestId);
    
    await updateDoc(requestRef, {
      status: 'completed' as HelpRequestStatus,
      rating,
      feedback,
      ratingTags,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Get request by ID
  static async getRequestById(requestId: string): Promise<HelpRequest | null> {
    const requestRef = doc(postsCol, requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (requestDoc.exists()) {
      return {
        id: requestDoc.id,
        ...requestDoc.data()
      } as HelpRequest;
    }
    
    return null;
  }

  // Clean up all listeners
  static cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // Remove specific listener
  static removeListener(listenerId: string) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }
}

// Export singleton instance
export const requestService = RequestService;
