import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Alert,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  postsCol, 
  doc, 
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  db,
  auth,
  collection,
} from '@/services/firebase';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { HeroSection } from '../../components/common/HeroSection';
import { TabBar } from '../../components/common/TabBar';
import { RequestCard } from '../../components/common/RequestCard';
import { 
  HelpRequest, 
  RequestCardItem, 
  HelpRequestStatus, 
  RequestType,
  isRequestAvailableForFeed 
} from '../../types/helpRequest';

type HelpItem = RequestCardItem;

const { width, height } = Dimensions.get('window');

const FeedScreen = () => {
  const { colors } = useTheme();
  const stackNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [data, setData] = useState<HelpItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'nearby'>('all');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [stats, setStats] = useState({ nearby: 0, total: 0, helped: 12 });
  const insets = useSafeAreaInsets();

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Compact hero height - reduced from 220 to 160
  const HERO_HEIGHT = 160;
  const TAB_HEIGHT = 56;

  // Hero animation - smoother transition
  const heroHeight = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [HERO_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT - 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Tab bar elevation effect
  const tabElevation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 8],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    })();
  }, []);

  // Fetch posts from Firebase
  useEffect(() => {
    const q = query(postsCol, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const posts = snap.docs.map(doc => {
        const data = doc.data();
        let distanceKm = 0;
        
        if (userLocation && data.latitude && data.longitude) {
          distanceKm = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            data.latitude,
            data.longitude
          );
        }
        
        return { 
          id: doc.id, 
          title: data.title || 'Untitled Request',
          category: data.category || 'General',
          distanceKm,
          createdAt: data.createdAt,
          urgency: data.urgency || 'medium',
          description: data.description,
          ownerName: data.requesterName,
          ownerUid: data.requesterId,
          status: data.status || 'open',
          helperUid: data.helperId,
          type: data.type || 'feed_request',
          isOfficialRequest: data.isOfficialRequest || false,
          ...data 
        } as HelpItem;
      });
      
      // Filter requests using the new logic
      const filteredPosts = posts.filter(post => {
        // Convert RequestCardItem to HelpRequest for checking
        const helpRequest: HelpRequest = {
          id: post.id,
          title: post.title,
          description: post.description || '',
          category: post.category,
          location: post.distanceKm.toString(), // Use distance as location for filtering
          requesterId: post.ownerUid || '',
          requesterName: post.ownerName || 'Anonymous',
          helperId: post.helperUid,
          status: post.status || 'open',
          type: post.type || 'feed_request',
          isOfficialRequest: post.isOfficialRequest || false,
          helpOffers: 0,
          createdAt: post.createdAt,
          urgency: post.urgency || 'medium',
        };
        
        return isRequestAvailableForFeed(helpRequest, auth.currentUser?.uid);
      });
      
      setData(filteredPosts);
      const nearbyCount = filteredPosts.filter(item => item.distanceKm < 2).length;
      setStats({
        nearby: nearbyCount,
        total: filteredPosts.length,
        helped: 12
      });
    });
    
    return unsub;
  }, [userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const startHelpFlow = async (item: HelpItem) => {
    try {
      const postRef = doc(postsCol, item.id);
      
      // Check if this is a feed request or needs official request
      if (item.type === 'feed_request' && !item.isOfficialRequest) {
        // For feed requests, mark as pending and create chat
        await updateDoc(postRef, {
          status: 'pending',
          helperId: auth.currentUser?.uid,
          helperName: auth.currentUser?.displayName,
          updatedAt: serverTimestamp(),
        });
      } else {
        // For existing requests, just create chat
        await updateDoc(postRef, {
          helperId: auth.currentUser?.uid,
          helperName: auth.currentUser?.displayName,
          updatedAt: serverTimestamp(),
        });
      }

      const helperUid = auth.currentUser?.uid;
      const helperName = auth.currentUser?.displayName;
      const ownerUid = item.ownerUid!;
      const ownerName = item.ownerName!;

      if (!helperUid || !ownerUid) throw new Error('Missing user IDs');

      // Find or create chat
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participantIds', 'array-contains', helperUid));
      const snap = await getDocs(q);
      const existing = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .find((c: any) => 
          c.participantIds.includes(ownerUid) && c.requestId === item.id
        );

      let chatId: string;
      if (existing) {
        chatId = existing.id;
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: `I'd like to help with: ${item.title}`,
          lastMessageTime: serverTimestamp(),
          unreadCount: (existing.unreadCount || 0) + 1,
        });
      } else {
        const docRef = await addDoc(chatsRef, {
          participantIds: [helperUid, ownerUid],
          participants: {
            [helperUid]: { name: helperName || 'Helper' },
            [ownerUid]: { name: ownerName || 'Requester' },
          },
          lastMessage: `I'd like to help with: ${item.title}`,
          lastMessageTime: serverTimestamp(),
          requestId: item.id,
          requestTitle: item.title,
          createdAt: serverTimestamp(),
          unreadCount: ownerUid === helperUid ? 0 : 1,
        });
        chatId = docRef.id;
      }

      stackNavigation.navigate('Chat', {
        chatId,
        requestTitle: item.title,
        otherUserName: ownerName,
        requestId: item.id,
        otherUserId: ownerUid
      });
      
    } catch (error) {
      console.error('Help flow failed:', error);
      Alert.alert('Error', 'Could not start chat. Please try again.');
    }
  };

  const handleCardPress = (item: HelpItem) => {
    stackNavigation.navigate('RequestDetail', { requestId: item.id });
  };

  const handleSwipeStart = (item: HelpItem) => {
    setData(prevData => prevData.filter(card => card.id !== item.id));
  };

  const handleSwipeComplete = (item: HelpItem) => {
    console.log('Swipe animation completed for:', item.id);
  };

  const renderItem = ({ item, index }: { item: HelpItem; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          })
        }],
        marginBottom: 16,
      }}
    >
      <RequestCard 
        item={item} 
        onPress={handleCardPress}
        onSwipeRight={startHelpFlow}
        onSwipeStart={handleSwipeStart}
        onSwipeComplete={handleSwipeComplete}
      />
    </Animated.View>
  );

  const filteredData = activeTab === 'nearby' 
    ? data.filter(item => item.distanceKm < 2)
    : data;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Requests List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: HERO_HEIGHT + TAB_HEIGHT + 8,
            paddingBottom: 100,
          }
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={HERO_HEIGHT + TAB_HEIGHT}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="help-circle-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {activeTab === 'nearby' ? 'No Nearby Requests' : 'No Requests Yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {activeTab === 'nearby' 
                ? 'Check back later or browse all requests to help your community'
                : 'Be the first to request help and connect with your neighbors'
              }
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => tabNavigation.navigate('Create')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.emptyButtonText}>Create Request</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Animated Compact Hero - Now on top with higher z-index */}
      <Animated.View 
        style={[
          styles.heroContainer,
          {
            height: heroHeight,
            opacity: heroOpacity,
          }
        ]}
        pointerEvents="box-none"
      >
        <HeroSection 
          stats={stats}
          onRequestHelp={() => tabNavigation.navigate('Create')}
          onViewMap={() => tabNavigation.navigate('Map')}
        />
      </Animated.View>

      {/* Floating Tab Bar with Elevation */}
      <Animated.View 
        style={[
          styles.tabContainer,
          {
            shadowOpacity: tabElevation.interpolate({
              inputRange: [0, 8],
              outputRange: [0, 0.12],
            }),
            elevation: tabElevation,
          }
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.tabInner, { backgroundColor: colors.background.primary }]}>
          <TabBar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  tabContainer: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  tabInner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default FeedScreen;