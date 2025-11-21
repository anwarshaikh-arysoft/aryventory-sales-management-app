// utils/voiceRecording.js
// Enhanced version with background recording support
// Works with Expo Go via expo-av
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let recordingInstance = null;
let notificationId = null;

/**
 * Setup notification handler for foreground service (Android)
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // If it's a recording notification, keep it persistent
    const isRecording = notification.request.content.data?.type === 'recording';
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldAutoExpire: !isRecording, // Don't auto-expire recording notifications
    };
  },
});

/**
 * Setup notification channel and category for Android
 */
async function setupNotificationChannel() {
    if (Platform.OS !== 'android') return;
    
    try {
        // Setup notification channel
        await Notifications.setNotificationChannelAsync('recording-channel', {
            name: 'Recording',
            importance: Notifications.AndroidImportance.HIGH,
            sound: false,
            vibrationPattern: null,
            enableVibrate: false,
            showBadge: false,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // Setup notification category for tap handling
        await Notifications.setNotificationCategoryAsync('recording', []);
    } catch (error) {
        console.warn('Failed to setup notification channel:', error);
    }
}

/**
 * Ask mic permission and configure audio mode for recording.
 */
async function ensureReady() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
    }

    // Request notification permissions for foreground service
    if (Platform.OS === 'android') {
        await Notifications.requestPermissionsAsync();
        await setupNotificationChannel();
    }

    const audioMode = {
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
    };

    // Set platform-specific interruption modes ONLY if constants exist
    if (Platform.OS === 'ios') {
        // Use DO_NOT_MIX for better background recording on iOS
        if (typeof Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX !== 'undefined') {
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
        } else if (typeof Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS !== 'undefined') {
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS;
        }
        // If neither exists in your version, we simply don't set it (safe default).
    } else {
        // Use DO_NOT_MIX for Android for better background recording
        if (typeof Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX !== 'undefined') {
            audioMode.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX;
        } else if (typeof Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS !== 'undefined') {
            audioMode.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS;
        }
    }

    await Audio.setAudioModeAsync(audioMode);
}

/**
 * Dismiss the recording notification (Android)
 */
export async function dismissRecordingNotification() {
    if (Platform.OS !== 'android') return;
    
    try {
        // Try to dismiss by identifier first (more reliable)
        await Notifications.dismissNotificationAsync('meeting-recording');
        
        // Also try by notification ID if we have it
        if (notificationId) {
            await Notifications.dismissNotificationAsync(notificationId);
        }
        
        notificationId = null;
    } catch (error) {
        console.warn('Failed to dismiss notification:', error);
    }
}

/**
 * Show persistent notification to keep recording active (Android)
 * Only shows if there's an active meeting
 */
async function showRecordingNotification() {
    if (Platform.OS !== 'android') return;
    
    try {
        // Dismiss any existing notification first to avoid duplicates
        await dismissRecordingNotification();
        
        notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Meeting in progress',
                body: 'Tap to return to Arysoft Sales',
                sound: false,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                sticky: true,
                data: {
                    type: 'recording',
                    action: 'open_app',
                },
                categoryIdentifier: 'recording',
            },
            trigger: null, // Show immediately
            identifier: 'meeting-recording',
        });
    } catch (error) {
        console.warn('Failed to show notification:', error);
    }
}

/**
 * Start recording (call this when meeting starts).
 * Safe to call multiple times; will no-op if already recording.
 */
export async function startMeetingRecording() {
    if (recordingInstance) {
        // already recording
        return { started: true };
    }

    await ensureReady();

    const recording = new Audio.Recording();

    // Use high quality preset - it's already optimized for background recording
    await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await recording.startAsync();

    // Show persistent notification for Android to maintain foreground service
    await showRecordingNotification();

    recordingInstance = recording;
    return { started: true };
}

/**
 * Stop recording and return the file URI + duration (ms).
 * Call this when meeting ends.
 */
export async function stopMeetingRecording() {
    if (!recordingInstance) {
        return { uri: null, durationMillis: 0 };
    }

    try {
        await recordingInstance.stopAndUnloadAsync();
    } catch (e) {
        console.warn('Error stopping recording:', e);
    }

    const status = await recordingInstance.getStatusAsync().catch(() => ({}));
    const uri = recordingInstance.getURI();

    // Dismiss notification
    await dismissRecordingNotification();

    // Reset singleton
    recordingInstance = null;

    return { uri, durationMillis: status?.durationMillis ?? 0 };
}

/**
 * Pause recording (call this when meeting is paused).
 */
export async function pauseMeetingRecording() {
    if (!recordingInstance) {
        return { paused: false, durationMillis: 0, reason: 'no-instance' };
    }
    const before = await recordingInstance.getStatusAsync().catch(() => null);
    if (!before?.isRecording) {
        return { paused: true, durationMillis: before?.durationMillis ?? 0 };
    }
    await recordingInstance.pauseAsync();
    const after = await recordingInstance.getStatusAsync().catch(() => null);
    return { paused: !after?.isRecording, durationMillis: after?.durationMillis ?? 0 };
}

/**
 * Resume recording if paused.
 */
export async function resumeMeetingRecording() {
    if (!recordingInstance) {
        return { resumed: false, durationMillis: 0, reason: 'no-instance' };
    }
    const status = await recordingInstance.getStatusAsync().catch(() => null);
    if (status?.isRecording) {
        return { resumed: true, durationMillis: status?.durationMillis ?? 0 };
    }
    await recordingInstance.startAsync();
    const after = await recordingInstance.getStatusAsync().catch(() => null);
    return { resumed: !!after?.isRecording, durationMillis: after?.durationMillis ?? 0 };
}


/**
 * Cancel an ongoing recording without saving (optional helper).
 */
export async function cancelMeetingRecording() {
    if (!recordingInstance) return;
    try {
        await recordingInstance.stopAndUnloadAsync();
    } catch (e) { }
    const uri = recordingInstance.getURI();
    
    // Dismiss notification
    await dismissRecordingNotification();
    
    recordingInstance = null;

    // delete the partial file if any
    if (uri) {
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) { }
    }
}

/**
 * Get current recording status (optional).
 */
export async function getRecordingStatus() {
    if (!recordingInstance) return null;
    try {
        return await recordingInstance.getStatusAsync();
    } catch {
        return null;
    }
}

/**
 * Given a file URI, return a sensible mime + filename you can use in FormData.
 */
export function buildAudioFormPart(uri, fallbackName = 'meeting-audio') {
    if (!uri) return null;

    // Guess extension from uri
    const match = uri.match(/\.(\w+)(\?.*)?$/);
    const ext = match ? match[1].toLowerCase() : 'm4a';

    // Basic mime guessing
    const mimeMap = {
        m4a: 'audio/m4a',
        mp4: 'audio/mp4',
        aac: 'audio/aac',
        caf: 'audio/x-caf',
        wav: 'audio/wav',
        aiff: 'audio/x-aiff',
        aif: 'audio/x-aiff',
        amr: 'audio/amr',
        '3gp': 'audio/3gpp',
        '3gpp': 'audio/3gpp',
        ogg: 'audio/ogg',
    };

    const type = mimeMap[ext] || 'audio/m4a';
    const name = `${fallbackName}.${ext}`;

    return { uri, name, type };
}
