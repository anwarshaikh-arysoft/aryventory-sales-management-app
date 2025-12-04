// utils/voiceRecording.js
// Works with Expo Go via expo-av
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

let recordingInstance = null;

/**
 * Ask mic permission and configure audio mode for recording.
 */
async function ensureReady() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
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
        if (typeof Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX !== 'undefined') {
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
        } else if (typeof Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS !== 'undefined') {
            audioMode.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS;
        }
        // If neither exists in your version, we simply don't set it (safe default).
    } else {
        if (typeof Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX !== 'undefined') {
            audioMode.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX;
        } else if (typeof Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS !== 'undefined') {
            audioMode.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS;
        }
    }

    await Audio.setAudioModeAsync(audioMode);
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

    // High quality preset (m4a on iOS; m4a/3gp on Android depending on device)
    await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await recording.startAsync();

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
        // If already stopped externally
    }

    const status = await recordingInstance.getStatusAsync().catch(() => ({}));
    const uri = recordingInstance.getURI();

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





