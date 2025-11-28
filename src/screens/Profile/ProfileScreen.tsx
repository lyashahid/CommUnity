import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '@/services/firebase';
import { doc, getDoc, setDoc, signOut } from '@/services/firebase';
import { useFocusEffect, useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Profile: {
    updated?: boolean;
    profile?: UserProfile;
  };
  EditProfile: {
    user: {
      uid: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
      bio?: string;
    };
  };
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

type UserProfile = {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  location?: string;
  joinDate: string;
  level: number;
  rating: number;
  reviewCount: number;
  completedRequests: number;
  helpedPeople: number;
  responseRate: number;
};

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const route = useRoute<ProfileScreenRouteProp>();
  const { colors, isDark, setTheme, theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dominantColors, setDominantColors] = useState<{ primary: string; secondary: string } | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const currentUser = auth.currentUser;

  const getColorPalette = (userName: string) => {
    // Simple color palettes based on name hash
    const palettes = [
      { primary: '#FF6B6B', secondary: '#4ECDC4' }, // Coral to Turquoise
      { primary: '#95E1D3', secondary: '#F38181' }, // Mint to Rose
      { primary: '#A8E6CF', secondary: '#FFD3B6' }, // Sage to Peach
      { primary: '#FF8B94', secondary: '#A8DADC' }, // Salmon to Blue
      { primary: '#C9ADA7', secondary: '#F2CC8F' }, // Taupe to Yellow
      { primary: '#B4A7D6', secondary: '#FFE5E5' }, // Lavender to Pink
      { primary: '#FFB6C1', secondary: '#87CEEB' }, // Light Pink to Sky Blue
      { primary: '#98D8C8', secondary: '#FFD700' }, // Seafoam to Gold
    ];

    // Use name to pick a consistent palette
    const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palettes[hash % palettes.length];
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchProfileData = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Fetching profile data for user:', currentUser.uid);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        console.log('User document exists, loading data...');
        const userData = userDoc.data();
        const profileData = {
          name: currentUser.displayName || 'Community Helper',
          email: currentUser.email || '',
          avatar: userData.photoURL || currentUser.photoURL || undefined,
          bio: userData.bio || 'Share a bit about yourself and how you like to help others.',
          skills: userData.skills || [],
          location: userData.location || 'Add your location',
          joinDate: userData.createdAt ? new Date(userData.createdAt).getFullYear().toString() : '2024',
          level: userData.level || 1,
          rating: userData.rating || 0,
          reviewCount: userData.reviewCount || 0,
          completedRequests: userData.completedRequests || 0,
          helpedPeople: userData.helpedPeople || 0,
          responseRate: userData.responseRate || 0,
        };
        setProfile(profileData);
        
        // Set color palette based on user name
        const palette = getColorPalette(profileData.name);
        setDominantColors(palette);
        
        animateIn();
      } else {
        console.log('User document does not exist, creating default profile...');
        const defaultProfile: UserProfile = {
          name: currentUser.displayName || 'Community Helper',
          email: currentUser.email || '',
          avatar: currentUser.photoURL || undefined,
          bio: 'Share a bit about yourself and how you like to help others.',
          skills: [],
          location: 'Add your location',
          joinDate: new Date().getFullYear().toString(),
          level: 1,
          rating: 0,
          reviewCount: 0,
          completedRequests: 0,
          helpedPeople: 0,
          responseRate: 0,
        };
        
        console.log('Creating user document with data:', defaultProfile);
        await setDoc(doc(db, 'users', currentUser.uid), {
          displayName: defaultProfile.name,
          email: defaultProfile.email,
          photoURL: defaultProfile.avatar,
          bio: defaultProfile.bio,
          skills: defaultProfile.skills,
          location: defaultProfile.location,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          level: defaultProfile.level,
          rating: defaultProfile.rating,
          reviewCount: defaultProfile.reviewCount,
          completedRequests: defaultProfile.completedRequests,
          helpedPeople: defaultProfile.helpedPeople,
          responseRate: defaultProfile.responseRate,
        });
        
        setProfile(defaultProfile);
        animateIn();
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        Alert.alert('Permission Error', 'You do not have permission to access this profile. Please check your login status.');
      } else if (error.code === 'unavailable') {
        Alert.alert('Network Error', 'Unable to connect to the database. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Failed to load profile. Please try again.');
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
    }, [currentUser])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Unable to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (!currentUser) return;
    
    navigation.navigate('EditProfile', {
      user: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        bio: profile?.bio
      }
    });
  };

  const handleAddSkill = () => {
    Alert.alert('Add Skill', 'This feature will be available soon!');
  };

  const handleMyRequests = () => {
    navigation.navigate('MyRequests' as any);
  };

  const handleMyOffers = () => {
    navigation.navigate('MyOffers' as any);
  };

  const handleMessages = () => {
    navigation.navigate('App', { screen: 'Messages' });
  };

  const handleReviews = () => {
    navigation.navigate('Reviews');
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.floor(rating) ? 'star' : star <= rating ? 'star-half' : 'star-outline'}
          size={16}
          color="#F59E0B"
        />
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );

  const getLevelColor = (level: number) => {
    if (level >= 10) return colors.status.warning; // Gold
    if (level >= 5) return colors.status.neutral;   // Silver
    return colors.primary;                   // Primary Green
  };

  const handleDarkModeToggle = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const isDarkModeEnabled = theme === 'dark' || (theme === 'system' && isDark);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.accent }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background.accent }]}>
          <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.accent }]} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={dominantColors ? [dominantColors.primary, dominantColors.secondary] : [colors.primary, colors.primaryLight] as const}
          style={styles.headerGradient}
        >
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={dominantColors ? [dominantColors.primary, dominantColors.secondary] : [colors.primary, colors.primaryLight] as const}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                      {profile.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </LinearGradient>
                )}
                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: colors.primary, borderColor: colors.background.primary }]} 
                  onPress={handleEditProfile}
                >
                  <Ionicons name="camera" size={16} color={colors.text.inverse} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.name, { color: colors.text.inverse }]}>{profile.name}</Text>
            <Text style={[styles.bio, { color: 'rgba(255, 255, 255, 0.9)' }]}>{profile.bio}</Text>

            <View style={styles.ratingSection}>
              {renderStars(profile.rating)}
              <Text style={[styles.reviewCount, { color: 'rgba(255,255,255,0.8)' }]}>{profile.reviewCount} reviews</Text>
            </View>

            <View style={styles.locationSection}>
              <Ionicons name="location" size={14} color="#FFFFFF" />
              <Text style={[styles.locationText, { color: 'rgba(255, 255, 255, 0.9)' }]}>{profile.location}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Stats Section */}
        <Animated.View 
          style={[
            styles.statsCard,
            {
              backgroundColor: colors.surface.primary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Community Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.completedRequests}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.background.secondary }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.helpedPeople}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>People Helped</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.background.secondary }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.responseRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Response Rate</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.background.secondary }]} />
            <View style={styles.statItem}>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(profile.level) }]}>
                <Ionicons name="trophy" size={14} color="#FFFFFF" />
                <Text style={styles.levelText}>Level {profile.level}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Skills Section */}
        <Animated.View 
          style={[
            styles.skillsCard,
            {
              backgroundColor: colors.background.primary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Skills & Expertise</Text>
            <TouchableOpacity onPress={handleAddSkill}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.skillsContainer}>
            {profile.skills.length > 0 ? (
              profile.skills.map((skill, index) => (
                <View key={index} style={[styles.skillTag, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                  <Text style={[styles.skillText, { color: colors.text.primary }]}>{skill}</Text>
                </View>
              ))
            ) : (
              <TouchableOpacity style={[styles.emptySkills, { backgroundColor: colors.background.secondary, borderColor: colors.border, borderStyle: 'dashed' }]} onPress={handleAddSkill}>
                <Ionicons name="add" size={24} color={colors.text.placeholder} />
                <Text style={[styles.emptySkillsText, { color: colors.text.secondary }]}>Add your first skill</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.actionsCard,
            {
              backgroundColor: colors.surface.primary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={handleMyRequests}>
              <View style={[styles.actionIcon, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
                <Ionicons name="heart" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.actionText, { color: colors.text.primary }]}>My Requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleMyOffers}>
              <View style={[styles.actionIcon, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
                <Ionicons name="hand-right" size={20} color="#10B981" />
              </View>
              <Text style={[styles.actionText, { color: colors.text.primary }]}>My Offers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleMessages}>
              <View style={[styles.actionIcon, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
                <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Messages</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleReviews}>
              <View style={[styles.actionIcon, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.actionText, { color: colors.text.primary }]}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Settings Section */}
        <Animated.View 
          style={[
            styles.menuCard,
            {
              backgroundColor: colors.surface.primary,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Preferences</Text>

          <View style={[styles.menuItem, { borderBottomColor: colors.background.tertiary }]}>
            <View style={[styles.menuIcon, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="notifications" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuText, { color: colors.text.primary }]}>Notifications</Text>
              <Text style={[styles.menuSubtext, { color: colors.text.secondary }]}>Receive help requests and messages</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.ui.border, true: colors.primary }}
              thumbColor={colors.text.inverse}
            />
          </View>

          <View style={[styles.menuItem, { borderBottomColor: colors.background.tertiary }]}>
            <View style={[styles.menuIcon, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="moon" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuText, { color: colors.text.primary }]}>Dark Mode</Text>
              <Text style={[styles.menuSubtext, { color: colors.text.secondary }]}>Use dark theme</Text>
            </View>
            <Switch
              value={isDarkModeEnabled}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.ui.border, true: colors.primary }}
              thumbColor={colors.text.inverse}
            />
          </View>

        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View 
          style={[
            styles.signOutSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
            <Text style={[styles.signOutText, { color: colors.status.error }]}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              Member since {profile.joinDate} • Community Connect v1.0
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 14,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: -20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  skillsCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptySkills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  emptySkillsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 14,
  },
  signOutSection: {
    marginHorizontal: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProfileScreen;