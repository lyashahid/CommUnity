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
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '@/services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { postsCol } from '@/services/firebase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HelpRequest, HelpRequestStatus, RequestType } from '../../types/helpRequest';

type Offer = HelpRequest;

type MyOffersNavigationProp = StackNavigationProp<any, 'MyOffers'>;

const MyOffersScreen = () => {
  const navigation = useNavigation<MyOffersNavigationProp>();
  const { colors } = useTheme();
  
  // Safety check - if colors is not available, return loading
  if (!colors) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: '#000000' }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [indexError, setIndexError] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      postsCol,
      where('helperUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const offersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      })) as Offer[];

      setOffers(offersData);
      setLoading(false);
      setIndexError(null);
    }, (error) => {
      console.error('Error fetching offers:', error);
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

  const handleWithdrawOffer = (offerId: string) => {
    Alert.alert(
      'Withdraw Offer',
      'Are you sure you want to withdraw this help offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'helpOffers', offerId));
              Alert.alert('Success', 'Offer withdrawn successfully');
            } catch (error) {
              console.error('Error withdrawing offer:', error);
              Alert.alert('Error', 'Unable to withdraw offer');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: HelpRequestStatus) => {
    switch (status) {
      case 'open':
        return colors.status.warning;
      case 'pending':
        return colors.warning;
      case 'ongoing':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.status.error;
      case 'cancelled':
        return colors.status.neutral;
      default:
        return colors.status.neutral;
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'active') {
      // Active: requests I have accepted (ongoing)
      return offer.status === 'ongoing';
    } else {
      // Completed: after the requester marks it complete
      return offer.status === 'completed' || offer.status === 'cancelled' || offer.status === 'rejected';
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading your offers...</Text>
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
          <Text style={styles.headerTitle}>My Offers</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface.primary }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && [styles.activeTab, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText, { color: activeTab === 'active' ? '#FFFFFF' : colors.text.secondary }]}>
            Active ({offers.filter(o => o.status === 'ongoing').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && [styles.activeTab, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText, { color: activeTab === 'completed' ? '#FFFFFF' : colors.text.secondary }]}>
            Completed ({offers.filter(o => o.status === 'completed' || o.status === 'cancelled' || o.status === 'rejected').length})
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
          <View style={[styles.errorContainer, { backgroundColor: colors.background.secondary }]}>
            <Ionicons name="warning" size={24} color={colors.status.warning} />
            <Text style={[styles.errorText, { color: colors.text.primary }]}>{indexError}</Text>
            <Text style={[styles.errorSubtext, { color: colors.text.secondary }]}>Please try again in a few minutes</Text>
          </View>
        )}
        
        {filteredOffers.length === 0 && !indexError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hand-right-outline" size={64} color={colors.text.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {activeTab === 'active' ? 'No Active Offers' : 'No Completed Offers'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.primary }]}>
              {activeTab === 'active' 
                ? 'Your active help offers will appear here'
                : 'Your completed offers will appear here'
              }
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('App', { screen: 'Feed' })}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.browseButtonText}>Browse Requests</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOffers.map((offer) => (
            <View key={offer.id} style={[styles.offerCard, { backgroundColor: colors.surface.primary }]}>
              <View style={styles.offerHeader}>
                <View style={styles.userInfo}>
                  {offer.requesterName && (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>
                        {offer.requesterName.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.text.primary }]}>{offer.requesterName}</Text>
                    <Text style={[styles.offerTime, { color: colors.text.secondary }]}>
                      {offer.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.status) }]}>
                  <Text style={styles.statusText}>
                    {offer.status === 'ongoing' ? 'ACTIVE' : offer.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.requestInfo}>
                <Text style={[styles.requestTitle, { color: colors.text.primary }]}>{offer.title}</Text>
                <Text style={[styles.requestDescription, { color: colors.text.secondary }]} numberOfLines={2}>
                  {offer.description}
                </Text>
              </View>

              <View style={styles.offerMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={16} color={colors.text.secondary} />
                  <Text style={[styles.metaText, { color: colors.text.secondary }]}>{offer.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag" size={16} color={colors.text.secondary} />
                  <Text style={[styles.metaText, { color: colors.text.secondary }]}>{offer.category}</Text>
                </View>
              </View>

              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={[styles.chatButton, { borderColor: colors.primary }]}
                  onPress={() => navigation.navigate('Chat', {
                    requestId: offer.id,
                    otherUserId: offer.requesterId,
                    requestTitle: offer.title,
                    otherUserName: offer.requesterName,
                  })}
                >
                  <Ionicons name="chatbubbles" size={16} color={colors.primary} />
                  <Text style={[styles.chatButtonText, { color: colors.primary }]}>Chat</Text>
                </TouchableOpacity>
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
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
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
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  offerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  offerTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestInfo: {
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  offerMeta: {
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
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  withdrawButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MyOffersScreen;
