import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRoute, RouteProp } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { setOnboardingComplete } from '@/utils/onboarding';

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

type OnboardingFlowRouteProp = RouteProp<{ OnboardingFlow: OnboardingScreenProps }, 'OnboardingFlow'>;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const route = useRoute<OnboardingFlowRouteProp>();
  const { onComplete } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  console.log('OnboardingFlowScreen mounted with onComplete:', !!onComplete);

  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    console.log('Get Started button pressed - completing onboarding...');
    try {
      await setOnboardingComplete();
      console.log('Onboarding status saved to AsyncStorage');
      
      if (onComplete) {
        console.log('Calling onComplete callback...');
        onComplete();
      } else {
        console.log('No onComplete callback provided');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
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
      {currentIndex < onboardingData.length - 1 && (
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
      />

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {renderDots()}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});