import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';

interface StatsCardProps {
  stats: {
    nearby: number;
    total: number;
    helped: number;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.text.inverse }]}>{stats.nearby}</Text>
        <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Nearby</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.text.inverse }]}>{stats.total}</Text>
        <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.text.inverse }]}>{stats.helped}</Text>
        <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Helped</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 18,
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    fontWeight: '500',
  },
});
