import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface HeaderEnvelopeButtonProps {
  onPress: () => void;
  hasActiveRequest?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
  visible?: boolean;
}

const HeaderEnvelopeButton: React.FC<HeaderEnvelopeButtonProps> = ({
  onPress,
  hasActiveRequest,
  isCompleted,
  isPending,
  visible = true,
}) => {
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
        isPending && styles.pendingEnvelopeButton,
        hasActiveRequest && !isCompleted && styles.activeEnvelopeButton,
        isCompleted && styles.completedEnvelopeButton
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={getIconName()}
        size={22}
        color={getIconColor()}
      />
      {hasActiveRequest && !isCompleted && (
        <View style={styles.activeDot} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  envelopeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeEnvelopeButton: {
    backgroundColor: colors.warning + '20',
  },
  pendingEnvelopeButton: {
    backgroundColor: colors.warning + '15',
  },
  completedEnvelopeButton: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
});

export default HeaderEnvelopeButton;
