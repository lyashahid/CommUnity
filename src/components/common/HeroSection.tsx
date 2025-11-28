import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';
import { StatsCard } from './StatsCard';

interface HeroSectionProps {
  stats: {
    nearby: number;
    total: number;
    helped: number;
  };
  onRequestHelp: () => void;
  onViewMap: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  stats, 
  onRequestHelp, 
  onViewMap 
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors.gradient.primary as [string, string]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: 'rgba(255,255,255,0.8)' }]}>Welcome back!</Text>
            <Text style={[styles.title, { color: colors.text.inverse }]}>Ready to help your community?</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
        
        <StatsCard stats={stats} />

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={onRequestHelp}
          >
            <Ionicons name="add" size={20} color={colors.text.inverse} />
            <Text style={[styles.primaryActionText, { color: colors.text.inverse }]}>Request Help</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.secondaryAction, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={onViewMap}>
            <Ionicons name="map-outline" size={20} color={colors.text.inverse} />
            <Text style={[styles.secondaryActionText, { color: colors.text.inverse }]}>View Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greeting: {
    ...typography.body,
    marginBottom: 4,
  },
  title: {
    ...typography.h2,
    lineHeight: 30,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionText: {
    ...typography.body,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  secondaryActionText: {
    ...typography.body,
    fontWeight: '500',
  },
});
