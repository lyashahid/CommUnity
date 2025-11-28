import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface UrgencyBadgeProps {
  urgency: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, size = 'medium' }) => {
  const getUrgencyColor = (urgency: string) => {
    return colors.urgency[urgency as keyof typeof colors.urgency] || colors.urgency.medium;
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 8,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 10,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12,
    },
  };

  const currentSize = sizeStyles[size];
  const urgencyColor = getUrgencyColor(urgency);

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: urgencyColor,
        paddingHorizontal: currentSize.paddingHorizontal,
        paddingVertical: currentSize.paddingVertical,
      }
    ]}>
      <Text style={[
        styles.text,
        {
          fontSize: currentSize.fontSize,
        }
      ]}>
        {urgency.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
