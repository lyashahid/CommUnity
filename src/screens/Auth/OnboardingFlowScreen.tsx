// Import React hooks and components
import React, { useState, useRef, useEffect } from 'react';
// Import React Native components
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
  Alert,
} from 'react-native';
// Import custom hooks and navigation
import { useTheme } from '@/context/ThemeContext';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
// Import third-party libraries
import LottieView from 'lottie-react-native';
// Import utility functions and services
import { setOnboardingComplete } from '@/utils/onboarding';
import { doc, setDoc, db, auth } from '@/services/firebase';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Interface defining the structure of each onboarding slide
interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  animation: any; // Lottie animation file
}

// Onboarding data array containing all slides with their content and animations
const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Welcome to CommUnity',
    subtitle: 'Connect with the people around you. Share updates, get help, and stay active in your neighbourhood — all in one place.',
    animation: require('@/assets/animations/onboard1.json'),
  },
  {
    id: '2',
    title: 'Request or Offer Help',
    subtitle: 'Post what you need, offer support to others, or manage your tasks easily. Your community responds instantly.',
    animation: require('@/assets/animations/onboard2.json'),
  },
  {
    id: '3',
    title: 'Stay Updated in Real Time',
    subtitle: 'See nearby posts, alerts, and activities around you. Everything important — right where you are.',
    animation: require('@/assets/animations/onboard3.json'),
  },
];

// Props interface for optional completion callback
interface OnboardingScreenProps {
  onComplete?: () => void;
}

// Type definition for route parameters
type OnboardingFlowRouteProp = RouteProp<RootStackParamList, 'OnboardingFlow'>;

// Main onboarding screen component
export default function OnboardingScreen() {
  // Get theme colors from context
  const { colors } = useTheme();
  // Get route parameters and navigation
  const route = useRoute<OnboardingFlowRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // Extract completion callback from route params
  const { onComplete } = route.params || {};
  
  // State management
  const [currentIndex, setCurrentIndex] = useState(0); // Current slide index
  const flatListRef = useRef<FlatList>(null); // Reference to FlatList for navigation
  const [isCompleting, setIsCompleting] = useState(false); // Prevent multiple completion attempts
  const completionAttempted = useRef(false); // Extra guard against duplicate calls

  console.log('OnboardingFlowScreen mounted');

  // Callback function to handle when items become visible in the FlatList
  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0); // Update current index based on visible item
    }
  }).current;

  // Configuration for determining when an item is considered "viewable"
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item is viewable when 50% visible
  }).current;

  // Handle Next button press - navigate to next slide or complete onboarding
  const handleNext = () => {
    if (isCompleting) return; // Don't allow navigation while completing
    
    if (currentIndex < onboardingData.length - 1) {
      // Navigate to next slide
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Last slide - complete onboarding
      handleCompleteOnboarding();
    }
  };

  // Handle Skip button press - jump directly to completion
  const handleSkip = () => {
    if (isCompleting) return;
    handleCompleteOnboarding();
  };

  // Complete the onboarding process and update user status
  const handleCompleteOnboarding = async () => {
    // Prevent multiple completions with both state and ref
    if (isCompleting || completionAttempted.current) {
      console.log('Already completing onboarding, ignoring duplicate call');
      return;
    }
    
    completionAttempted.current = true;
    setIsCompleting(true);
    console.log('Get Started button pressed - completing onboarding...');
    
    try {
      // Step 1: Save onboarding status to AsyncStorage
      await setOnboardingComplete();
      console.log('✓ Onboarding status saved to AsyncStorage');
      
      // Step 2: Get current authenticated user
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No user session found. Please log in again.');
        setIsCompleting(false);
        completionAttempted.current = false;
        return;
      }
      
      // Step 3: Update user document in Firestore with onboarding completion
      await setDoc(
        doc(db, 'users', currentUser.uid), 
        { isOnboarded: true }, 
        { merge: true } // Merge with existing document
      );
      console.log('✓ Updated Firestore with onboarding completion');
      
      // Step 4: Call the onComplete callback if provided
      if (onComplete) {
        console.log('✓ Calling onComplete callback');
        onComplete();
      }
      
      // Step 5: Log successful completion - AppNavigator will handle navigation
      console.log('✓ Onboarding completed successfully');
      console.log('⟳ AppNavigator should now detect completion and navigate to Feed');
      
      // The AppNavigator will automatically detect the change and navigate to the main app
      // We don't need to manually navigate - just let the auth state listener handle it
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to complete onboarding. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsCompleting(false);
              completionAttempted.current = false;
            }
          }
        ]
      );
    }
    // Don't reset isCompleting here - let the AppNavigator handle the navigation
  };

  // Render individual onboarding slide with animation and text
  const renderItem = ({ item, index }: { item: OnboardingItem; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {/* Lottie animation container */}
        <View style={styles.animationContainer}>
          <LottieView
            source={item.animation}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
        
        {/* Text content container */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    );
  };

  // Render pagination dots showing current slide position
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { 
                backgroundColor: index === currentIndex ? colors.primary : colors.border,
                width: index === currentIndex ? 24 : 8, // Active dot is wider
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Main component render
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Skip Button - Only show on non-last slides and when not completing */}
      {currentIndex < onboardingData.length - 1 && !isCompleting && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Horizontal FlatList for onboarding slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal // Enable horizontal scrolling
        pagingEnabled // Enable snap-to-page behavior
        showsHorizontalScrollIndicator={false} // Hide scroll indicator
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false} // Disable bounce at ends
        scrollEnabled={!isCompleting} // Disable scrolling during completion
      />

      {/* Bottom section with dots and action button */}
      <View style={styles.bottomContainer}>
        {renderDots()}

        {/* Next/Get Started button */}
        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor: colors.primary },
            isCompleting && styles.buttonDisabled // Apply disabled style when completing
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={isCompleting} // Disable button during completion
        >
          <Text style={styles.buttonText}>
            {isCompleting 
              ? 'Completing...' 
              : currentIndex === onboardingData.length - 1 
                ? 'Get Started' 
                : 'Next'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles for the onboarding screen component
const styles = StyleSheet.create({
  // Main container styling
  container: {
    flex: 1,
  },
  // Skip button positioning and styling
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10, // Ensure it's above other elements
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Individual slide container
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  // Animation container with responsive sizing
  animationContainer: {
    width: SCREEN_WIDTH * 0.8, // 80% of screen width
    height: SCREEN_HEIGHT * 0.45, // 45% of screen height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  // Lottie animation styling
  animation: {
    width: '100%',
    height: '100%',
  },
  // Text content container
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Slide title styling
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5, // Slight letter spacing for better readability
  },
  // Slide subtitle styling
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24, // Comfortable line height for readability
    paddingHorizontal: 10,
  },
  // Bottom section container
  bottomContainer: {
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  // Pagination dots container
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 8,
  },
  // Individual dot styling
  dot: {
    height: 8,
    borderRadius: 4, // Make dots rounded
    marginHorizontal: 4,
  },
  // Main action button styling
  button: {
    height: 56,
    borderRadius: 28, // Fully rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5, // Android shadow
  },
  // Disabled button state
  buttonDisabled: {
    opacity: 0.6,
  },
  // Button text styling
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});