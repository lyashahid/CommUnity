import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  db 
} from './firebase';

export interface ReviewData {
  rating: number;
  comment?: string;
  tags?: string[];
  reviewerName: string;
  reviewerUid: string;
  revieweeName: string;
  revieweeUid: string;
  requestTitle: string;
  requestId: string;
  chatId: string;
  createdAt: any;
}

export interface UserProfile {
  rating: number;
  reviewCount: number;
  completedRequests: number;
  helpedPeople: number;
  responseRate: number;
  level: number;
}

/**
 * Calculate new user rating based on all reviews
 */
export const calculateUserRating = async (userId: string): Promise<number> => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('revieweeUid', '==', userId),
      where('rating', '>', 0)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    if (reviewsSnapshot.empty) {
      return 0;
    }
    
    const ratings = reviewsSnapshot.docs.map(doc => doc.data().rating);
    const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = totalRating / ratings.length;
    
    // Round to 1 decimal place
    return Math.round(averageRating * 10) / 10;
  } catch (error) {
    console.error('Error calculating user rating:', error);
    return 0;
  }
};

/**
 * Update user profile with new rating and stats
 */
export const updateUserRatingProfile = async (userId: string, reviewData: ReviewData): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('User profile not found, creating new one');
      // Create basic profile if it doesn't exist
      await updateDoc(userRef, {
        rating: reviewData.rating,
        reviewCount: 1,
        completedRequests: 0,
        helpedPeople: 0,
        responseRate: 0,
        level: 1,
        updatedAt: serverTimestamp()
      });
      return;
    }
    
    const currentProfile = userDoc.data() as UserProfile;
    
    // Calculate new average rating
    const newRating = await calculateUserRating(userId);
    
    // Count total reviews
    const reviewsCountQuery = query(
      collection(db, 'reviews'),
      where('revieweeUid', '==', userId)
    );
    const reviewsCountSnapshot = await getDocs(reviewsCountQuery);
    const newReviewCount = reviewsCountSnapshot.size;
    
    // Count completed requests (where this user was the helper)
    const completedRequestsQuery = query(
      collection(db, 'requests'),
      where('helperId', '==', userId),
      where('status', '==', 'completed')
    );
    const completedRequestsSnapshot = await getDocs(completedRequestsQuery);
    const newCompletedRequests = completedRequestsSnapshot.size;
    
    // Calculate level based on completed requests and reviews
    const newLevel = calculateUserLevel(newCompletedRequests, newReviewCount);
    
    // Update user profile
    await updateDoc(userRef, {
      rating: newRating,
      reviewCount: newReviewCount,
      completedRequests: newCompletedRequests,
      helpedPeople: newCompletedRequests, // Each completed request helped one person
      level: newLevel,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Updated rating profile for user ${userId}:`, {
      rating: newRating,
      reviewCount: newReviewCount,
      completedRequests: newCompletedRequests,
      level: newLevel
    });
    
  } catch (error) {
    console.error('Error updating user rating profile:', error);
    throw error;
  }
};

/**
 * Calculate user level based on completed requests and reviews
 */
export const calculateUserLevel = (completedRequests: number, reviewCount: number): number => {
  // Level calculation: 
  // Level 1: 0-4 completed requests
  // Level 2: 5-9 completed requests  
  // Level 3: 10-19 completed requests
  // Level 4: 20-49 completed requests
  // Level 5: 50+ completed requests
  
  // Also consider review count for bonus levels
  const reviewBonus = Math.floor(reviewCount / 10); // 1 bonus level per 10 reviews
  
  let baseLevel = 1;
  if (completedRequests >= 50) baseLevel = 5;
  else if (completedRequests >= 20) baseLevel = 4;
  else if (completedRequests >= 10) baseLevel = 3;
  else if (completedRequests >= 5) baseLevel = 2;
  
  // Add review bonus but cap at level 10
  return Math.min(baseLevel + reviewBonus, 10);
};

/**
 * Save a new review and update user profiles
 */
export const saveReviewAndUpdateProfiles = async (reviewData: ReviewData): Promise<string> => {
  try {
    // Save the review
    const reviewRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    
    // Update the reviewee's rating profile
    await updateUserRatingProfile(reviewData.revieweeUid, reviewData);
    
    // Also update the requester's completed requests count if this was a completed request
    if (reviewData.requestId) {
      const requestRef = doc(db, 'requests', reviewData.requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        if (requestData.status === 'completed') {
          // Update the requester's stats too
          const requesterRef = doc(db, 'users', requestData.userId);
          await updateDoc(requesterRef, {
            completedRequests: increment(1),
            updatedAt: serverTimestamp()
          });
        }
      }
    }
    
    return reviewRef.id;
  } catch (error) {
    console.error('Error saving review and updating profiles:', error);
    throw error;
  }
};

/**
 * Get user rating summary
 */
export const getUserRatingSummary = async (userId: string) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('revieweeUid', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    
    reviews.forEach((review: any) => {
      const rating = review.rating;
      ratingCounts[rating as keyof typeof ratingCounts]++;
      totalRating += rating;
    });
    
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: ratingCounts,
      recentReviews: reviews.slice(0, 10) // Last 10 reviews
    };
  } catch (error) {
    console.error('Error getting user rating summary:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentReviews: []
    };
  }
};
