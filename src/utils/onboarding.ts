import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@has_seen_onboarding';

export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding:', error);
    return false;
  }
};

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding:', error);
  }
};

export const resetOnboarding = async (): Promise<void> => {
  try {
    console.log('Removing onboarding key from AsyncStorage...');
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('Onboarding key removed successfully');
    
    // Verify it's actually removed
    const status = await AsyncStorage.getItem(ONBOARDING_KEY);
    console.log('Verification - onboarding status after reset:', status);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
};