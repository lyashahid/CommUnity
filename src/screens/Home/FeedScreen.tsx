import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList, // Changed from FlatList
  RefreshControl,
  Animated,
  Alert,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  postsCol, 
  doc, 
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  db,
  auth,
  collection,
  where // Added missing import
} from '@/services/firebase';
import * as Location from 'expo-location';
import { signOut } from '@/services/firebase';
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
  isRequestAvailableForFeed 
} from '../../types/helpRequest';

type HelpItem = RequestCardItem;

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

  // Animation for fading in items (Keep this, it's nice)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateIn();
    getUserLocation();
  }, []);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    setUserLocation(location);
  };

  // ... (Keep your calculateDistance function here) ...
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10;
  };

  // ... (Keep your Firebase useEffect here) ...
  useEffect(() => {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'), limit(50));
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
          // ... map your fields ...
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
      
      const filteredPosts = posts.filter(post => {
        // Create a HelpRequest object with the required properties
        const helpRequest: HelpRequest = {
          id: post.id,
          title: post.title,
          description: post.description || '',
          category: post.category,
          urgency: post.urgency || 'medium',
          location: post.distanceKm ? `${post.distanceKm} km away` : 'Unknown location',
          type: post.type || 'feed_request',
          status: post.status || 'open',
          requesterId: post.ownerUid || '',
          requesterName: post.ownerName || 'Anonymous',
          helperId: post.helperUid,
          createdAt: post.createdAt,
          helpOffers: 0, // Default value
          isOfficialRequest: post.isOfficialRequest || false,
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

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) await getUserLocation();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ... (Keep startHelpFlow, handleCardPress, handleSwipeStart, handleSwipeComplete) ...
  const handleCardPress = (item: HelpItem) => {
    console.log('Card pressed, item:', item);
    console.log('Navigating to RequestDetail with requestId:', item.id);
     stackNavigation.navigate('RequestDetail', { requestId: item.id });
  };
  const startHelpFlow = async (item: HelpItem) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to help with requests');
        return;
      }

      // Update the request status to 'ongoing' and set the helper
      const requestRef = doc(db, 'requests', item.id);
      await updateDoc(requestRef, {
        status: 'ongoing',
        helperUid: currentUser.uid,
        helperName: currentUser.displayName || 'Anonymous Helper',
        updatedAt: serverTimestamp()
      });

      // Create a chat for this request
      const chatData = {
        participantIds: [currentUser.uid, item.ownerUid],
        participantNames: [currentUser.displayName || 'Helper', item.ownerName || 'Requester'],
        requestId: item.id,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
        unreadCounts: {
          [currentUser.uid]: 0,
          [item.ownerUid]: 0
        }
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);

      // Navigate to the chat screen
      stackNavigation.navigate('Chat', {
        requestId: item.id,
        otherUserId: item.ownerUid,
        otherUserName: item.ownerName,
        chatId: chatRef.id
      });

    } catch (error) {
      console.error('Error starting help flow:', error);
      Alert.alert('Error', 'Could not start help flow. Please try again.');
    }
  };

  const skipRequest = (item: HelpItem) => {
    // Remove the item from the current data to simulate skipping
    setData(prevData => prevData.filter(request => request.id !== item.id));
  };

  const handleSwipeStart = (item: HelpItem) => {
    // Remove the card immediately when swipe starts to prevent showing the back side
    setData(prevData => prevData.filter(request => request.id !== item.id));
  };

  const handleSwipeComplete = (item: HelpItem) => {
    // Animation complete - any additional cleanup can be done here
    console.log('Swipe animation completed for item:', item.id);
  };


  const renderItem = ({ item }: { item: HelpItem }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
        <RequestCard 
          item={item} 
          onPress={handleCardPress}
          onSwipeRight={startHelpFlow}
          onSwipeLeft={skipRequest}
          onSwipeStart={handleSwipeStart}
          onSwipeComplete={handleSwipeComplete}
        />
      </View>
    </Animated.View>
  );

  const filteredData = activeTab === 'nearby' 
    ? data.filter(item => item.distanceKm < 2)
    : data;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* 1. Translucent Status Bar allows Hero gradient to show at the very top */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <SectionList
        sections={[{ title: 'Requests', data: filteredData }]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        
        // 2. The Tabs go here. They will stick automatically.
        stickySectionHeadersEnabled={true}
        renderSectionHeader={() => (
          <View style={[styles.stickyHeader, { backgroundColor: colors.background.primary }]}>
             <TabBar 
               activeTab={activeTab}
               onTabChange={setActiveTab}
             />
          </View>
        )}

        // 3. The Hero goes here. It scrolls with the list naturally.
        ListHeaderComponent={
          <View style={{ marginBottom: 0 }}>
             <HeroSection 
               stats={stats}
               onRequestHelp={() => tabNavigation.navigate('Create')}
               onViewMap={() => tabNavigation.navigate('Map')}
             />
          </View>
        }

        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            progressViewOffset={insets.top + 20} // Push loader down a bit
          />
        }
        
        // Empty State
        ListEmptyComponent={
           <View style={styles.emptyState}>
             {/* ... Keep your existing empty state code ... */}
             <Text style={{color: colors.text.secondary}}>No requests found</Text>
           </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  stickyHeader: {
    // This ensures the background is solid when it sticks to the top
    paddingVertical: 8,
    paddingHorizontal: 16,
    // Add shadow if you want depth when sticky
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tempLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tempLogoutText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
});

export default FeedScreen;