import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, doc, updateDoc } from '@/services/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    displayName?: string;
    bio?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (route.params?.user) {
      const { displayName, bio, photoURL } = route.params.user;
      setDisplayName(displayName || '');
      setBio(bio || '');
      if (photoURL) setImage(photoURL);
    }
  }, [route.params?.user]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (newPassword && newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (newPassword && !currentPassword) {
      newErrors.currentPassword = 'Current password is required to change password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async (useCamera = false) => {
    try {
      let permissionType;
      let imagePickerOptions;
      
      if (useCamera) {
        permissionType = ImagePicker.PermissionStatus;
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant camera permissions to take a photo');
          return;
        }
        imagePickerOptions = {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        };
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant camera roll permissions to upload an image');
          return;
        }
        imagePickerOptions = {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        };
      }

      const result = useCamera 
        ? await ImagePicker.launchCameraAsync(imagePickerOptions)
        : await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const showImagePickerOptions = () => {
    const options = [
      {
        text: 'Take Photo',
        onPress: () => pickImage(true),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => pickImage(false),
      },
    ];
    
    // Add remove photo option if user has a current photo
    if (image || auth.currentUser?.photoURL) {
      options.push({
        text: 'Remove Photo',
        onPress: () => {
          setImage(null);
          // This will remove the photo when saved
        },
        style: 'destructive' as const,
      });
    }
    
    options.push({
      text: 'Cancel',
      style: 'cancel' as const,
    });
    
    Alert.alert(
      'Change Profile Photo',
      'Choose an option to update your profile picture',
      options
    );
  };

  const convertToBase64 = async (uri: string) => {
    try {
      console.log('Converting image to base64...');
      
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      
      // Convert blob to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          console.log('Base64 conversion completed, length:', base64.length);
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to convert image to base64'));
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      // Prepare updates for Firestore
      const updates: any = {
        displayName,
        bio,
        updatedAt: new Date().toISOString(),
      };
      
      // Prepare profile updates for Firebase Auth
      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      
      // Handle profile image upload/removal
      let imageUrl = user.photoURL;
      if (image === null) {
        // User wants to remove the photo
        imageUrl = null;
        updates.photoURL = null;
        profileUpdates.photoURL = null;
      } else if (image && !image.startsWith('http') && !image.startsWith('data:')) {
        // User uploaded a new photo (not a URL or existing base64)
        const base64Image = await convertToBase64(image);
        updates.photoURL = base64Image;
        // Don't update Firebase Auth photoURL with base64 (too long)
        // Only update Auth if not using base64
        // profileUpdates.photoURL remains undefined for base64 images
      }
      
      // Update display name if changed
      if (user.displayName !== displayName) {
        profileUpdates.displayName = displayName;
      }
      
      // Update auth profile if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(user, profileUpdates);
      }
      
      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      
      // Update password if a new one was provided
      if (newPassword && currentPassword) {
        const credential = EmailAuthProvider.credential(
          user.email || '',
          currentPassword
        );
        
        try {
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
        } catch (error: any) {
          if (error.code === 'auth/wrong-password') {
            Alert.alert('Error', 'Current password is incorrect');
            return;
          }
          throw error;
        }
      }
      
      // Force refresh the auth state to ensure updates are reflected
      await user.reload();
      
      // Show success message and navigate back
      Alert.alert('Success', 'Profile updated successfully', [
        { 
          text: 'OK', 
          onPress: () => {
            navigation.goBack();
          } 
        }
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={showImagePickerOptions} disabled={isLoading}>
            <View style={styles.imageWrapper}>
              {image ? (
                <Image source={{ uri: image }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.editIcon}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            editable={!isLoading}
          />
          {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.textArea, errors.bio && styles.inputError]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={[styles.input, errors.currentPassword && styles.inputError]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              editable={!isLoading}
            />
            {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={[styles.input, errors.newPassword && styles.inputError]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Leave blank to keep current"
              secureTextEntry
              editable={!isLoading}
            />
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
          </View>

          {newPassword ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                editable={!isLoading}
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          ) : null}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  section: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
