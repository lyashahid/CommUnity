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
  Profile: undefined;
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
      <View style={[styles.loadingContainer, { backgroundColor: '#F8F9FA' }]}>
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
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  const checkOnboardingStatus = async (): Promise<boolean> => {
    try {
      console.log('Checking onboarding status...');
      
      if (!user?.uid) {
        console.log('No user found, returning false');
        return false;
      }

      // Check if user has completed profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('User document does not exist, needs onboarding');
        return false;
      }

      const userData = userSnap.data();
      const hasOnboarded = userData?.isOnboarded === true;
      console.log('User has completed onboarding:', hasOnboarded);
      
      return hasOnboarded;
    } catch (err: any) {
      console.error('Onboarding check error:', err);
      return false;
    }
  };

  // Function to manually refresh onboarding status
  const refreshOnboardingStatus = useCallback(async () => {
    if (user?.uid) {
      const onboarded = await checkOnboardingStatus();
      setIsOnboarded(onboarded);
    }
  }, [user?.uid]);

  useEffect(() => {
    let isMounted = true;
    
    const runCheck = async () => {
      console.log('Running onboarding check. User:', user?.uid);
      
      if (!user?.uid) {
        if (isMounted) {
          setIsOnboarded(false);
          setIsCheckingOnboarding(false);
        }
        return;
      }

      setIsCheckingOnboarding(true);
      
      try {
        const hasOnboarded = await checkOnboardingStatus();
        if (isMounted) {
          setIsOnboarded(hasOnboarded);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        if (isMounted) {
          setIsOnboarded(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingOnboarding(false);
        }
      }
    };

    runCheck();
    
    return () => {
      isMounted = false;
    };
  }, [user?.uid]); // Only re-run when user UID changes, not the entire user object

  // Show loading screen while checking auth OR onboarding status
  if (authLoading || isCheckingOnboarding) {
    return <LoadingScreen />;
  }

  console.log('Navigation state - User:', !!user, 'Onboarded:', isOnboarded);

  return (
    <NavigationContainer>
      {!user ? (
        // Auth Stack (when not logged in)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Auth" component={AuthStackScreen} />
          <Stack.Screen 
            name="OnboardingFlow" 
            component={OnboardingFlowScreen} 
            initialParams={{ 
              onComplete: () => {
                // After onboarding flow, check if user needs to complete profile
                checkOnboardingStatus().then(hasOnboarded => {
                  setIsOnboarded(hasOnboarded);
                });
              }
            }}
          />
        </Stack.Navigator>
      ) : !isOnboarded ? (
        // Onboarding Stack (when logged in but not onboarded - needs data collection)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen 
            name="OnboardingFlow" 
            component={OnboardingFlowScreen} 
            initialParams={{ 
              onComplete: () => {
                // After instruction slides, go to main app
                setIsOnboarded(true);
              }
            }}
          />
        </Stack.Navigator>
      ) : (
        // Main App Stack (when logged in and onboarded)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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