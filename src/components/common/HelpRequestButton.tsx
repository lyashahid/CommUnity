import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DurationPicker from './DurationPicker';

interface HelpRequestButtonProps {
  onRequestSent: (requestData: any) => void;
  disabled?: boolean;
  visible?: boolean;
  onClose?: () => void;
  recentRequest?: {
    title: string;
    description: string;
    category: string;
    urgency: string;
  };
}

const HelpRequestButton: React.FC<HelpRequestButtonProps> = ({ 
  onRequestSent, 
  disabled = false,
  visible = true,
  onClose,
  recentRequest
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [requestTitle, setRequestTitle] = useState(recentRequest?.title || '');
  const [requestDescription, setRequestDescription] = useState(recentRequest?.description || '');
  const [duration, setDuration] = useState(24); // Default 24 hours
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Update form when recentRequest changes
  useEffect(() => {
    if (recentRequest) {
      setRequestTitle(recentRequest.title);
      setRequestDescription(recentRequest.description);
    }
  }, [recentRequest]);

  const handleSendRequest = () => {
    if (!requestTitle.trim() || !requestDescription.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and description.');
      return;
    }

    const requestData = {
      title: requestTitle.trim(),
      description: requestDescription.trim(),
      duration: duration,
      timestamp: new Date(),
      isOfficialRequest: true,
    };

    onRequestSent(requestData);
    
    // Reset form and close modal
    setRequestTitle('');
    setRequestDescription('');
    setDuration(24);
    setModalVisible(false);
    
    Alert.alert('Request Sent', 'Your official help request has been sent successfully!');
  };

  const formatDuration = (hours: number): string => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      if (remainingHours > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <>
      {visible && (
        <TouchableOpacity
          style={[styles.requestButton, disabled && styles.disabledButton]}
          onPress={() => setModalVisible(true)}
          disabled={disabled}
        >
          <Ionicons name="help-circle" size={20} color={colors.text.inverse} />
          <Text style={styles.requestButtonText}>Send Official Request</Text>
        </TouchableOpacity>
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
                keyboardVerticalOffset={0}
              >
                <SafeAreaView style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Send Official Help Request</Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                          setModalVisible(false);
                          onClose?.();
                        }}
                      >
                        <Ionicons name="close" size={24} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Scrollable Form Content */}
                    <ScrollView 
                      style={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {/* Form */}
                      <View style={styles.formContainer}>
                        {/* Recent Request Indicator */}
                        {recentRequest && (recentRequest.title || recentRequest.description) && (
                          <View style={styles.recentRequestIndicator}>
                            <Ionicons name="refresh" size={16} color={colors.primary} />
                            <Text style={styles.recentRequestText}>
                              Filled from your most recent request
                            </Text>
                          </View>
                        )}

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Request Title</Text>
                          <TextInput
                            style={styles.input}
                            value={requestTitle}
                            onChangeText={setRequestTitle}
                            placeholder="Brief summary of your request"
                            placeholderTextColor={colors.text.placeholder}
                            maxLength={100}
                          />
                          <Text style={styles.characterCount}>
                            {requestTitle.length}/100
                          </Text>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Description</Text>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            value={requestDescription}
                            onChangeText={setRequestDescription}
                            placeholder="Detailed description of what you need help with..."
                            placeholderTextColor={colors.text.placeholder}
                            multiline
                            numberOfLines={6}
                            maxLength={500}
                            textAlignVertical="top"
                          />
                          <Text style={styles.characterCount}>
                            {requestDescription.length}/500
                          </Text>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Request Duration</Text>
                          <TouchableOpacity
                            style={styles.durationInput}
                            onPress={() => setShowDurationPicker(true)}
                          >
                            <Text style={styles.durationInputText}>
                              {formatDuration(duration)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
                          </TouchableOpacity>
                          <Text style={styles.durationHelperText}>
                            Request will automatically close after this period
                          </Text>
                        </View>

                        {/* Request Preview */}
                        {(requestTitle || requestDescription) && (
                          <View style={styles.previewSection}>
                            <Text style={styles.previewTitle}>Request Preview</Text>
                            <View style={styles.previewCard}>
                              {requestTitle && (
                                <Text style={styles.previewTitleText}>{requestTitle}</Text>
                              )}
                              {requestDescription && (
                                <Text style={styles.previewDescriptionText}>{requestDescription}</Text>
                              )}
                              <View style={styles.previewMeta}>
                                <Text style={styles.previewDuration}>{formatDuration(duration)}</Text>
                                <Text style={styles.previewType}>Official Request</Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    </ScrollView>

                    {/* Fixed Bottom Actions */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => {
                          setModalVisible(false);
                          onClose?.();
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.sendButton]}
                        onPress={handleSendRequest}
                      >
                        <Ionicons name="send" size={18} color={colors.text.inverse} />
                        <Text style={styles.sendButtonText}>Send Request</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </SafeAreaView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Duration Picker Modal */}
      <DurationPicker
        visible={showDurationPicker}
        onDurationSelected={(hours) => setDuration(hours)}
        onClose={() => setShowDurationPicker(false)}
        initialHours={duration}
      />
    </>
  );
};

const styles = StyleSheet.create({
  requestButton: {
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
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: colors.text.secondary,
    opacity: 0.6,
  },
  requestButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  scrollContent: {
    flex: 1,
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
    ...typography.h2,
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  recentRequestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  recentRequestText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  durationInputText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  durationHelperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 8,
    fontSize: 11,
  },
  // Preview section styles
  previewSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  previewTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  previewTitleText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewDescriptionText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDuration: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  previewType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sendButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default HelpRequestButton;
