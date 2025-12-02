// src/navigation/AppNavigator.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, onSnapshot, db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import BeautifulLoadingScreen from '@/components/common/BeautifulLoadingScreen';
import { hasSeenOnboarding } from '@/utils/onboarding';

// Screens
import FeedScreen from '../screens/Home/FeedScreen';
import MapScreen from '../screens/Home/MapScreen';
import CreateScreen from '../screens/Help/CreateScreen';
import MessagesScreen from '../screens/Chat/MessagesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import OnboardingFlowScreen from '../screens/Auth/OnboardingFlowScreen';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import RequestDetailScreen from '../screens/Help/RequestDetailScreen';
import MyRequestsScreen from '../screens/Profile/MyRequestsScreen';
import MyOffersScreen from '../screens/Profile/MyOffersScreen';
import ReviewsScreen from '../screens/Profile/ReviewsScreen';

// ---------------------
// Navigation Param Types
// ---------------------
type UserProfile = {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  location?: string | { longitude: number; latitude: number; address: string };
  joinDate: string;
  level: number;
  rating: number;
  reviewCount: number;
  completedRequests: number;
  helpedPeople: number;
  responseRate: number;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Auth: {
    screen: keyof AuthStackParamList;
  };
  OnboardingFlow: {
    onComplete?: () => void;
  };
  Onboarding: undefined;
  Loading: undefined;

  App: {
    screen?: keyof TabParamList;
    params?: any;
  } | undefined;

  Chat: {
    chatId?: string;
    requestId?: string;
    otherUserId?: string;
    requestTitle?: string;
    otherUserName?: string;
  };

  EditProfile: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    bio: string | null;
  };

  RequestDetail: {
    requestId: string;
  };

  MyRequests: undefined;
  MyOffers: undefined;
  Reviews: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Map: undefined;
  Create: undefined;
  Messages: undefined;
  Profile: {
    updated?: boolean;
    profile?: UserProfile;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ---------------------
// Custom Plus Button Component
// ---------------------
const PlusButton = ({ focused, color, size, colors }: { focused: boolean; color: string; size: number; colors: any }) => {
  return (
    <View style={styles.plusButtonContainer}>
      <View style={[
        styles.plusButton,
        {
          backgroundColor: focused ? colors.primaryLight : colors.primary,
          shadowColor: colors.primary,
          borderColor: colors.navigation.background,
        }
      ]}>
        <Ionicons 
          name="add" 
          size={28} 
          color={colors.text.inverse} 
        />
      </View>
    </View>
  );
};

// ---------------------
// Auth Stack
// ---------------------
function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }} id={undefined}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// ---------------------
// Bottom Tabs
// ---------------------
function TabNavigator() {
  const { colors } = useTheme();
  
  // Safety check - if colors is not available, return null
  if (!colors) {
    return null;
  }
  
  const getTabIcon = (name: string, focused: boolean, color: string, size: number) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'help';

    switch (name) {
      case 'Feed':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Map':
        iconName = focused ? 'map' : 'map-outline';
        break;
      case 'Messages':
        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
    }
    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Special handling for Create tab
          if (route.name === 'Create') {
            return <PlusButton focused={focused} color={color} size={size} colors={colors} />;
          }
          return getTabIcon(route.name, focused, color, size);
        },
        tabBarActiveTintColor: colors.navigation.active,
        tabBarInactiveTintColor: colors.navigation.inactive,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navigation.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 70,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          position: 'relative',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarLabel: '',
          tabBarIconStyle: {
            marginTop: Platform.OS === 'ios' ? -10 : -15,
          },
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// ---------------------
// Loading Screen
// ---------------------
function LoadingScreen() {
  const { colors } = useTheme();
  
  // Safety check - if colors is not available, use fallback
  if (!colors) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#F8F9FF' }]}>
        <ActivityIndicator size="large" color="#5FA8D3" />
      </View>
    );
  }
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background.secondary }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// ---------------------
// MAIN NAVIGATOR
// ---------------------
const AppNavigator = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Real-time listener for onboarding status changes
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user, setting onboarded to false');
      setIsOnboarded(false);
      setIsCheckingOnboarding(false);
      return;
    }

    console.log('Setting up real-time listener for user:', user.uid);
    setIsCheckingOnboarding(true);

    // First, check AsyncStorage immediately
    const checkInitialStatus = async () => {
      try {
        const hasSeenFlow = await hasSeenOnboarding();
        console.log('Initial AsyncStorage check:', hasSeenFlow);
        
        if (hasSeenFlow === true) {
          console.log('User has completed onboarding (AsyncStorage)');
          setIsOnboarded(true);
          setIsCheckingOnboarding(false);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error checking AsyncStorage:', err);
        return false;
      }
    };

    // Set up real-time Firestore listener
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      async (docSnapshot) => {
        console.log('Firestore snapshot received');
        
        if (!docSnapshot.exists()) {
          console.log('User document does not exist');
          // Check AsyncStorage as fallback
          const hasSeenFlow = await hasSeenOnboarding();
          setIsOnboarded(hasSeenFlow === true);
          setIsCheckingOnboarding(false);
          return;
        }

        const userData = docSnapshot.data();
        const firestoreOnboarded = userData?.isOnboarded === true;
        console.log('Firestore isOnboarded:', firestoreOnboarded);

        // Also check AsyncStorage
        const asyncStorageOnboarded = await hasSeenOnboarding();
        console.log('AsyncStorage onboarded:', asyncStorageOnboarded);

        // User is onboarded if EITHER source says true
        const finalOnboarded = firestoreOnboarded || asyncStorageOnboarded === true;
        console.log('Final onboarding status:', finalOnboarded);
        
        setIsOnboarded(finalOnboarded);
        setIsCheckingOnboarding(false);
      },
      (error) => {
        console.error('Error listening to user document:', error);
        // On error, check AsyncStorage
        checkInitialStatus().then(() => {
          setIsCheckingOnboarding(false);
        });
      }
    );

    // Check initial status
    checkInitialStatus();

    return () => {
      console.log('Cleaning up Firestore listener');
      unsubscribe();
    };
  }, [user?.uid]);

  // Show loading screen while checking auth OR onboarding status
  if (authLoading || isCheckingOnboarding) {
    console.log('Showing loading screen - authLoading:', authLoading, 'isCheckingOnboarding:', isCheckingOnboarding);
    return <LoadingScreen />;
  }

  console.log('Navigation Decision - User:', !!user, 'Onboarded:', isOnboarded);

  return (
    <NavigationContainer>
      {!user ? (
        // Auth Stack (when not logged in)
        <Stack.Navigator screenOptions={{ headerShown: false }} id="auth-stack">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthStackScreen} />
        </Stack.Navigator>
      ) : !isOnboarded ? (
        // Onboarding Stack (when logged in but not onboarded)
        <Stack.Navigator screenOptions={{ headerShown: false }} id="onboarding-stack">
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen 
            name="OnboardingFlow" 
            component={OnboardingFlowScreen}
          />
        </Stack.Navigator>
      ) : (
        // Main App Stack (when logged in and onboarded)
        <Stack.Navigator screenOptions={{ headerShown: false }} id="main-stack">
          <Stack.Screen name="App" component={TabNavigator} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
          <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
          <Stack.Screen name="MyOffers" component={MyOffersScreen} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButtonContainer: {
    top: Platform.OS === 'ios' ? 14 : 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
  },
});

export default AppNavigator;