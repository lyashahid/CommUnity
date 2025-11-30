import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface HeaderEnvelopeButtonProps {
  onPress: () => void;
  hasActiveRequest?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
  visible?: boolean;
}

const HeaderEnvelopeButton: React.FC<HeaderEnvelopeButtonProps> = ({
  onPress,
  hasActiveRequest = false,
  isCompleted = false,
  isPending = false,
  visible = true,
}) => {
  const { colors } = useTheme();
  
  // Safety check - if colors is not available, return null
  if (!colors) {
    return null;
  }
  // If not visible, don't render anything
  if (!visible) {
    return null;
  }
  const getIconColor = () => {
    if (isCompleted) return colors.success;
    if (isPending) return colors.warning;
    if (hasActiveRequest) return colors.warning;
    return colors.text.secondary;
  };

  const getIconName = () => {
    if (isCompleted) return 'checkmark-circle';
    if (isPending) return 'time';
    if (hasActiveRequest) return 'time';
    return 'mail-outline';
  };

  return (
    <TouchableOpacity
      style={[
        styles.envelopeButton,
        { backgroundColor: colors.background.secondary, borderColor: colors.border },
        isPending && [styles.pendingEnvelopeButton, { backgroundColor: colors.warning + '15' }],
        hasActiveRequest && !isCompleted && [styles.activeEnvelopeButton, { backgroundColor: colors.warning + '20' }],
        isCompleted && [styles.completedEnvelopeButton, { backgroundColor: colors.success + '20', borderColor: colors.success }]
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={getIconName()}
        size={22}
        color={getIconColor()}
      />
      {hasActiveRequest && !isCompleted && (
        <View style={[styles.activeDot, { backgroundColor: colors.warning }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  envelopeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activeEnvelopeButton: {
  },
  pendingEnvelopeButton: {
  },
  completedEnvelopeButton: {
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default HeaderEnvelopeButton;
