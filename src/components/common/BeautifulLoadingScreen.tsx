import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');

const BeautifulLoadingScreen = () => {
  const { colors } = useTheme();
  
  // Safety check - if colors is not available, return null
  if (!colors) {
    return null;
  }
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Continuous rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, colors.background.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo/Icon Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ rotate }, { scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconBackground}>
              <Ionicons 
                name="people" 
                size={80} 
                color={colors.text.inverse} 
              />
            </View>
          </Animated.View>

          {/* App Title */}
          <Animated.Text
            style={[
              styles.appTitle,
              { color: colors.text.inverse },
              {
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }) }],
              },
            ]}
          >
            CommUnity
          </Animated.Text>
          <Text style={styles.appSubtitle}>Helping Communities Thrive</Text>

          {/* Loading Dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => {
              const dotAnim = useRef(new Animated.Value(0)).current;
              
              useEffect(() => {
                const dotLoop = Animated.loop(
                  Animated.sequence([
                    Animated.timing(dotAnim, {
                      toValue: 1,
                      duration: 600,
                      delay: index * 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(dotAnim, {
                      toValue: 0,
                      duration: 600,
                      useNativeDriver: true,
                    }),
                  ])
                );
                dotLoop.start();
                return () => dotLoop.stop();
              }, []);

              const dotScale = dotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5],
              });

              const dotOpacity = dotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.text.inverse },
                    {
                      transform: [{ scale: dotScale }],
                      opacity: dotOpacity,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Loading Text */}
          <Text style={styles.loadingText}>Connecting to community...</Text>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecoration}>
          <View style={styles.wave} />
          <View style={[styles.wave, styles.wave2]} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Pacifico-Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 60,
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  wave2: {
    height: 40,
    bottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default BeautifulLoadingScreen;
