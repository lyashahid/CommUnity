import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, query, where, onSnapshot, orderBy, db } from '@/services/firebase';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const { width, height } = Dimensions.get('window');

type HelpRequest = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  requesterId: string;
  requesterName: string;
  distance: number;
  status: 'active' | 'completed' | 'in-progress';
  createdAt: any;
};

const MapScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [radius, setRadius] = useState<number>(5); // km
  const [mapReady, setMapReady] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // Get user location
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);
        
        // Watch position updates
        const subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000, // Update every 30 seconds
            distanceInterval: 50, // Update every 50 meters
          },
          (newLocation) => {
            setUserLocation(newLocation);
          }
        );

        return () => subscriber.remove();
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby help requests.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Fetch nearby help requests
  useEffect(() => {
    if (!userLocation) return;

    const { latitude, longitude } = userLocation.coords;

    // Calculate bounding box for geo-queries (simplified approach)
    const latDelta = radius / 111; // 1 degree ≈ 111 km
    const lngDelta = radius / (111 * Math.cos(latitude * Math.PI / 180));

    const q = query(
      collection(db, 'requests'),
      where('latitude', '>=', latitude - latDelta),
      where('latitude', '<=', latitude + latDelta),
      where('longitude', '>=', longitude - lngDelta),
      where('longitude', '<=', longitude + lngDelta),
      where('status', '==', 'open'), // Changed from 'active' to 'open' to match seed data
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Map query found', snapshot.docs.length, 'requests');
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Map request:', { id: doc.id, title: data.title, lat: data.latitude, lng: data.longitude, status: data.status });
        const distance = calculateDistance(
          latitude,
          longitude,
          data.latitude,
          data.longitude
        );
        
        return {
          id: doc.id,
          title: data.title,
          category: data.category,
          latitude: data.latitude,
          longitude: data.longitude,
          requesterId: data.requesterId,
          requesterName: data.requesterName,
          distance,
          status: data.status,
          createdAt: data.createdAt,
        } as HelpRequest;
      }).filter(request => request.distance <= radius); // Filter by exact distance

      setHelpRequests(requests);
    });

    return unsubscribe;
  }, [userLocation, radius]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10;
  };

  const handleMarkerPress = (request: HelpRequest) => {
    setSelectedRequest(request);
  };

  const handleHelpPress = () => {
    if (selectedRequest) {
      console.log('Help pressed, selectedRequest:', selectedRequest);
      console.log('Navigating to RequestDetail with requestId:', selectedRequest.id);
      navigation.navigate('RequestDetail', { requestId: selectedRequest.id });
      setSelectedRequest(null);
    }
  };

  const handleMyLocationPress = () => {
    if (userLocation) {
      // Animate to user location
      // You would implement map animation here
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Errands': 'cart-outline',
      'Tutoring': 'school-outline',
      'Tech Support': 'desktop-outline',
      'Pet Care': 'paw-outline',
      'Home Repair': 'hammer-outline',
      'Transportation': 'car-outline',
      'General': 'help-circle-outline',
    };
    return icons[category] || 'help-circle-outline';
  };

  if (!locationPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.permissionTitle}>Location Access Needed</Text>
          <Text style={styles.permissionText}>
            Please enable location services to see nearby help requests on the map.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          userLocation ? {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : undefined
        }
        region={
          userLocation ? {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: radius / 111 * 2, // Dynamic zoom based on radius
            longitudeDelta: radius / (111 * Math.cos(userLocation.coords.latitude * Math.PI / 180)) * 2,
          } : undefined
        }
        onMapReady={() => setMapReady(true)}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={true}
      >
        {/* User location radius circle */}
        {userLocation && (
          <Circle
            center={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            radius={radius * 1000} // Convert km to meters
            strokeColor="rgba(95, 168, 211, 0.3)"
            fillColor="rgba(95, 168, 211, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Help request markers */}
        {helpRequests.map((request) => (
          <Marker
            key={request.id}
            coordinate={{
              latitude: request.latitude,
              longitude: request.longitude,
            }}
            onPress={() => handleMarkerPress(request)}
          >
            <View style={[
              styles.marker,
              selectedRequest?.id === request.id && styles.markerSelected
            ]}>
              <Ionicons 
                name={getCategoryIcon(request.category) as any} 
                size={16} 
                color="#FFFFFF" 
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header Badge */}
      <View style={[styles.badge, { top: 16 + insets.top }]}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={styles.badgeText}>
          {helpRequests.length} requests within {radius}km
        </Text>
      </View>

      {/* Radius Selector */}
      <View style={[styles.radiusSelector, { top: 80 + insets.top }]}>
        <Text style={styles.radiusLabel}>Search Radius: {radius}km</Text>
        <View style={styles.radiusButtons}>
          {[1, 3, 5, 10].map((km) => (
            <TouchableOpacity
              key={km}
              style={[
                styles.radiusButton,
                radius === km && styles.radiusButtonActive
              ]}
              onPress={() => setRadius(km)}
            >
              <Text style={[
                styles.radiusButtonText,
                radius === km && styles.radiusButtonTextActive
              ]}>
                {km}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Request Card */}
      {selectedRequest && (
        <View style={[styles.requestCard, { bottom: 16 }]}>
          <View style={styles.requestHeader}>
            <View style={styles.categoryBadge}>
              <Ionicons 
                name={getCategoryIcon(selectedRequest.category) as any} 
                size={14} 
                color={colors.primary} 
              />
              <Text style={styles.categoryText}>{selectedRequest.category}</Text>
            </View>
            <Text style={styles.distance}>{selectedRequest.distance}km away</Text>
          </View>
          <Text style={styles.requestTitle}>{selectedRequest.title}</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={handleHelpPress}
          >
            <Text style={styles.helpButtonText}>Offer Help</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* My Location Button */}
      <TouchableOpacity 
        style={[styles.myLocationButton, { bottom: selectedRequest ? 140 : 16 }]}
        onPress={handleMyLocationPress}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: colors.text.inverse,
    ...typography.body,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    left: 16,
    backgroundColor: colors.surface.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  badgeText: {
    color: colors.text.primary,
    fontWeight: '600',
    ...typography.caption,
  },
  radiusSelector: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.surface.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 120,
  },
  radiusLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  radiusButtons: {
    flexDirection: 'column',
    gap: 4,
  },
  radiusButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: colors.primary,
  },
  radiusButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: colors.text.inverse,
  },
  marker: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.surface.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerSelected: {
    backgroundColor: colors.success,
    transform: [{ scale: 1.2 }],
  },
  requestCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.surface.card,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  distance: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  requestTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpButtonText: {
    color: colors.text.inverse,
    ...typography.body,
    fontWeight: '600',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.surface.card,
    padding: 12,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});

export default MapScreen;