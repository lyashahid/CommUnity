import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, doc, setDoc } from '@/services/firebase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useAuth } from '@/hooks/useAuth';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const skillsList = useMemo(() => [
    'Tutoring', 'Tech Support', 'Pet Care', 'Errands', 'Cooking',
    'Cleaning', 'Gardening', 'Moving Help', 'Babysitting', 'Elderly Care',
    'Language Lessons', 'Music Lessons', 'Art Lessons', 'Fitness Training', 'Home Repairs'
  ], []);

  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prevSkills => {
      const newSkills = prevSkills.includes(skill)
        ? prevSkills.filter(s => s !== skill)
        : [...prevSkills, skill];
      return [...new Set(newSkills)];
    });
  };

  const handleComplete = async () => {
    if (!bio.trim() || !location.trim() || selectedSkills.length === 0) {
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
        location: location.trim(),
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
      
      // Show success message - AppNavigator will automatically detect the change
      Alert.alert(
        'Welcome to CommUnity!', 
        'Your profile has been created successfully.\n\nYou will be redirected to the main app shortly.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7C59" />
        <Text style={styles.loadingText}>Setting up your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={64} color="#4A7C59" />
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Join our community of helpers and make a difference</Text>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About You</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself, your interests, and how you'd like to help others..."
              placeholderTextColor="#A8A8A8"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <View style={styles.locationInputContainer}>
            <Ionicons name="location-outline" size={20} color="#8B7355" style={styles.locationIcon} />
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="City, Country"
              placeholderTextColor="#A8A8A8"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.skillsHeader}>
            <Text style={styles.sectionTitle}>Your Skills & Expertise</Text>
            <Text style={styles.skillsCounter}>
              {selectedSkills.length}/15 selected
            </Text>
          </View>
          <Text style={styles.skillsSubtitle}>Choose the skills you'd like to share with the community</Text>
          <View style={styles.skillsContainer}>
            {skillsList.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.skillTag,
                  selectedSkills.includes(skill) && styles.skillTagSelected
                ]}
                onPress={() => toggleSkill(skill)}
              >
                <Text style={[
                  styles.skillText,
                  selectedSkills.includes(skill) && styles.skillTextSelected
                ]}>
                  {skill}
                </Text>
                {selectedSkills.includes(skill) && (
                  <Ionicons name="checkmark" size={16} color="#4A7C59" style={styles.skillIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || !bio || !location || selectedSkills.length === 0) && styles.buttonDisabled
          ]}
          onPress={handleComplete}
          disabled={isLoading || !bio || !location || selectedSkills.length === 0}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Profile...' : 'Join Community'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
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
    backgroundColor: '#FEFDF9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7355',
  },
  container: {
    flex: 1,
    backgroundColor: '#FEFDF9',
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
    color: '#2D5016',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2D5016',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2D5016',
    borderWidth: 2,
    borderColor: '#D4B896',
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
    color: '#8B7355',
    fontSize: 12,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4B896',
  },
  locationIcon: {
    marginLeft: 16,
  },
  locationInput: {
    flex: 1,
    borderWidth: 0,
    marginLeft: 12,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillsCounter: {
    fontSize: 14,
    color: '#4A7C59',
    fontWeight: '600',
  },
  skillsSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#D4B896',
  },
  skillTagSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4A7C59',
  },
  skillText: {
    color: '#8B7355',
    fontSize: 14,
    fontWeight: '500',
  },
  skillTextSelected: {
    color: '#2D5016',
  },
  skillIcon: {
    marginLeft: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A7C59',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A8C6A9',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OnboardingScreen;