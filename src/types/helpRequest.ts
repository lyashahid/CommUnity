export type HelpRequestStatus = 'open' | 'pending' | 'accepted' | 'ongoing' | 'completed' | 'rejected' | 'cancelled';

export type RequestType = 'feed_request' | 'official_chat_request';

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  location: string;
  latitude?: number;
  longitude?: number;
  
  // Request tracking
  type: RequestType;
  status: HelpRequestStatus;
  
  // User information
  requesterId: string;
  requesterName: string;
  helperId?: string;
  helperName?: string;
  
  // Timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  requestSentAt?: any;
  acceptedAt?: any;
  completedAt?: any;
  expiresAt?: any;
  
  // Request metadata
  helpOffers: number;
  isOfficialRequest?: boolean;
  chatId?: string;
  
  // Rating and feedback
  rating?: number;
  feedback?: string;
  ratingTags?: string[];
  
  // Additional fields
  duration?: number; // in hours
  rejectionReason?: string;
}

export interface RequestCardItem {
  id: string;
  title: string;
  category: string;
  distanceKm: number;
  canHelp?: boolean;
  createdAt?: any;
  ownerUid?: string;
  ownerName?: string;
  status?: HelpRequestStatus;
  helperUid?: string;
  urgency?: 'low' | 'medium' | 'high';
  description?: string;
  type?: RequestType;
  isOfficialRequest?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  read: boolean;
  isOfficialRequest?: boolean;
  isSystemMessage?: boolean;
}

export interface ReviewData {
  rating: number;
  comment: string;
  tags: string[];
  reviewerName: string;
  reviewerUid: string;
  revieweeName: string;
  revieweeUid: string;
  requestTitle: string;
  requestId: string;
  chatId: string;
  createdAt: any;
}

// Request filtering helpers
export const isRequestAvailableForFeed = (request: HelpRequest, currentUserId?: string): boolean => {
  if (!currentUserId) return false;
  
  // Don't show user's own requests
  if (request.requesterId === currentUserId) return false;
  
  // Don't show completed, cancelled, or inactive requests (comprehensive list)
  const inactiveStatuses = ['completed', 'cancelled', 'rejected', 'closed', 'inactive', 'done'];
  if (inactiveStatuses.includes(request.status)) return false;
  
  // Don't show requests that are already accepted/ongoing with current user as helper
  if (request.helperId === currentUserId && 
      (request.status === 'accepted' || request.status === 'ongoing' || request.status === 'pending')) {
    return false;
  }
  
  // Don't show official requests that have been accepted
  if (request.isOfficialRequest && 
      (request.status === 'accepted' || request.status === 'ongoing' || request.status === 'pending')) {
    return false;
  }
  
  // Don't show regular requests that have been accepted by other users
  if (!request.isOfficialRequest && 
      request.status === 'accepted' && 
      request.helperId && 
      request.helperId !== currentUserId) {
    return false;
  }
  
  return true;
};

export const canUserSendOfficialRequest = (request: HelpRequest, currentUserId?: string): boolean => {
  if (!currentUserId) return false;
  
  // Only the original requester can send official request
  if (request.requesterId !== currentUserId) return false;
  
  // Can only send if request is still open and not already official
  if (request.status !== 'open' || request.isOfficialRequest) return false;
  
  return true;
};

export const canUserAcceptRequest = (request: HelpRequest, currentUserId?: string): boolean => {
  if (!currentUserId) return false;
  
  // Cannot accept your own request
  if (request.requesterId === currentUserId) return false;
  
  // Can accept if request is pending and user is the helper
  if (request.status === 'pending' && request.helperId === currentUserId) {
    return true;
  }
  
  return true;
};

export const canUserCompleteRequest = (request: HelpRequest, currentUserId?: string): boolean => {
  if (!currentUserId) return false;
  
  // Only the original requester can complete
  if (request.requesterId !== currentUserId) return false;
  
  // Can complete if request is accepted/ongoing
  if (request.status === 'accepted' || request.status === 'ongoing') {
    return true;
  }
  
  return false;
};
