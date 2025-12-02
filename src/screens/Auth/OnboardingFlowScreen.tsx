import React, { useState, useRef, useEffect } from 'react';
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
import { useTheme } from '@/context/ThemeContext';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import LottieView from 'lottie-react-native';
import { setOnboardingComplete } from '@/utils/onboarding';
import { doc, setDoc, db, auth } from '@/services/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  animation: any;
}

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

interface OnboardingScreenProps {
  onComplete?: () => void;
}

type OnboardingFlowRouteProp = RouteProp<RootStackParamList, 'OnboardingFlow'>;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const route = useRoute<OnboardingFlowRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { onComplete } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const completionAttempted = useRef(false); // Extra guard

  console.log('OnboardingFlowScreen mounted');

  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (isCompleting) return; // Don't allow navigation while completing
    
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleSkip = () => {
    if (isCompleting) return;
    handleCompleteOnboarding();
  };

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
      // Step 1: Save to AsyncStorage
      await setOnboardingComplete();
      console.log('✓ Onboarding status saved to AsyncStorage');
      
      // Step 2: Get current user
      const currentUser = auth.currentUser;
      
      if (!currentUser?.uid) {
        console.error('No authenticated user found');
        Alert.alert('Error', 'No user session found. Please log in again.');
        setIsCompleting(false);
        completionAttempted.current = false;
        return;
      }
      
      // Step 3: Update Firestore
      await setDoc(
        doc(db, 'users', currentUser.uid), 
        { isOnboarded: true }, 
        { merge: true }
      );
      console.log('✓ Updated Firestore with onboarding completion');
      
      // Step 4: Call the onComplete callback if provided
      if (onComplete) {
        console.log('✓ Calling onComplete callback');
        onComplete();
      }
      
      // Step 5: Force navigation reset to trigger AppNavigator re-check
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

  const renderItem = ({ item, index }: { item: OnboardingItem; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.animationContainer}>
          <LottieView
            source={item.animation}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
        
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
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && !isCompleting && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* FlatList */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        scrollEnabled={!isCompleting}
      />

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {renderDots()}

        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor: colors.primary },
            isCompleting && styles.buttonDisabled
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={isCompleting}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  animationContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomContainer: {
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});