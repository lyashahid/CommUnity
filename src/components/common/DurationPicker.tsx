import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface DurationPickerProps {
  visible: boolean;
  onDurationSelected: (hours: number) => void;
  onClose: () => void;
  initialHours?: number;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  visible,
  onDurationSelected,
  onClose,
  initialHours = 24,
}) => {
  const [days, setDays] = useState(Math.floor(initialHours / 24));
  const [hours, setHours] = useState(initialHours % 24);
  const [minutes, setMinutes] = useState(0);

  const screenHeight = Dimensions.get('window').height;

  const incrementDays = () => {
    if (days < 30) setDays(days + 1);
  };

  const decrementDays = () => {
    if (days > 0) setDays(days - 1);
  };

  const incrementHours = () => {
    if (hours < 23) setHours(hours + 1);
  };

  const decrementHours = () => {
    if (hours > 0) setHours(hours - 1);
  };

  const incrementMinutes = () => {
    if (minutes < 59) setMinutes(minutes + 1);
  };

  const decrementMinutes = () => {
    if (minutes > 0) setMinutes(minutes - 1);
  };

  const handleConfirm = () => {
    const totalHours = days * 24 + hours + (minutes > 0 ? 1 : 0);
    onDurationSelected(totalHours);
    onClose();
  };

  const formatDuration = () => {
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 && days === 0 && hours === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    return parts.join(' ') || '0 minutes';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerContainer, { maxHeight: screenHeight * 0.7 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Set Duration</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>Set</Text>
            </TouchableOpacity>
          </View>

          {/* Duration Preview */}
          <View style={styles.durationPreview}>
            <Text style={styles.durationText}>{formatDuration()}</Text>
          </View>

          {/* Picker Wheels */}
          <View style={styles.pickerWheels}>
            {/* Days Wheel */}
            <View style={styles.wheel}>
              <TouchableOpacity style={styles.pickerButton} onPress={decrementDays}>
                <Ionicons name="chevron-up" size={24} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.pickerValue}>
                <Text style={styles.valueText}>{days.toString().padStart(2, '0')}</Text>
                <Text style={styles.labelText}>Days</Text>
              </View>
              <TouchableOpacity style={styles.pickerButton} onPress={incrementDays}>
                <Ionicons name="chevron-down" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Hours Wheel */}
            <View style={styles.wheel}>
              <TouchableOpacity style={styles.pickerButton} onPress={decrementHours}>
                <Ionicons name="chevron-up" size={24} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.pickerValue}>
                <Text style={styles.valueText}>{hours.toString().padStart(2, '0')}</Text>
                <Text style={styles.labelText}>Hours</Text>
              </View>
              <TouchableOpacity style={styles.pickerButton} onPress={incrementHours}>
                <Ionicons name="chevron-down" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Minutes Wheel */}
            <View style={styles.wheel}>
              <TouchableOpacity style={styles.pickerButton} onPress={decrementMinutes}>
                <Ionicons name="chevron-up" size={24} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.pickerValue}>
                <Text style={styles.valueText}>{minutes.toString().padStart(2, '0')}</Text>
                <Text style={styles.labelText}>Minutes</Text>
              </View>
              <TouchableOpacity style={styles.pickerButton} onPress={incrementMinutes}>
                <Ionicons name="chevron-down" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Options */}
          <View style={styles.quickOptions}>
            <Text style={styles.quickOptionsTitle}>Quick Set</Text>
            <View style={styles.quickButtons}>
              {[
                { label: '1h', value: 1 },
                { label: '6h', value: 6 },
                { label: '12h', value: 12 },
                { label: '1d', value: 24 },
                { label: '3d', value: 72 },
                { label: '1w', value: 168 },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.quickButton}
                  onPress={() => {
                    setDays(Math.floor(option.value / 24));
                    setHours(option.value % 24);
                    setMinutes(0);
                  }}
                >
                  <Text style={styles.quickButtonText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  cancelButton: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
  },
  confirmButton: {
    ...typography.body,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  durationPreview: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.background.secondary,
  },
  durationText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  pickerWheels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  wheel: {
    alignItems: 'center',
    flex: 1,
  },
  pickerButton: {
    paddingVertical: 10,
  },
  pickerValue: {
    alignItems: 'center',
    paddingVertical: 15,
    marginVertical: 5,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    minWidth: 80,
  },
  valueText: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '600',
  },
  labelText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
  },
  quickOptions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickOptionsTitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '500',
  },
});

export default DurationPicker;
