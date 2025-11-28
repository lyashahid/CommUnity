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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '@/services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { postsCol } from '@/services/firebase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HelpRequest, HelpRequestStatus, RequestType } from '../../types/helpRequest';

type Request = HelpRequest;

type MyRequestsNavigationProp = StackNavigationProp<any, 'MyRequests'>;

const MyRequestsScreen = () => {
  const navigation = useNavigation<MyRequestsNavigationProp>();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [indexError, setIndexError] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      postsCol,
      where('requesterId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
      })) as Request[];

      setRequests(requestsData);
      setLoading(false);
      setIndexError(null);
    }, (error) => {
      console.error('Error fetching requests:', error);
      setLoading(false);
      
      // Check if this is an index error
      if (error.message.includes('requires an index')) {
        setIndexError('Database index is being created. This may take a few minutes.');
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDeleteRequest = (requestId: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(postsCol, requestId));
              Alert.alert('Success', 'Request deleted successfully');
            } catch (error) {
              console.error('Error deleting request:', error);
              Alert.alert('Error', 'Unable to delete request');
            }
          },
        },
      ]
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return colors.status.error;
      case 'medium': return colors.status.warning;
      case 'low': return colors.success;
      default: return colors.status.neutral;
    }
  };

  const getStatusColor = (status: HelpRequestStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'ongoing':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.status.error;
      case 'cancelled':
        return colors.text.secondary;
      case 'open':
        return colors.status.neutral;
      default:
        return colors.text.secondary;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'active') {
      // Ongoing: sent → accepted → pending/active
      return request.status === 'open' || request.status === 'pending' || request.status === 'ongoing';
    } else {
      // Completed: when I mark the request complete and rate the helper
      return request.status === 'completed' || request.status === 'cancelled' || request.status === 'rejected';
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          <Text style={styles.headerTitle}>My Requests</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active ({requests.filter(r => r.status === 'open' || r.status === 'pending' || r.status === 'ongoing').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({requests.filter(r => r.status === 'completed' || r.status === 'cancelled' || r.status === 'rejected').length})
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
        
        {filteredRequests.length === 0 && !indexError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.text.placeholder} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'No Active Requests' : 'No Completed Requests'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'You haven\'t created any help requests yet'
                : 'Your completed requests will appear here'
              }
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('App', { screen: 'Create' })}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} style={[
              styles.requestCard,
              request.isOfficialRequest && styles.officialRequestCard
            ]}>
              <View style={styles.requestHeader}>
                <View style={styles.requestTitleContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    {request.isOfficialRequest && (
                      <View style={styles.officialBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                        <Text style={styles.officialBadgeText}>Official</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>
                      {request.status === 'ongoing' ? 'ONGOING' : request.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => handleDeleteRequest(request.id)}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.requestDescription} numberOfLines={2}>
                {request.description}
              </Text>

              {request.isOfficialRequest && request.location === 'Chat' && (
                <View style={styles.chatRequestInfo}>
                  <Ionicons name="chatbubble" size={14} color={colors.primary} />
                  <Text style={styles.chatRequestText}>Chat-based request</Text>
                </View>
              )}

              <View style={styles.requestMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color={colors.text.secondary} />
                  <Text style={styles.metaText}>{request.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color={colors.text.secondary} />
                  <Text style={styles.metaText}>
                    {request.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                  </Text>
                </View>
              </View>

              {/* Rating display for completed requests */}
              {request.status === 'completed' && request.rating && (
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= request.rating! ? 'star' : 'star-outline'}
                        size={16}
                        color={colors.warning}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>{request.rating}/5</Text>
                  {request.feedback && (
                    <Text style={styles.feedbackText} numberOfLines={1}>
                      "{request.feedback}"
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.requestFooter}>
                <View style={styles.urgencyContainer}>
                  <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(request.urgency) }]} />
                  <Text style={styles.urgencyText}>{request.urgency.toUpperCase()}</Text>
                </View>
                <View style={styles.offersContainer}>
                  <Ionicons name="people" size={16} color={colors.primary} />
                  <Text style={styles.offersText}>{request.helpOffers} offers</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestTitleContainer: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  offersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offersText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  // Official request styles
  officialRequestCard: {
    borderWidth: 2,
    borderColor: colors.success + '30',
    backgroundColor: colors.success + '5',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.success + '20',
    borderRadius: 8,
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  chatRequestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chatRequestText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  // Rating styles
  ratingContainer: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  feedbackText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default MyRequestsScreen;
