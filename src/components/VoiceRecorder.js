// components/VoiceRecorder.js
import React, { useState, useEffect } from "react";
import { View, Button, Text } from "react-native";
import { Audio } from "expo-audio";

export default function VoiceRecorder({ onCapture }) {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
    })();
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      setRecording(undefined);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      if (onCapture) onCapture(uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  return (
    <View>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />
      {audioUri && <Text>Recorded file: {audioUri}</Text>}
    </View>
  );
}
