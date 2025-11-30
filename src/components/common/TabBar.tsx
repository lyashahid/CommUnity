import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';

interface TabBarProps {
  activeTab: 'all' | 'nearby';
  onTabChange: (tab: 'all' | 'nearby') => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const { colors } = useTheme();
  
  // Safety check - if colors is not available, return null
  if (!colors) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={[styles.tabBackground, { backgroundColor: colors.surface.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && [styles.activeTab, { backgroundColor: colors.primary, shadowColor: colors.primary }]]}
          onPress={() => onTabChange('all')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={activeTab === 'all' ? colors.text.inverse : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText, { color: activeTab === 'all' ? colors.text.inverse : colors.text.secondary }]}>
            All Requests
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && [styles.activeTab, { backgroundColor: colors.primary, shadowColor: colors.primary }]]}
          onPress={() => onTabChange('nearby')}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={activeTab === 'nearby' ? colors.text.inverse : colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText, { color: activeTab === 'nearby' ? colors.text.inverse : colors.text.secondary }]}>
            Nearby
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabBackground: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 13,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...typography.body,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
});
