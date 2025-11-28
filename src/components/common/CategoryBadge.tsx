import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface CategoryBadgeProps {
  category: string;
  size?: 'small' | 'medium' | 'large';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'medium' }) => {
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      'Errands': 'cart',
      'Tutoring': 'school',
      'Tech Support': 'laptop',
      'Pet Care': 'paw',
      'Home Repair': 'hammer',
      'Transportation': 'car',
      'Gardening': 'leaf',
      'Cleaning': 'sparkles',
      'Moving Help': 'cube',
      'General': 'help-circle'
    };
    return icons[category] || 'help-circle';
  };

  const getCategoryColor = (category: string) => {
    return colors.category[category as keyof typeof colors.category] || colors.category.General;
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      iconSize: 12,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      iconSize: 16,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      iconSize: 20,
      fontSize: 14,
    },
  };

  const currentSize = sizeStyles[size];
  const categoryColor = getCategoryColor(category);

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: categoryColor + '15',
        paddingHorizontal: currentSize.paddingHorizontal,
        paddingVertical: currentSize.paddingVertical,
      }
    ]}>
      <Ionicons 
        name={getCategoryIcon(category)} 
        size={currentSize.iconSize} 
        color={categoryColor} 
      />
      <Text style={[
        styles.text,
        {
          color: categoryColor,
          fontSize: currentSize.fontSize,
        }
      ]}>
        {category}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
