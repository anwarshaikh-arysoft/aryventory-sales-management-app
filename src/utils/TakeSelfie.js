import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function takeSelfie() {
  // Ask for camera permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Camera permission is needed to take a selfie');
    return null;
  }

  // Launch front camera
  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    // allowsEditing: true,
    // aspect: [1, 2],
    quality: 0.4,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
}
