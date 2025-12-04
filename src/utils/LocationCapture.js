import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export async function captureLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Location permission is needed');
    return null;
  }

  try {
    // First, try to get last known position (instant, cached)
    // Accept if it's less than 30 seconds old
    try {
      const lastKnownPosition = await Location.getLastKnownPositionAsync({
        maxAge: 30000, // 30 seconds
        requiredAccuracy: 100, // Accept up to 100m accuracy for cached location
      });
      
      if (lastKnownPosition) {
        console.log('Using cached location (fast)');
        return lastKnownPosition.coords;
      }
    } catch (e) {
      // If last known position fails, continue to getCurrentPositionAsync
      console.log('No cached location available, fetching fresh location...');
    }

    // Configure options for faster location capture
    const locationOptions = {
      // Use balanced accuracy for faster results (instead of highest)
      accuracy: Location.Accuracy.Balanced,
      // Accept cached locations up to 10 seconds old
      maximumAge: 10000,
      // Timeout after 5 seconds (instead of default ~15 seconds)
      timeout: 5000,
      // Don't show user settings dialog
      mayShowUserSettings: false,
      // Enable high accuracy only if needed (for better results)
      enableHighAccuracy: false, // Set to false for faster results
    };

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Location capture timeout'));
      }, 5000); // 5 second timeout
    });

    // Race between location fetch and timeout
    const location = await Promise.race([
      Location.getCurrentPositionAsync(locationOptions),
      timeoutPromise,
    ]);

    console.log('Location captured successfully');
    return location.coords;
  } catch (error) {
    console.error('Location capture error:', error);
    
    // If timeout or error, try one more time with lower accuracy
    try {
      console.log('Retrying with lower accuracy...');
      const fallbackLocation = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          maximumAge: 30000, // Accept up to 30 seconds old
          timeout: 3000, // 3 second timeout for fallback
          enableHighAccuracy: false,
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Fallback timeout')), 3000);
        }),
      ]);
      
      console.log('Fallback location captured');
      return fallbackLocation.coords;
    } catch (fallbackError) {
      console.error('Fallback location capture also failed:', fallbackError);
      Alert.alert('Error', 'Could not fetch location. Please ensure GPS is enabled and try again.');
      return null;
    }
  }
}
