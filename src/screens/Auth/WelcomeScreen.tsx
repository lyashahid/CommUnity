import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Pacifico_400Regular,
  });

  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  const handleLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const handleSignup = () => {
    navigation.navigate('Auth', { screen: 'Signup' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <ImageBackground
            source={require('@/assets/images/login.png')}
            style={styles.communityImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>CommUnity</Text>
          <Text style={styles.subtitle}>
            Connect, support, and help each other. 
          </Text>
        </View>

        {/* Buttons Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#5FA8D3', '#4A90B8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signupButton}
            onPress={handleSignup}
            activeOpacity={0.85}
          >
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          Together we can build a stronger community
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  communityImage: {
    width: width * 0.95, // 95% of screen width (bigger)
    height: height * 0.45, // 45% of screen height (bigger)
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
    color: '#5FA8D3', // Match primary color
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    textAlign: 'center',
    color: '#6C6C6C', // Match secondary text color
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 350,
    gap: 16,
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#5FA8D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  signupButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5FA8D3',
    shadowColor: '#5FA8D3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#5FA8D3',
    letterSpacing: 0.5,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6C6C6C', // Match secondary text color
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
});

export default WelcomeScreen;