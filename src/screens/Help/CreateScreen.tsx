import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { auth, db, addDoc, serverTimestamp, collection } from '@/services/firebase';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '@/theme/colors';

const CATEGORIES = [
  'Errands',
  'Tutoring',
  'Tech Support',
  'Pet Care',
  'Home Repair',
  'Transportation',
  'Gardening',
  'Cleaning',
  'Moving Help',
  'Other'
];

const CreateScreen = ({ navigation }: { navigation: any }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    if (locationEnabled) {
      requestLocationPermission();
    }
  }, [locationEnabled]);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const userLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
        
        // Get address from coordinates
        const [address] = await Location.reverseGeocodeAsync({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
        
        if (address) {
          setLocation(prev => prev ? {
            ...prev,
            address: `${address.city}, ${address.region}`
          } : null);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const openLocationPicker = () => {
    if (location) {
      setTempLocation({ latitude: location.latitude, longitude: location.longitude });
    }
    setShowLocationPicker(true);
  };

  const confirmLocation = async () => {
    if (!tempLocation) return;
    let addressLabel: string | undefined = undefined;
    try {
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      });
      if (addr) addressLabel = `${addr.city}, ${addr.region}`;
    } catch {}
    setLocation({ latitude: tempLocation.latitude, longitude: tempLocation.longitude, address: addressLabel });
    setShowLocationPicker(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your request');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please choose a category for your request');
      return;
    }

    if (locationEnabled && !location) {
      Alert.alert('Location Required', 'We need your location to show your request to nearby helpers');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Please Login', 'You need to be logged in to create a request');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        ownerUid: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName || 'Anonymous',
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        urgency,
        status: 'open',
        latitude: locationEnabled ? location.latitude : null,
        longitude: locationEnabled ? location.longitude : null,
        address: locationEnabled ? location.address : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('Creating request with data:', requestData);
      
      const docRef = await addDoc(collection(db, 'requests'), requestData);
      console.log('Request created with ID:', docRef.id);

      Alert.alert(
        'Request Posted!',
        'Your help request has been shared with the community.',
        [
          {
            text: 'View Requests',
            onPress: () => navigation.navigate('App', { screen: 'Feed' }),
          },
          {
            text: 'Stay Here',
            style: 'cancel',
          },
        ]
      );

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setUrgency('medium');
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'low': return colors.urgency.low;
      case 'medium': return colors.urgency.medium;
      case 'high': return colors.urgency.high;
      default: return colors.text.secondary;
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'low': return 'flag-outline';
      case 'medium': return 'alert-circle-outline';
      case 'high': return 'warning-outline';
      default: return 'help-circle-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Help Request</Text>
            <Text style={styles.subtitle}>
              Share what you need help with and connect with your community
            </Text>
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              What do you need help with? *
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Pick up groceries, Fix leaky faucet, Math tutoring"
              placeholderTextColor={colors.text.placeholder}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Additional details (optional)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide more details about what you need, when you need it, and any specific requirements..."
              placeholderTextColor={colors.text.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Urgency Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>How urgent is this? *</Text>
            <View style={styles.urgencyContainer}>
              {(['low', 'medium', 'high'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyOption,
                    urgency === level && { backgroundColor: getUrgencyColor(level) },
                  ]}
                  onPress={() => setUrgency(level)}
                >
                  <Ionicons
                    name={getUrgencyIcon(level)}
                    size={20}
                    color={urgency === level ? colors.text.inverse : getUrgencyColor(level)}
                  />
                  <Text
                    style={[
                      styles.urgencyText,
                      urgency === level && styles.urgencyTextSelected,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            
            {/* Location Toggle */}
            <View style={styles.locationToggleContainer}>
              <View style={styles.locationToggleText}>
                <Text style={styles.locationToggleTitle}>Share your location</Text>
                <Text style={styles.locationToggleSubtitle}>
                  {locationEnabled 
                    ? 'Your request will be shown to nearby helpers' 
                    : 'Your request will be visible to everyone regardless of location'
                  }
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  locationEnabled && styles.toggleSwitchActive
                ]}
                onPress={() => setLocationEnabled(!locationEnabled)}
              >
                <View style={[
                  styles.toggleKnob,
                  locationEnabled && styles.toggleKnobActive
                ]} />
              </TouchableOpacity>
            </View>

            {/* Location Card */}
            {locationEnabled && (
              <View style={styles.locationCard}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.locationText}>
                  <Text style={styles.locationTitle}>
                    {location ? 'Your current location' : 'Location access needed'}
                  </Text>
                  <Text style={styles.locationSubtitle}>
                    {location?.address || 'We use your location to show your request to nearby helpers'}
                  </Text>
                </View>
                {!locationPermission ? (
                  <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={requestLocationPermission}
                  >
                    <Text style={styles.locationButtonText}>Enable</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={openLocationPicker}
                  >
                    <Text style={styles.locationButtonText}>{location ? 'Change' : 'Set'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() || !selectedCategory || (locationEnabled && !location)) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !selectedCategory || (locationEnabled && !location) || isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Posting...</Text>
            ) : (
              <>
                <Ionicons name="send" size={20} color={colors.text.inverse} />
                <Text style={styles.submitButtonText}>Post Help Request</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpText}>
            <Ionicons name="information-circle" size={16} color={colors.text.placeholder} />
            <Text style={styles.helpTextContent}>
              {locationEnabled 
                ? 'Your request will be visible to nearby community members who can offer help.'
                : 'Your request will be visible to all community members who can offer help.'
              }
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showLocationPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background.primary, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
            <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary }}>Pick Location</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={{ height: 320 }}>
              <MapView
                style={{ flex: 1 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: tempLocation?.latitude || location?.latitude || 37.78825,
                  longitude: tempLocation?.longitude || location?.longitude || -122.4324,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                onPress={(e) => setTempLocation(e.nativeEvent.coordinate)}
              >
                {(tempLocation || location) && (
                  <Marker
                    coordinate={{
                      latitude: tempLocation?.latitude || location!.latitude,
                      longitude: tempLocation?.longitude || location!.longitude,
                    }}
                    draggable
                    onDragEnd={(e) => setTempLocation(e.nativeEvent.coordinate)}
                  />
                )}
              </MapView>
            </View>
            <View style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.submitButton, { flex: 1, backgroundColor: '#9CA3AF' }]}
                onPress={() => setShowLocationPicker(false)}
              >
                <Text style={styles.submitButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { flex: 1 }]}
                onPress={confirmLocation}
                disabled={!tempLocation && !location}
              >
                <Text style={styles.submitButtonText}>Use This Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.accent,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.text.placeholder,
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.categories.default,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.categories.default,
  },
  categoryButtonSelected: {
    backgroundColor: colors.categories.default,
    borderColor: colors.categories.default,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.categories.default,
  },
  categoryTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.ui.border,
    gap: 8,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  urgencyTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  locationSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  locationToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 12,
  },
  locationToggleText: {
    flex: 1,
    marginRight: 16,
  },
  locationToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  locationToggleSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    backgroundColor: colors.ui.border,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  locationButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.interactive.disabled,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
  },
  helpTextContent: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default CreateScreen;