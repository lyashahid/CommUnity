import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  db,
  auth,
} from '@/services/firebase';
import * as Location from 'expo-location';

type RouteParams = {
  requestId: string;
};

type HelpRequest = {
  id: string;
  title: string;
  category: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed';
  createdAt: any;
  updatedAt?: any;
  requesterId: string;
  requesterName: string;
  ownerPhoto?: string;
  ownerBio?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  helperUid?: string;
  helperName?: string;
  distanceKm?: number;
};

const RequestDetailScreen = () => {
  const { colors, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { requestId } = route.params as RouteParams;
  
  console.log('RequestDetailScreen mounted, route.params:', route.params);
  console.log('Extracted requestId:', requestId);
  
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
    getUserLocation();
  }, [requestId]);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    } catch (error) {
      console.log('Location permission denied or error:', error);
    }
  };

  const fetchRequestDetails = async () => {
    try {
      console.log('Fetching request details for ID:', requestId);
      const requestDoc = await getDoc(doc(db, 'requests', requestId));
      console.log('Request doc exists:', requestDoc.exists());
      
      if (requestDoc.exists()) {
        const data = requestDoc.data();
        console.log('Request data:', data);
        
        // Fetch owner details first
        let ownerData = { name: 'Anonymous', bio: '', photo: '' };
        if (data.ownerUid || data.requesterId) {
          const ownerUid = data.ownerUid || data.requesterId;
          const ownerDoc = await getDoc(doc(db, 'users', ownerUid));
          if (ownerDoc.exists()) {
            const userData = ownerDoc.data();
            ownerData = {
              name: userData.displayName || userData.name || 'Community Member',
              bio: userData.bio || '',
              photo: userData.photoURL || userData.avatar || '',
            };
          }
        }

        // Calculate distance if we have user location and request location
        let distanceKm = 0;
        if (userLocation && data.latitude && data.longitude) {
          distanceKm = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            data.latitude,
            data.longitude
          );
        }

        const requestData: HelpRequest = {
          id: requestDoc.id,
          title: data.title || 'Untitled Request',
          category: data.category || 'General',
          description: data.description || '',
          urgency: data.urgency || 'medium',
          status: data.status || 'open',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          requesterId: data.ownerUid || data.requesterId || '',
          requesterName: ownerData.name,
          ownerBio: ownerData.bio,
          ownerPhoto: ownerData.photo,
          latitude: data.latitude,
          longitude: data.longitude,
          locationName: data.address || data.locationName,
          helperUid: data.helperUid,
          helperName: data.helperName,
          distanceKm,
        };

        setRequest(requestData);
        setIsOwner((data.ownerUid || data.requesterId) === auth.currentUser?.uid);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      Alert.alert('Error', 'Could not load request details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleOfferHelp = async () => {
    if (!request || isOwner) return;

    Alert.alert(
      'Offer Help',
      `Start a chat with ${request.ownerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Help', 
          onPress: async () => {
            try {
              await startHelpFlow();
            } catch (e) {
              console.error('Help flow failed', e);
              Alert.alert('Error', 'Could not start chat. Please try again.');
            }
          }
        },
      ]
    );
  };

  // Helper function to get user display name with fallbacks
  const getUserDisplayName = (user: any, fallback: string) => {
    return user?.displayName || 
           user?.name || 
           user?.email?.split('@')[0] || 
           fallback;
  };

  const startHelpFlow = async () => {
    if (!request) return;

    // Update post status
    const postRef = doc(db, 'requests', requestId);
    await updateDoc(postRef, {
      status: 'in_progress',
      helperUid: auth.currentUser?.uid,
      helperName: getUserDisplayName(auth.currentUser, 'Helper'),
      updatedAt: serverTimestamp(),
    });

    // Create or reuse chat
    const helperUid = auth.currentUser?.uid as string;
    const helperName = getUserDisplayName(auth.currentUser, 'Helper');
    const ownerUid = request.requesterId;

    if (!helperUid || !ownerUid) throw new Error('Missing user IDs');

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participantIds', 'array-contains', helperUid));
    const snap = await getDocs(q);
    const existing = snap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .find(c => Array.isArray(c.participantIds) && c.participantIds.includes(ownerUid) && c.requestId === requestId);

    let chatId: string;
    if (existing) {
      chatId = existing.id;
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: "I'd like to help",
        lastMessageTime: serverTimestamp(),
      });
    } else {
      // Get owner name with fallbacks
      const ownerName = request.ownerName || 
                       request.requesterName || 
                       request.owner?.displayName || 
                       request.owner?.name || 
                       'Requester';
      
      console.log('Creating chat with participants:', {
        helperUid,
        helperName,
        ownerUid,
        ownerName
      });

      const docRef = await addDoc(chatsRef, {
        participantIds: [helperUid, ownerUid],
        participants: {
          [helperUid]: { name: helperName },
          [ownerUid]: { name: ownerName },
        },
        lastMessage: "I'd like to help",
        lastMessageTime: serverTimestamp(),
        unreadCount: 1,
        requestId: requestId,
        requestTitle: request.title,
        createdAt: serverTimestamp(),
      });
      chatId = docRef.id;
    }

    // Add starter message
    await addDoc(collection(doc(db, 'chats', chatId), 'messages'), {
      text: "I'd like to help with this request",
      senderId: helperUid,
      createdAt: serverTimestamp(),
    });

    // Navigate to chat
    navigation.navigate('Chat', { 
      chatId, 
      requestId, 
      otherUserId: request.requesterId,
      otherUserName: request.ownerName 
    });
  };

  const handleReject = () => {
    Alert.alert(
      'Skip Request',
      'Are you sure you want to skip this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!request) return;
    
    try {
      await Share.share({
        message: `Help needed: ${request.title}\n\n${request.description}\n\nJoin CommUnity to help!`,
        title: request.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Errands': 'cart',
      'Tutoring': 'school',
      'Tech Support': 'laptop',
      'Pet Care': 'paw',
      'Home Repair': 'hammer',
      'Transportation': 'car',
      'Gardening': 'leaf',
      'Cleaning': 'sparkles',
      'Moving Help': 'cube',
      'General': 'help-circle'
    };
    return icons[category] || 'help-circle';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return colors.urgency.high;
      case 'medium': return colors.urgency.medium;
      case 'low': return colors.urgency.low;
      default: return colors.status.neutral;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.success;
      case 'in_progress': return colors.info;
      case 'completed': return colors.status.neutral;
      default: return colors.status.neutral;
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>Request Not Found</Text>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>This request may have been deleted or is no longer available.</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface.primary, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Request Details</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Request Card */}
        <View style={[styles.requestCard, { backgroundColor: colors.surface.card, shadowColor: colors.shadow }]}>
          <View style={styles.requestHeader}>
            <View style={styles.categoryRow}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.surface.secondary }]}>
                <Ionicons 
                  name={getCategoryIcon(request.category) as any} 
                  size={16} 
                  color={colors.primary} 
                />
                <Text style={[styles.categoryText, { color: colors.text.primary }]}>{request.category}</Text>
              </View>
              <View style={styles.badgesRow}>
                <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(request.urgency) }]}>
                  <Text style={styles.urgencyText}>
                    {request.urgency?.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>
                    {request.status?.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.requestTitle, { color: colors.text.primary }]}>{request.title}</Text>
          </View>

          <Text style={[styles.requestDescription, { color: colors.text.secondary }]}>{request.description}</Text>

          {/* Request Meta Info */}
          <View style={[styles.metaInfo, { borderTopColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>Posted {getTimeAgo(request.createdAt)}</Text>
            </View>
            {request.distanceKm !== undefined && request.distanceKm > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
                <Text style={[styles.metaText, { color: colors.text.secondary }]}>{request.distanceKm} km away</Text>
              </View>
            )}
            {request.locationName && (
              <View style={styles.metaItem}>
                <Ionicons name="map-outline" size={16} color={colors.text.secondary} />
                <Text style={[styles.metaText, { color: colors.text.secondary }]}>{request.locationName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {request && (
          <View style={styles.actionSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.rejectButton, { shadowColor: colors.error }]}
                onPress={handleReject}
              >
                <LinearGradient
                  colors={isDark ? ['#991B1B', '#7F1D1D'] : ['#FEE2E2', '#FECACA']}
                  style={styles.rejectButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                  <Text style={[styles.rejectButtonText, { color: colors.error }]}>Skip</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.acceptButton, { shadowColor: colors.primary }]}
                onPress={handleOfferHelp}
              >
                <LinearGradient
                  colors={isDark ? ['#2C5F7D', '#1E4A63'] : ['#E8D5F2', '#F5F0FA']}
                  style={styles.acceptButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="heart-outline" size={20} color={isDark ? colors.primary : '#8B7AA8'} />
                  <Text style={[styles.acceptButtonText, { color: isDark ? colors.primary : '#8B7AA8' }]}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Requester Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Requester</Text>
          <View style={[styles.requesterCard, { backgroundColor: colors.surface.card, shadowColor: colors.shadow }]}>
            <View style={styles.requesterInfo}>
              <View style={styles.avatar}>
                {request.ownerPhoto ? (
                  <Image source={{ uri: request.ownerPhoto }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface.secondary }]}>
                    <Ionicons name="person" size={24} color={colors.text.placeholder} />
                  </View>
                )}
              </View>
              <View style={styles.requesterDetails}>
                <Text style={[styles.requesterName, { color: colors.text.primary }]}>
                  {request.requesterName || 'Community Member'}
                </Text>
                {request.ownerBio ? (
                  <Text style={[styles.requesterBio, { color: colors.text.secondary }]}>{request.ownerBio}</Text>
                ) : (
                  <Text style={[styles.requesterBio, { color: colors.text.placeholder }]}>No bio available</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Helper Info (if assigned) */}
        {request.helperUid && request.helperName && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Helper</Text>
            <View style={[styles.helperCard, { backgroundColor: isDark ? colors.background.accent : '#F0FDF4', shadowColor: colors.shadow }]}>
              <View style={styles.requesterInfo}>
                <View style={styles.avatar}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface.secondary }]}>
                    <Ionicons name="person" size={24} color={colors.success} />
                  </View>
                </View>
                <View style={styles.requesterDetails}>
                  <Text style={[styles.requesterName, { color: colors.text.primary }]}>{request.helperName}</Text>
                  <Text style={[styles.helperStatus, { color: colors.success }]}>Currently helping</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {isOwner && (
          <View style={[styles.ownerSection, { backgroundColor: isDark ? colors.background.accent : '#FEF3C7' }]}>
            <Text style={[styles.ownerNote, { color: isDark ? colors.warning : '#92400E' }]}>
              This is your request. {request.status === 'open' 
                ? 'Waiting for someone to offer help.' 
                : request.status === 'in_progress' 
                ? 'Someone is currently helping you.' 
                : 'This request has been completed.'
              }
            </Text>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  requestHeader: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  requestTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  requestDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  metaInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  requesterCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  requesterBio: {
    fontSize: 14,
    lineHeight: 18,
  },
  helperCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  helperStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  rejectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ownerSection: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
  },
  ownerNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RequestDetailScreen;
