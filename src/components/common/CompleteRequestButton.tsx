import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';
import { saveReviewAndUpdateProfiles } from '../../services/ratingService';
import { auth } from '../../services/firebase';

interface CompleteRequestButtonProps {
  onCompleteRequest: (ratingData: any) => void;
  disabled?: boolean;
  userName?: string;
  visible?: boolean;
  onClose?: () => void;
  requestId?: string;
  requestTitle?: string;
  helperId?: string;
  chatId?: string;
}

const CompleteRequestButton: React.FC<CompleteRequestButtonProps> = ({ 
  onCompleteRequest, 
  disabled = false,
  userName = 'Helper',
  visible = true,
  onClose,
  requestId,
  requestTitle = 'Help Request',
  helperId,
  chatId
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const ratingTags = [
    'Very Helpful', 'Quick Response', 'Knowledgeable', 
    'Friendly', 'Patient', 'Good Communication'
  ];

  const styles = StyleSheet.create({
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
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
    completeButtonText: {
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
    userInfo: {
      alignItems: 'center',
      padding: 24,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    userName: {
      ...typography.h3,
      color: colors.text.primary,
      marginBottom: 4,
    },
    ratingSubtitle: {
      ...typography.body,
      color: colors.text.secondary,
    },
    ratingSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: 'center',
    },
    sectionTitle: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginVertical: 16,
    },
    starButton: {
      padding: 4,
    },
    ratingLabel: {
      ...typography.body,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    tagsSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedTag: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tagText: {
      ...typography.caption,
      color: colors.text.secondary,
      fontWeight: '500',
    },
    selectedTagText: {
      color: colors.text.inverse,
    },
    feedbackSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    feedbackSubtitle: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    characterCount: {
      ...typography.caption,
      color: colors.text.secondary,
      textAlign: 'right',
      marginTop: 4,
    },
    feedbackInput: {
      backgroundColor: colors.background.secondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...typography.body,
      color: colors.text.primary,
      height: 80,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
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
    submitButton: {
      backgroundColor: colors.success,
    },
    cancelButtonText: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text.primary,
    },
    submitButtonText: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text.inverse,
    },
  });

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    if (!auth.currentUser || !helperId || !requestId) {
      Alert.alert('Error', 'Missing required information for submitting review.');
      return;
    }

    try {
      const reviewData = {
        rating,
        comment: feedback.trim(),
        tags: selectedTags,
        reviewerName: auth.currentUser.displayName || 'Anonymous',
        reviewerUid: auth.currentUser.uid,
        revieweeName: userName,
        revieweeUid: helperId,
        requestTitle: requestTitle,
        requestId: requestId,
        chatId: chatId || `${auth.currentUser.uid}_${helperId}`,
        createdAt: new Date(),
      };

      // Save review using ratingService
      await saveReviewAndUpdateProfiles(reviewData);

      // Call the original callback
      onCompleteRequest(reviewData);
      
      // Reset form and close modal
      setRating(0);
      setFeedback('');
      setSelectedTags([]);
      setModalVisible(false);
      
      Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Unable to submit review. Please try again.');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? colors.warning : colors.text.secondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      {visible && (
        <TouchableOpacity
          style={[styles.completeButton, disabled && styles.disabledButton]}
          onPress={() => setModalVisible(true)}
          disabled={disabled}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
          <Text style={styles.completeButtonText}>Complete & Rate</Text>
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
              >
                <SafeAreaView style={styles.modalContainer}>
                  <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate Your Experience</Text>
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

              {/* User Info */}
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color={colors.primary} />
                </View>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.ratingSubtitle}>How was your experience?</Text>
              </View>

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>Overall Rating</Text>
                {renderStars()}
                <Text style={styles.ratingLabel}>
                  {rating === 0 ? 'Select a rating' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsSection}>
                <Text style={styles.sectionTitle}>What did they do well?</Text>
                <View style={styles.tagsContainer}>
                  {ratingTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tag,
                        selectedTags.includes(tag) && styles.selectedTag
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.selectedTagText
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Feedback */}
              <View style={styles.feedbackSection}>
                <Text style={styles.sectionTitle}>Additional Feedback (Optional)</Text>
                <Text style={styles.feedbackSubtitle}>
                  Share more details about your experience
                </Text>
                <TextInput
                  style={styles.feedbackInput}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Tell us more about your experience..."
                  placeholderTextColor={colors.text.placeholder}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {feedback.length}/200
                </Text>
              </View>
            </ScrollView>

            {/* Actions */}
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
                style={[styles.actionButton, styles.submitButton]}
                onPress={handleSubmitRating}
              >
                <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
                <Text style={styles.submitButtonText}>Submit Rating</Text>
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

export default CompleteRequestButton;
