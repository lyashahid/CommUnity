import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, doc, setDoc } from '@/services/firebase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import * as Location from 'expo-location';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const skillsList = useMemo(() => [
    'Tutoring', 'Tech Support', 'Pet Care', 'Errands', 'Cooking',
    'Cleaning', 'Gardening', 'Moving Help', 'Babysitting', 'Elderly Care',
    'Language Lessons', 'Music Lessons', 'Art Lessons', 'Fitness Training', 'Home Repairs'
  ], []);

  const [bio, setBio] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prevSkills => {
      const newSkills = prevSkills.includes(skill)
        ? prevSkills.filter(s => s !== skill)
        : [...prevSkills, skill];
      return [...new Set(newSkills)];
    });
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to set your location');
        setIsGettingLocation(false);
        return;
      }

      let locationData = await Location.getCurrentPositionAsync({});
      
      // Get address from coordinates (reverse geocoding)
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });

      let address = 'Unknown location';
      if (reverseGeocode.length > 0) {
        const { city, region, country } = reverseGeocode[0];
        address = `${city || ''}, ${region || ''}, ${country || ''}`.replace(/, ,/g, ',').replace(/^,|,$/g, '');
      }

      setLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        address
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleComplete = async () => {
    if (!bio.trim() || !location || selectedSkills.length === 0) {
      Alert.alert('Please fill in all fields');
      return;
    }

    if (!currentUser?.uid) {
      Alert.alert('Error', 'No authenticated user found');
      return;
    }

    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userData = {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || null,
        bio: bio.trim(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        },
        skills: selectedSkills,
        isOnboarded: true,
        updatedAt: new Date().toISOString(),
        level: 1,
        rating: 0,
        reviewCount: 0,
        completedRequests: 0,
        helpedPeople: 0,
        responseRate: 0,
      };

      await setDoc(userRef, userData, { merge: true });
      
      // Show success message
      Alert.alert(
        'Profile Complete!', 
        'Your profile has been created successfully!\n\nNow let\'s show you around the app.'
      );
      
      // Navigate to instruction slides after profile completion
      setTimeout(() => {
        navigation.navigate('OnboardingFlow' as any, {
          onComplete: () => {
            // After instruction slides, set onboarded status to go to main app
            // This will trigger the AppNavigator to show the main app
            console.log('OnboardingFlow completed, setting isOnboarded to true');
            // We need to access the navigator's state somehow
            // For now, let's navigate to the App screen directly
            navigation.reset({
              index: 0,
              routes: [{ name: 'App' as any }],
            });
          }
        });
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Setting up your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={64} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text.primary }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Welcome, {currentUser?.displayName || 'Community Member'}!
          </Text>
          <Text style={[styles.subsubtitle, { color: colors.text.tertiary }]}>
            Join our community of helpers and make a difference
          </Text>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About You</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, styles.bioInput, { color: colors.text.primary }]}
              placeholder="Tell us about yourself, your interests, and how you'd like to help others..."
              placeholderTextColor={colors.text.placeholder}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: colors.text.secondary }]}>{bio.length}/200</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Location</Text>
          <TouchableOpacity 
            style={[styles.locationContainer, { backgroundColor: colors.surface.card, borderColor: colors.border }]}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}
          >
            <View style={styles.locationContent}>
              <Ionicons name="location-outline" size={20} color={colors.text.secondary} style={styles.locationIcon} />
              {isGettingLocation ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.locationText, { color: colors.text.secondary }]}>Getting location...</Text>
                </View>
              ) : location ? (
                <Text style={[styles.locationText, { color: colors.text.primary }]}>{location.address}</Text>
              ) : (
                <Text style={[styles.locationPlaceholder, { color: colors.text.placeholder }]}>Tap to get your current location</Text>
              )}
            </View>
            <Ionicons name="refresh" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.skillsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Skills & Expertise</Text>
            <Text style={[styles.skillsCounter, { color: colors.primary }]}>
              {selectedSkills.length}/15 selected
            </Text>
          </View>
          <Text style={[styles.skillsSubtitle, { color: colors.text.secondary }]}>Choose the skills you'd like to share with the community</Text>
          <View style={styles.skillsContainer}>
            {skillsList.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.skillTag,
                  { backgroundColor: colors.surface.card, borderColor: colors.border },
                  selectedSkills.includes(skill) && [styles.skillTagSelected, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]
                ]}
                onPress={() => toggleSkill(skill)}
              >
                <Text style={[
                  styles.skillText,
                  { color: colors.text.secondary },
                  selectedSkills.includes(skill) && [styles.skillTextSelected, { color: colors.text.primary }]
                ]}>
                  {skill}
                </Text>
                {selectedSkills.includes(skill) && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} style={styles.skillIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (isLoading || !bio || !location || selectedSkills.length === 0) && [styles.buttonDisabled, { backgroundColor: colors.interactive.disabled }]
          ]}
          onPress={handleComplete}
          disabled={isLoading || !bio || !location || selectedSkills.length === 0}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Profile...' : 'Join Community'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} style={styles.buttonIcon} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  subsubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  locationPlaceholder: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  locationIcon: {
    marginLeft: 16,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillsCounter: {
    fontSize: 14,
    fontWeight: '600',
  },
  skillsSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
  },
  skillTagSelected: {},
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  skillTextSelected: {},
  skillIcon: {
    marginLeft: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {},
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OnboardingScreen;