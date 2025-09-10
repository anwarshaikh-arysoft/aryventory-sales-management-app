// import * as ImagePicker from 'expo-image-picker';
// import { Alert } from 'react-native';
// import * as ImageManipulator from 'expo-image-manipulator';
// import * as FileSystem from 'expo-file-system';

// export async function takeSelfie() {
//   // Ask for camera permission
//   const { status } = await ImagePicker.requestCameraPermissionsAsync();
//   if (status !== 'granted') {
//     Alert.alert('Permission required', 'Camera permission is needed to take a selfie');
//     return null;
//   }

//   // Launch front camera
//   const result = await ImagePicker.launchCameraAsync({
//     cameraType: ImagePicker.CameraType.front,
//     // allowsEditing: true,
//     // aspect: [1, 2],

//     quality: 0.4,
//   });

//   if (!result.canceled) {
//     return result.assets[0].uri;
//   }
//   return null;
// }

// utils/TakeSelfie.js
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

/**
 * takeSelfie()
 * - preserves the original function signature and return type (string URI or null)
 * - compresses + resizes the captured image before returning the URI
 *
 * Notes:
 * - Keeps output as JPEG to avoid server-side mime validation issues
 * - Iteratively reduces quality if file is larger than maxBytes
 */
export async function takeSelfie() {
  try {
    // 1) permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take a selfie');
      return null;
    }

    // 2) capture: use high quality capture then compress
    const captureResult = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: false,
      quality: 0.9, // high capture, we'll compress down later
      exif: false,
      base64: false,
    });

    if (captureResult.cancelled || captureResult.canceled) return null;
    const asset = captureResult.assets ? captureResult.assets[0] : captureResult;
    const originalUri = asset.uri;

    // 3) manipulate: resize + compress
    const maxDimension = 600;           // cap largest side to 900 px
    const maxBytes = 2 * 1024 * 1024;  // 2 MB target maximum
    let compressQuality = 0.8;         // start quality
    const minQuality = 0.4;            // don't go below this automatically

    // choose target width preserving aspect ratio (if asset has dims)
    let targetWidth = maxDimension;
    if (asset.width && asset.height) {
      targetWidth = asset.width >= asset.height ? maxDimension : Math.round((maxDimension * asset.width) / asset.height);
    }

    // Ensure we use JPEG to keep server-side validation unchanged
    const format = ImageManipulator.SaveFormat.JPEG;

    // First resize+compress attempt
    let manipResult = await ImageManipulator.manipulateAsync(
      originalUri,
      [{ resize: { width: targetWidth } }],
      { compress: compressQuality, format }
    );

    // Check size and iteratively recompress if needed
    let info = await FileSystem.getInfoAsync(manipResult.uri, { size: true });
    let fileSize = info.size ?? 0;

    while (fileSize > maxBytes && compressQuality > minQuality) {
      // reduce quality and recompress
      compressQuality = Math.max(minQuality, compressQuality - 0.1);
      manipResult = await ImageManipulator.manipulateAsync(
        manipResult.uri, // re-use the last produced file for faster work
        [], // no more resizing, only recompress
        { compress: compressQuality, format }
      );
      info = await FileSystem.getInfoAsync(manipResult.uri, { size: true });
      fileSize = info.size ?? 0;
      // loop will exit either when size <= maxBytes or quality <= minQuality
    }

    // If it's still too big but at minQuality, we accept the last one (or optionally alert user)
    if (fileSize > maxBytes) {
      // Optional: you can Alert here if you want to force a recapture
      // Alert.alert('Large image', 'Captured image is still large; consider recapturing.');
      // but we'll still return the compressed uri to keep UX simple.
    }

    // Return URI string — same as original function
    return manipResult.uri;
  } catch (err) {
    console.error('takeSelfie error', err);
    Alert.alert('Error', 'Failed to capture selfie. Please try again.');
    return null;
  }
}
