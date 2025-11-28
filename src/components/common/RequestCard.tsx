import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';
import { RequestCardItem } from '../../types/helpRequest';

const { width } = Dimensions.get('window');

interface HelpItem {
  id: string;
  title: string;
  category: string;
  distanceKm: number;
  createdAt?: any;
  ownerName?: string;
  urgency?: 'low' | 'medium' | 'high';
  description?: string;
  type?: 'feed_request' | 'official_chat_request';
  isOfficialRequest?: boolean;
}

interface RequestCardProps {
  item: RequestCardItem;
  onPress: (item: RequestCardItem) => void;
  onSwipeLeft?: (item: RequestCardItem) => void;
  onSwipeRight?: (item: RequestCardItem) => void;
  onSwipeStart?: (item: RequestCardItem) => void;
  onSwipeComplete?: (item: RequestCardItem) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ 
  item, 
  onPress, 
  onSwipeLeft,
  onSwipeRight,
  onSwipeStart,
  onSwipeComplete
}) => {
  const { colors } = useTheme();
  const pan = React.useRef(new Animated.ValueXY()).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  const backgroundOpacity = React.useRef(new Animated.Value(0)).current;
  const [isSwipingAway, setIsSwipingAway] = React.useState(false);

  const handleRelease = async (gesture: any) => {
    const { dx, vx } = gesture;
    
    // Perfect swipe threshold - not too sensitive, not too hard
    if (Math.abs(dx) > 80 || Math.abs(vx) > 0.5) {
      const canHelp = dx > 0;
      
      setIsSwipingAway(true);
      
      // Call onSwipeStart to remove card from list immediately
      if (onSwipeStart) {
        onSwipeStart(item);
      }
      
      // Execute the swipe action
      if (canHelp && onSwipeRight) {
        await onSwipeRight(item);
      } else if (!canHelp && onSwipeLeft) {
        await onSwipeLeft(item);
      }
      
      // Smooth swipe away animation
      const finalX = dx > 0 ? width + 100 : -width - 100;
      
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(pan, {
          toValue: { x: finalX, y: 0 },
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        })
      ]).start(() => {
        // Call complete when animation finishes
        if (onSwipeComplete) {
          onSwipeComplete(item);
        }
      });
    } else {
      // Smooth snap back to center
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSwipingAway,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: Animated.event([null, { 
        dx: pan.x,
        dy: pan.y
      }], {
        useNativeDriver: false,
      }),
      onPanResponderGrant: () => {
        // Show background and scale up on touch
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1.02,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
      },
      onPanResponderRelease: (_evt, gesture) => handleRelease(gesture),
      onPanResponderTerminate: (_evt, gesture) => handleRelease(gesture),
    })
  ).current;

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

  return (
    <View style={styles.swipeContainer}>
      {/* Swipe Background Indicators */}
      <Animated.View style={[styles.swipeBackground, { opacity: backgroundOpacity }]}>
        <View style={[styles.swipeIndicator, styles.canHelpIndicator]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <Text style={[styles.swipeIndicatorText, { color: colors.success }]}>I Can Help</Text>
        </View>
        <View style={[styles.swipeIndicator, styles.skipIndicator]}>
          <Ionicons name="close-circle" size={28} color={colors.error} />
          <Text style={[styles.swipeIndicatorText, { color: colors.error }]}>Skip</Text>
        </View>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.requestCard,
          {
            backgroundColor: colors.surface.card,
            borderColor: colors.border,
            transform: [
              ...pan.getTranslateTransform(),
              { scale }
            ],
            opacity: opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          onPress={() => onPress(item)}
          activeOpacity={0.9}
          style={styles.cardContent}
          disabled={isSwipingAway}
        >
          {/* Clean header with just distance and time */}
          <View style={styles.cardHeader}>
            <View style={styles.locationTimeRow}>
              <View style={styles.location}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={[styles.distance, { color: colors.primary }]}>
                  {item.distanceKm > 0 ? `${item.distanceKm} km` : 'Nearby'}
                </Text>
              </View>
              <Text style={[styles.timeAgo, { color: colors.text.secondary }]}>{getTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
          
          {/* Request Content */}
          <Text style={[styles.requestTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Official Request Badge */}
          {item.isOfficialRequest && (
            <View style={[styles.officialBadge, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={[styles.officialBadgeText, { color: colors.success }]}>Official Request</Text>
            </View>
          )}
          
          {item.description && (
            <Text style={[styles.requestDescription, { color: colors.text.secondary }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          
          {/* Simple footer with just requester info */}
          <View style={styles.cardFooter}>
            {item.ownerName && (
              <View style={styles.requesterInfo}>
                <Ionicons name="person-circle" size={12} color={colors.text.secondary} />
                <Text style={[styles.requesterText, { color: colors.text.secondary }]}>{item.ownerName}</Text>
              </View>
            )}
            <View style={styles.tapHint}>
              <Ionicons name="information-circle-outline" size={14} color={colors.text.secondary} />
              <Text style={[styles.hintText, { color: colors.text.secondary }]}>Tap for details</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    height: 180,
    position: 'relative',
  },
  swipeBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
  },
  swipeIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  canHelpIndicator: {
    backgroundColor: 'rgba(154, 166, 87, 0.08)',
  },
  skipIndicator: {
    backgroundColor: 'rgba(244, 106, 95, 0.08)',
  },
  swipeIndicatorText: {
    ...typography.body,
    fontWeight: '600',
  },
  requestCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 0.5,
    height: 180,
  },
  cardContent: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 132,
  },
  cardHeader: {
    marginBottom: 16,
  },
  locationTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    ...typography.body,
    fontWeight: '600',
  },
  timeAgo: {
    ...typography.caption,
    fontWeight: '500',
  },
  requestTitle: {
    ...typography.h3,
    marginBottom: 10,
    flexShrink: 1,
    minHeight: 28,
    lineHeight: 24,
  },
  requestDescription: {
    ...typography.caption,
    marginBottom: 14,
    fontStyle: 'italic',
    flexShrink: 1,
    minHeight: 16,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    ...typography.caption,
    fontWeight: '500',
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requesterText: {
    ...typography.caption,
    fontWeight: '500',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  officialBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
});