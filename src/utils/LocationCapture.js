import * as Location from 'expo-location';
import { Alert } from 'react-native';

export async function captureLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Location permission is needed');
    return null;
  }

  try {
    const location = await Location.getCurrentPositionAsync({});
    console.log('location', location);
    return location.coords;
  } catch {
    Alert.alert('Error', 'Could not fetch location');
    return null;
  }
}
