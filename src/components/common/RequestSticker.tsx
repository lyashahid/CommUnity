import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface RequestStickerProps {
  visible: boolean;
  onComplete: () => void;
}

const RequestSticker: React.FC<RequestStickerProps> = ({ visible, onComplete }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [slideAnim] = useState(new Animated.Value(-50));

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideSticker();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideSticker = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.stickerContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <View style={styles.sticker}>
        <View style={styles.stickerHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={32} color={colors.text.inverse} />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  transform: [{ rotate: scaleAnim.interpolate({
                    inputRange: [0.5, 1],
                    outputRange: ['0deg', '360deg']
                  }) }]
                }
              ]}
            >
              <Ionicons name="sparkles" size={16} color={colors.text.inverse} />
            </Animated.View>
          </View>
        </View>
        
        <View style={styles.stickerBody}>
          <Text style={styles.stickerTitle}>Request Sent!</Text>
          <Text style={styles.stickerSubtitle}>Your official help request is on its way</Text>
          
          <View style={styles.stickerFooter}>
            <View style={styles.dotsContainer}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stickerContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  sticker: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    minWidth: 280,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  stickerHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    top: -10,
    right: -15,
  },
  stickerBody: {
    alignItems: 'center',
  },
  stickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: 4,
  },
  stickerSubtitle: {
    fontSize: 14,
    color: colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  stickerFooter: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.inverse,
    opacity: 0.6,
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
});

export default RequestSticker;
