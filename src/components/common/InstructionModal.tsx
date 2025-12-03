import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';

const { width: screenWidth } = Dimensions.get('window');

interface InstructionSlide {
  id: number;
  title: string;
  description: string;
  icon: string;
  tip?: string;
}

const instructionSlides: InstructionSlide[] = [
  {
    id: 1,
    title: 'Welcome to CommUnity!',
    description: 'A simple way for neighbors to request and offer help within the community.',
    icon: 'home-outline',
    tip: 'Swipe to learn how the app works.',
  },
  {
    id: 2,
    title: 'Explore Help Requests',
    description: 'Scroll through your feed to discover people nearby who need assistance.',
    icon: 'list-outline',
    tip: 'Tap any request card to see full details.',
  },
  {
    id: 3,
    title: 'Offer Help Easily',
    description: 'Swipe right to offer help or swipe left if you can’t assist right now.',
    icon: 'swap-horizontal-outline',
    tip: 'Found a request you like? Swipe right!',
  },
  {
    id: 4,
    title: 'Create Your Own Request',
    description: 'Need help? Post a request and let your community support you.',
    icon: 'add-circle-outline',
    tip: 'Be clear and specific to get better responses.',
  },
  {
    id: 5,
    title: 'Nearby Requests',
    description: 'Switch to the “Nearby” tab to view help requests around your location.',
    icon: 'location-outline',
    tip: 'Perfect for urgent or location-based assistance.',
  },
  {
    id: 6,
    title: 'Chat & Coordinate',
    description: 'Once connected, use the chat to discuss details and arrange how help will be provided.',
    icon: 'chatbubble-outline',
    tip: 'Keep communication friendly and clear.',
  },
  {
    id: 7,
    title: 'Send Official Requests',
    description: 'In chat, you can send an official help confirmation to start the helping process.',
    icon: 'shield-checkmark-outline',
    tip: 'Use the envelope icon for official requests.',
  },
  {
    id: 8,
    title: 'Help Confirmed!',
    description: 'Once accepted, your help request becomes official and you can coordinate smoothly.',
    icon: 'checkmark-circle-outline',
    tip: 'You’ll get a confirmation once both sides agree.',
  },
];


interface InstructionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InstructionModal: React.FC<InstructionModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Reset slide and opacity when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentSlide(0);
      fadeAnim.setValue(1);
    }
  }, [visible, fadeAnim]);

  const handleNext = () => {
    if (currentSlide < instructionSlides.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleDotPress = (index: number) => {
    if (index !== currentSlide) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(index);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const slide = instructionSlides[currentSlide];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
            <Text style={[styles.progressText, { color: colors.text.secondary }]}>
              {currentSlide + 1} / {instructionSlides.length}
            </Text>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={slide.icon as any} size={64} color={colors.primary} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {slide.title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.text.secondary }]}>
                {slide.description}
              </Text>

              {/* Tip */}
              {slide.tip && (
                <View style={[styles.tipContainer, { backgroundColor: colors.surface.card }]}>
                  <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.primary }]}>
                    {slide.tip}
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={[
                styles.navButton,
                { 
                  backgroundColor: colors.surface.card,
                  opacity: currentSlide === 0 ? 0.5 : 1
                }
              ]}
              disabled={currentSlide === 0}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
              <Text style={[styles.navButtonText, { color: colors.text.primary }]}>
                Previous
              </Text>
            </TouchableOpacity>

            {/* Dots */}
            <View style={styles.dotsContainer}>
              {instructionSlides.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleDotPress(index)}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === currentSlide 
                        ? colors.primary 
                        : colors.text.tertiary
                    }
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.navButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: currentSlide === instructionSlides.length - 1 ? 0.5 : 1
                }
              ]}
              disabled={currentSlide === instructionSlides.length - 1}
            >
              <Text style={[styles.navButtonText, { color: colors.text.inverse }]}>
                Next
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>

          {/* Skip/Done button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.skipButton, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.skipButtonText, { color: colors.text.secondary }]}>
              {currentSlide === instructionSlides.length - 1 ? "Got it!" : "Skip tutorial"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.9,
    height: '80%',
    maxHeight: 540,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 4,
  },
  progressText: {
    ...typography.caption,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...typography.h3,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tipText: {
    ...typography.caption,
    fontWeight: '500',
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  navButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  skipButtonText: {
    ...typography.body,
    fontWeight: '500',
  },
});
