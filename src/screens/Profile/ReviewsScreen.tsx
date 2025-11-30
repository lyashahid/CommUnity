import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '@/services/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type Review = {
  id: string;
  requestId: string;
  requestTitle: string;
  reviewerUid: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeUid: string;
  revieweeName: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: any;
  helpful?: number;
  chatId: string;
};

type MyReviewsNavigationProp = StackNavigationProp<any, 'MyReviews'>;

const MyReviewsScreen = () => {
  const navigation = useNavigation<MyReviewsNavigationProp>();
  const { colors } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [indexError, setIndexError] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    header: {
      paddingTop: 20,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    placeholder: {
      width: 40,
    },
    ratingSummary: {
      alignItems: 'center',
      paddingTop: 8,
    },
    averageRating: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginBottom: 4,
    },
    totalReviews: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface.primary,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text.primary,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    browseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    browseButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    errorContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.primary,
      marginTop: 8,
      textAlign: 'center',
    },
    errorSubtext: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 4,
      textAlign: 'center',
    },
    reviewCard: {
      backgroundColor: colors.surface.primary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: 'rgba(0, 0, 0, 0.05)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reviewerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    reviewerDetails: {
      marginLeft: 12,
    },
    reviewerName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
    reviewDate: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    requestInfo: {
      marginBottom: 8,
    },
    requestTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    reviewComment: {
      fontSize: 14,
      color: colors.text.primary,
      lineHeight: 20,
      marginBottom: 12,
    },
    reviewFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    helpfulButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    helpfulText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    tag: {
      backgroundColor: colors.background.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '500',
    },
  });

  useEffect(() => {
    if (!currentUser) return;

    // Fetch reviews I've received
    const receivedQuery = query(
      collection(db, 'reviews'),
      where('revieweeUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Fetch reviews I've given
    const givenQuery = query(
      collection(db, 'reviews'),
      where('reviewerUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
      const receivedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Review[];

      if (activeTab === 'received') {
        setReviews(receivedReviews);
      }
      setLoading(false);
      setIndexError(null);
    }, (error) => {
      console.error('Error fetching received reviews:', error);
      setLoading(false);
      
      // Check if this is an index error
      if (error.message.includes('requires an index')) {
        setIndexError('Database index is being created. This may take a few minutes.');
      }
    });

    const unsubscribeGiven = onSnapshot(givenQuery, (snapshot) => {
      const givenReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Review[];

      if (activeTab === 'given') {
        setReviews(givenReviews);
      }
    });

    return () => {
      unsubscribeReceived();
      unsubscribeGiven();
    };
  }, [currentUser, activeTab]);

  useEffect(() => {
    // Refetch reviews when tab changes
    if (!currentUser) return;

    const queryRef = activeTab === 'received' 
      ? query(
          collection(db, 'reviews'),
          where('revieweeUid', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'reviews'),
          where('reviewerUid', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Review[];
      setReviews(reviewsData);
      setIndexError(null);
    }, (error) => {
      console.error('Error fetching reviews:', error);
      
      // Check if this is an index error
      if (error.message.includes('requires an index')) {
        setIndexError('Database index is being created. This may take a few minutes.');
      }
    });

    return () => unsubscribe();
  }, [activeTab, currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !selectedRequest) return;

    try {
      // Get the other user's ID from the request
      const requestDoc = await getDoc(doc(db, 'requests', selectedRequest.id));
      if (!requestDoc.exists()) {
        Alert.alert('Error', 'Request not found');
        return;
      }

      const requestData = requestDoc.data();
      const revieweeUid = requestData.userId; // This is the person who created the request
      const revieweeName = requestData.userName || requestData.userDisplayName || 'Community Member';

      await addDoc(collection(db, 'reviews'), {
        requestId: selectedRequest.id,
        requestTitle: selectedRequest.title,
        reviewerUid: currentUser.uid,
        reviewerName: currentUser.displayName || 'Anonymous',
        revieweeUid: revieweeUid,
        revieweeName: revieweeName,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date(),
        helpful: 0,
        chatId: `${currentUser.uid}_${revieweeUid}`, // Generate chat ID
      });

      Alert.alert('Success', 'Review submitted successfully');
      setShowWriteReview(false);
      setNewReview({ rating: 5, comment: '' });
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Unable to submit review');
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => interactive && onRatingChange?.(star)}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={interactive ? 24 : 16}
            color={interactive ? colors.primary : '#F59E0B'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight] as const}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={styles.placeholder} />
        </View>

        {activeTab === 'received' && reviews.length > 0 && (
          <View style={styles.ratingSummary}>
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            {renderStars(averageRating)}
            <Text style={styles.totalReviews}>{reviews.length} reviews</Text>
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received ({reviews.filter(r => activeTab === 'received').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'given' && styles.activeTab]}
          onPress={() => setActiveTab('given')}
        >
          <Text style={[styles.tabText, activeTab === 'given' && styles.activeTabText]}>
            Given ({reviews.filter(r => activeTab === 'given').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {indexError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={24} color={colors.status.warning} />
            <Text style={styles.errorText}>{indexError}</Text>
            <Text style={styles.errorSubtext}>Please try again in a few minutes</Text>
          </View>
        )}
        
        {reviews.length === 0 && !indexError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color={colors.text.placeholder} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'received' ? 'No Reviews Yet' : 'No Given Reviews'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'received' 
                ? 'Reviews from community members will appear here'
                : 'Reviews you\'ve written will appear here'
              }
            </Text>
            {activeTab === 'given' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('App', { screen: 'Feed' })}
              >
                <Ionicons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Find People to Review</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  {activeTab === 'received' ? (
                    <>
                      {review.reviewerAvatar ? (
                        <Image source={{ uri: review.reviewerAvatar }} style={styles.reviewerAvatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {review.reviewerName.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewerDetails}>
                        <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                        <Text style={styles.reviewDate}>
                          {review.createdAt.toLocaleDateString()}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.reviewerDetails}>
                      <Text style={styles.reviewerName}>You reviewed</Text>
                      <Text style={styles.reviewDate}>
                        {review.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
                {renderStars(review.rating)}
              </View>

              <View style={styles.requestInfo}>
                <Text style={styles.requestTitle}>{review.requestTitle}</Text>
              </View>

              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}

              {review.tags && review.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {review.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.reviewFooter}>
                <TouchableOpacity style={styles.helpfulButton}>
                  <Ionicons name="thumbs-up" size={16} color={colors.text.secondary} />
                  <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


export default MyReviewsScreen;
