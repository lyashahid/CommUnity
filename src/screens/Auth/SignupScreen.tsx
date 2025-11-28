// src/screens/Auth/SignupScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { createUserWithEmailAndPassword, onAuthStateChanged } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { colors } from '@/theme/colors';

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; displayName?: string }>({});

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Pacifico_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        console.log('User is already signed in:', user.email);
        // Let AppNavigator handle the routing based on auth state
      }
    });
    return () => unsubscribe();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!displayName.trim()) newErrors.displayName = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(email.trim(), password);
      console.log('Signed up user:', userCredential.user.email);
      // Let AppNavigator handle the routing based on auth state
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = error.message || 'An error occurred during signup';
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#F0F9FF', '#E0F2FE', '#DBEAFE'] as const} style={styles.gradient}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
          <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Animated.View style={[styles.floatingCircle1, { transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) }] }]} />
            <Animated.View style={[styles.floatingCircle2, { transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, -10] }) }] }]} />
            <View style={styles.floatingCircle3} />

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
              <View style={styles.header}>
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient colors={[colors.primary, colors.primaryLight] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
                    <Ionicons name="people" size={44} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.logoRing1} />
                  <View style={styles.logoRing2} />
                </Animated.View>

                <Text style={styles.appName}>CommUnity</Text>
                <Text style={styles.tagline}>Connect. Share. Support.</Text>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.subtitle}>Join our community today</Text>
                </View>
              </View>

              <BlurView intensity={20} tint="light" style={styles.formCard}>
                <View style={styles.formCardInner}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={[styles.inputWrapper, errors.displayName && styles.inputError]}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="person" size={20} color={errors.displayName ? colors.status.error : colors.primary} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor={colors.text.placeholder}
                        value={displayName}
                        onChangeText={(text) => { setDisplayName(text); if (errors.displayName) setErrors({ ...errors, displayName: undefined }); }}
                        autoCapitalize="words"
                        editable={!isLoading}
                      />
                    </View>
                    {errors.displayName && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color={colors.status.error} />
                        <Text style={styles.errorText}>{errors.displayName}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="mail" size={20} color={errors.email ? colors.status.error : colors.primary} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={colors.text.placeholder}
                        value={email}
                        onChangeText={(text) => { setEmail(text); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        editable={!isLoading}
                      />
                    </View>
                    {errors.email && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color={colors.status.error} />
                        <Text style={styles.errorText}>{errors.email}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="lock-closed" size={20} color={errors.password ? colors.status.error : colors.primary} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={colors.text.placeholder}
                        value={password}
                        onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                        secureTextEntry={!showPassword}
                        textContentType="password"
                        autoCapitalize="none"
                        autoComplete="password"
                        editable={!isLoading}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} activeOpacity={0.7}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color={colors.status.error} />
                        <Text style={styles.errorText}>{errors.password}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="lock-closed" size={20} color={errors.confirmPassword ? colors.status.error : colors.primary} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={colors.text.placeholder}
                        value={confirmPassword}
                        onChangeText={(text) => { setConfirmPassword(text); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined }); }}
                        secureTextEntry={!showConfirmPassword}
                        textContentType="password"
                        autoCapitalize="none"
                        autoComplete="password"
                        editable={!isLoading}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton} activeOpacity={0.7}>
                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color={colors.status.error} />
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.signupButton, 
                      (!displayName || !email || !password || !confirmPassword) && styles.buttonDisabled
                    ]}
                    onPress={handleSignup}
                    disabled={!displayName || !email || !password || !confirmPassword || isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </BlurView>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Auth', { screen: 'Login' })} disabled={isLoading} activeOpacity={0.7} style={styles.loginLinkButton}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF' },
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  floatingCircle1: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(95, 168, 211, 0.12)' },
  floatingCircle2: { position: 'absolute', bottom: 100, left: -90, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(147, 197, 253, 0.15)' },
  floatingCircle3: { position: 'absolute', top: '35%', right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(95, 168, 211, 0.08)' },
  content: { flex: 1, justifyContent: 'center', paddingVertical: 40, minHeight: height - 100 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' },
  logo: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 },
  logoRing1: { position: 'absolute', width: 108, height: 108, borderRadius: 54, borderWidth: 2, borderColor: 'rgba(95, 168, 211, 0.2)' },
  logoRing2: { position: 'absolute', width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: 'rgba(95, 168, 211, 0.1)' },
  appName: { fontFamily: 'Pacifico_400Regular', fontSize: 36, color: colors.primary, letterSpacing: 0.5, marginBottom: 4 },
  tagline: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.primary, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 24 },
  welcomeContainer: { alignItems: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  formCard: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
  formCardInner: { padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  inputContainer: { marginBottom: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.text.primary, marginBottom: 10, letterSpacing: 0.3 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.ui.border, borderRadius: 16, backgroundColor: colors.background.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputIconContainer: { paddingLeft: 16, paddingRight: 8 },
  input: { flex: 1, paddingVertical: 18, paddingRight: 16, fontSize: 16, color: colors.text.primary, fontFamily: 'Inter_400Regular' },
  eyeButton: { paddingHorizontal: 16, paddingVertical: 18 },
  inputError: { borderColor: colors.status.error, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 4 },
  errorText: { color: colors.status.error, fontSize: 13, fontFamily: 'Inter_500Medium', marginLeft: 6 },
  signupButtonWrapper: { marginTop: 8, marginBottom: 24, borderRadius: 16, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  signupButton: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonInactive: { shadowOpacity: 0.15 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.text.inverse, fontSize: 18, fontFamily: 'Inter_700Bold', marginRight: 8, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28, paddingVertical: 16, flexWrap: 'wrap' },
  footerText: { color: colors.text.secondary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  loginLinkButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.primary },
  loginLinkGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  loginLink: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
});

export default SignupScreen;