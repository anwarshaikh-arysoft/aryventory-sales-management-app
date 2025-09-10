import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMeeting } from '../context/MeetingContext';

const { width } = Dimensions.get('window');

const MeetingTimerOverlay = () => {
  const navigation = useNavigation();
  const { meetingActive, meetingStartTime, currentLead, isRecordingPaused, pausedTotalMs, pauseStartedAt } = useMeeting();
  const [time, setTime] = useState(0);
  const timerIdRef = useRef(null);
  const startMsRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Format time to HH:MM:SS
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Start Timer
  const startTimer = useCallback((startAt) => {
    if (!startAt) return;
    const startMs = typeof startAt === 'number' ? startAt : new Date(startAt).getTime();
    startMsRef.current = startMs;

    // Clear any previous interval
    if (timerIdRef.current) clearInterval(timerIdRef.current);

    const tick = () => {
      const dynamicPaused = isRecordingPaused && pauseStartedAt ? (Date.now() - pauseStartedAt) : 0;
      const totalPausedMs = (pausedTotalMs || 0) + dynamicPaused;
      const elapsedMs = Date.now() - startMsRef.current - totalPausedMs;
      setTime(Math.max(0, Math.floor(elapsedMs / 1000)));
    };
    tick(); // immediate update
    timerIdRef.current = setInterval(tick, 1000);
  }, [isRecordingPaused, pausedTotalMs, pauseStartedAt]);

  // Pause Timer
  const pauseTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  // Reset Timer
  const resetTimer = useCallback(() => {
    pauseTimer();
    startMsRef.current = null;
    setTime(0);
  }, [pauseTimer]);

  // Effect to handle timer state changes
  useEffect(() => {
    if (meetingActive && meetingStartTime) {
      if (isRecordingPaused) {
        pauseTimer();
      } else {
        startTimer(meetingStartTime);
      }
    } else {
      resetTimer();
    }
  }, [meetingActive, isRecordingPaused, meetingStartTime, startTimer, resetTimer, pauseTimer]);

  // Show/hide overlay animation
  useEffect(() => {
    if (meetingActive) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [meetingActive, slideAnim]);

  // Cleanup on unmount
  useEffect(() => {
    return () => pauseTimer();
  }, [pauseTimer]);

  const handlePress = () => {
    if (currentLead) {
      navigation.navigate('Meeting', { lead: currentLead });
    }
  };

  // Don't show overlay if no meeting is active
  if (!meetingActive || !currentLead) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.overlayContent} onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.meetingInfo}>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName} numberOfLines={1}>
              {currentLead.contact_person}
            </Text>
            <Text style={styles.leadShop} numberOfLines={1}>
              {currentLead.shop_name}
            </Text>
          </View>
          
          <View style={styles.timerSection}>
            <View style={styles.timerContainer}>
              <MaterialIcons 
                name={isRecordingPaused ? "pause" : "fiber-manual-record"} 
                size={16} 
                color={isRecordingPaused ? "#ff9500" : "#f44336"} 
              />
              <Text style={styles.timerText}>{formatTime(time)}</Text>
            </View>
            <Text style={styles.meetingLabel}>Meeting in progress</Text>
          </View>
        </View>
        
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'relative',
    zIndex: 1000,
    backgroundColor: '#98FF98',
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // paddingTop: 50, // Account for status bar
  },
  meetingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadInfo: {
    flex: 1,
    marginRight: 16,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  leadShop: {
    fontSize: 14,
    color: '#000',
  },
  timerSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 6,
    fontFamily: 'monospace',
  },
  meetingLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default MeetingTimerOverlay;
