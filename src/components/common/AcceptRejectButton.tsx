import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';

interface AcceptRejectButtonProps {
  onRequestAction: (action: 'accept' | 'reject', reason?: string) => void;
  disabled?: boolean;
  visible?: boolean;
  onClose?: () => void;
  userName?: string;
  requestTitle?: string;
}

const AcceptRejectButton: React.FC<AcceptRejectButtonProps> = ({ 
  onRequestAction, 
  disabled = false,
  visible = true,
  onClose,
  userName = 'User',
  requestTitle = 'Help Request'
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState<'accept' | 'reject'>('accept');

  const styles = StyleSheet.create({
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background.secondary,
    },
    acceptButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    rejectButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.status.error,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    buttonText: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text.inverse,
    },
    disabledButton: {
      opacity: 0.5,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
    },
    keyboardContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface.card,
      borderRadius: 20,
      marginHorizontal: 20,
      maxHeight: '80%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '600',
    },
    closeButton: {
      padding: 4,
    },
    contentContainer: {
      padding: 20,
      alignItems: 'center',
    },
    requestInfo: {
      alignItems: 'center',
      marginBottom: 20,
    },
    requestTitle: {
      ...typography.h3,
      color: colors.text.primary,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 4,
    },
    requestFrom: {
      ...typography.body,
      color: colors.text.secondary,
    },
    actionIcon: {
      marginBottom: 20,
    },
    actionDescription: {
      ...typography.body,
      color: colors.text.primary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    reasonInput: {
      width: '100%',
    },
    reasonLabel: {
      ...typography.body,
      color: colors.text.primary,
      fontWeight: '500',
      marginBottom: 8,
    },
    reasonTextArea: {
      backgroundColor: colors.background.secondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...typography.body,
      color: colors.text.primary,
      height: 80,
      textAlignVertical: 'top',
    },
    characterCount: {
      ...typography.caption,
      color: colors.text.secondary,
      textAlign: 'right',
      marginTop: 4,
    },
    modalActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    cancelButton: {
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    acceptActionButton: {
      backgroundColor: colors.primary,
    },
    rejectActionButton: {
      backgroundColor: colors.status.error,
    },
    cancelButtonText: {
      ...typography.body,
      color: colors.text.primary,
      fontWeight: '500',
    },
    submitButtonText: {
      ...typography.body,
      color: colors.text.inverse,
      fontWeight: '600',
    },
  });

  const handleAccept = () => {
    setAction('accept');
    setModalVisible(true);
  };

  const handleReject = () => {
    setAction('reject');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (action === 'reject' && !rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejecting this request.');
      return;
    }

    onRequestAction(action, rejectReason.trim());
    setRejectReason('');
    setModalVisible(false);
    
    Alert.alert(
      action === 'accept' ? 'Request Accepted' : 'Request Rejected',
      action === 'accept' 
        ? `You have accepted ${userName}'s request. You can now help them!`
        : `You have rejected ${userName}'s request.`
    );
  };

  return (
    <>
      {visible && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.rejectButton, disabled && styles.disabledButton]}
            onPress={handleReject}
            disabled={disabled}
          >
            <Ionicons name="close-circle" size={20} color={colors.text.inverse} />
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.acceptButton, disabled && styles.disabledButton]}
            onPress={handleAccept}
            disabled={disabled}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          onClose?.();
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setModalVisible(false);
          onClose?.();
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
              >
                <SafeAreaView style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                        {action === 'accept' ? 'Accept Request' : 'Decline Request'}
                      </Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Ionicons name="close" size={24} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestTitle}>{requestTitle}</Text>
                        <Text style={styles.requestFrom}>From: {userName}</Text>
                      </View>

                      <View style={styles.actionIcon}>
                        <Ionicons 
                          name={action === 'accept' ? 'checkmark-circle' : 'close-circle'} 
                          size={64} 
                          color={action === 'accept' ? colors.primary : colors.status.error} 
                        />
                      </View>

                      <Text style={styles.actionDescription}>
                        {action === 'accept' 
                          ? 'Are you sure you want to accept this request? You\'ll be able to help and communicate with the requester.'
                          : 'Are you sure you want to decline this request? Please provide a reason.'
                        }
                      </Text>

                      {action === 'reject' && (
                        <View style={styles.reasonInput}>
                          <Text style={styles.reasonLabel}>Reason for declining</Text>
                          <TextInput
                            style={styles.reasonTextArea}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="Please explain why you're declining this request..."
                            placeholderTextColor={colors.text.placeholder}
                            multiline
                            numberOfLines={4}
                            maxLength={300}
                            textAlignVertical="top"
                          />
                          <Text style={styles.characterCount}>
                            {rejectReason.length}/300
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton, 
                          action === 'accept' ? styles.acceptActionButton : styles.rejectActionButton
                        ]}
                        onPress={handleSubmit}
                      >
                        <Ionicons 
                          name={action === 'accept' ? 'checkmark' : 'close'} 
                          size={18} 
                          color={colors.text.inverse} 
                        />
                        <Text style={styles.submitButtonText}>
                          {action === 'accept' ? 'Accept' : 'Decline'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </SafeAreaView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default AcceptRejectButton;
