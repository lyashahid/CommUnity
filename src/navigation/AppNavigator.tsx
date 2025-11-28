// src/navigation/AppNavigator.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import BeautifulLoadingScreen from '@/components/common/BeautifulLoadingScreen';

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
export type RootStackParamList = {
  Welcome: undefined;
  Auth: {
    screen: 'Login' | 'Signup';
  };
  Onboarding: undefined;
  OnboardingFlow: undefined;
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
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
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
    <Stack.Navigator screenOptions={{ headerShown: false }} id={undefined}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// ---------------------
// Bottom Tabs
// ---------------------
function TabNavigator() {
  const { colors } = useTheme();
  
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
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  const checkOnboardingStatus = async (uid: string): Promise<boolean> => {
    try {
      console.log('Checking onboarding status for user:', uid);
      const snap = await getDoc(doc(db, 'users', uid));
      
      if (!snap.exists()) {
        console.log('User document does not exist, user needs onboarding');
        return false;
      }

      const data = snap.data();
      console.log('User data found:', data);
      
      // Check if user has completed onboarding
      const hasOnboarded = data?.isOnboarded === true;
      console.log('Has onboarded:', hasOnboarded);
      
      return hasOnboarded;
    } catch (err: any) {
      console.error('Onboarding check error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide more specific error handling
      if (err.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules');
        // Return false to send to onboarding, which will create the user document
        return false;
      } else if (err.code === 'unavailable') {
        console.error('Firestore unavailable - check network connection');
        return false;
      } else {
        console.error('Unknown error checking onboarding status');
        return false;
      }
    }
  };

  // Function to manually refresh onboarding status
  const refreshOnboardingStatus = useCallback(async () => {
    if (user?.uid) {
      const onboarded = await checkOnboardingStatus(user.uid);
      setIsOnboarded(onboarded);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const runCheck = async () => {
      console.log('Running onboarding check. User:', user?.uid);
      
      if (!user?.uid) {
        if (active) {
          setIsOnboarded(false);
          setIsCheckingOnboarding(false);
        }
        return;
      }

      setIsCheckingOnboarding(true);
      const onboarded = await checkOnboardingStatus(user.uid);

      if (active) {
        setIsOnboarded(onboarded);
        setIsCheckingOnboarding(false);
      }
    };

    runCheck();
    
    // Set up periodic check for onboarding status
    let intervalId: NodeJS.Timeout;
    if (user?.uid && !isOnboarded) {
      intervalId = setInterval(runCheck, 2000); // Check every 2 seconds
    }
    
    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, isOnboarded]);

  // Show loading screen while checking auth OR onboarding status
  if (authLoading || isCheckingOnboarding) {
    return <LoadingScreen />;
  }

  // Determine initial route - now we can safely determine the route
  let initialRoute: keyof RootStackParamList = 'Welcome';
  
  if (user) {
    if (isOnboarded === false) {
      initialRoute = 'Onboarding';
    } else {
      // isOnboarded === true
      initialRoute = 'App';
    }
  }

  console.log('Initial route:', initialRoute, 'isOnboarded:', isOnboarded);

  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {!user ? (
          // Auth Stack (when not logged in)
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthStackScreen} />
          </>
        ) : !isOnboarded ? (
          // Onboarding Stack (when logged in but not onboarded)
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
          </>
        ) : (
          // Main App Stack (when logged in and onboarded)
          <>
            <Stack.Screen name="App" component={TabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
            <Stack.Screen name="MyOffers" component={MyOffersScreen} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} />
          </>
        )}
      </Stack.Navigator>
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