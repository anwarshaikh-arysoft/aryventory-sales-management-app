import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../config';

const MeetingContext = createContext({});

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

export const MeetingProvider = ({ children }) => {
  const [meetingActive, setMeetingActive] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState(null);
  const [currentLead, setCurrentLead] = useState(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [pausedTotalMs, setPausedTotalMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState(null);

  // Check for active meeting on app start
  useEffect(() => {
    checkActiveMeeting();
  }, []);

  const checkActiveMeeting = useCallback(async () => {
    try {
      // Check if there's a stored active meeting in AsyncStorage
      const storedMeeting = await AsyncStorage.getItem('active_meeting');
      if (storedMeeting) {
        const meetingData = JSON.parse(storedMeeting);
        setMeetingActive(true);
        setMeetingStartTime(meetingData.meetingStartTime);
        setCurrentLead(meetingData.currentLead);
        setIsRecordingPaused(meetingData.isRecordingPaused || false);
        setPausedTotalMs(meetingData.pausedTotalMs || 0);
        setPauseStartedAt(meetingData.pauseStartedAt || null);
      } else {
        setMeetingActive(false);
        setMeetingStartTime(null);
        setCurrentLead(null);
        setIsRecordingPaused(false);
        setPausedTotalMs(0);
        setPauseStartedAt(null);
      }
    } catch (err) {
      console.error('Failed to check active meeting:', err);
      // On error, assume no active meeting
      setMeetingActive(false);
      setMeetingStartTime(null);
      setCurrentLead(null);
      setIsRecordingPaused(false);
      setPausedTotalMs(0);
      setPauseStartedAt(null);
    }

  }, []);

  const startMeeting = useCallback(async (lead, startTime) => {
    const meetingData = {
      meetingActive: true,
      meetingStartTime: startTime,
      currentLead: lead,
      isRecordingPaused: false,
      pausedTotalMs: 0,
      pauseStartedAt: null,
    };
    
    setMeetingActive(true);
    setMeetingStartTime(startTime);
    setCurrentLead(lead);
    setIsRecordingPaused(false);
    setPausedTotalMs(0);
    setPauseStartedAt(null);
    
    // Persist meeting state
    try {
      await AsyncStorage.setItem('active_meeting', JSON.stringify(meetingData));
    } catch (err) {
      console.error('Failed to save meeting state:', err);
    }
  }, []);

  const endMeeting = useCallback(async () => {
    setMeetingActive(false);
    setMeetingStartTime(null);
    setCurrentLead(null);
    setIsRecordingPaused(false);
    setPausedTotalMs(0);
    setPauseStartedAt(null);
    
    // Clear persisted meeting state
    try {
      await AsyncStorage.removeItem('active_meeting');
    } catch (err) {
      console.error('Failed to clear meeting state:', err);
    }
  }, []);

  const updateMeetingState = useCallback(async (updates) => {
    if (updates.meetingActive !== undefined) setMeetingActive(updates.meetingActive);
    if (updates.meetingStartTime !== undefined) setMeetingStartTime(updates.meetingStartTime);
    if (updates.currentLead !== undefined) setCurrentLead(updates.currentLead);
    if (updates.isRecordingPaused !== undefined) setIsRecordingPaused(updates.isRecordingPaused);
    if (updates.pausedTotalMs !== undefined) setPausedTotalMs(updates.pausedTotalMs);
    if (updates.pauseStartedAt !== undefined) setPauseStartedAt(updates.pauseStartedAt);
    
    // Persist updated state if meeting is active
    if (updates.meetingActive !== false) {
      try {
        const currentState = {
          meetingActive: updates.meetingActive !== undefined ? updates.meetingActive : meetingActive,
          meetingStartTime: updates.meetingStartTime !== undefined ? updates.meetingStartTime : meetingStartTime,
          currentLead: updates.currentLead !== undefined ? updates.currentLead : currentLead,
          isRecordingPaused: updates.isRecordingPaused !== undefined ? updates.isRecordingPaused : isRecordingPaused,
          pausedTotalMs: updates.pausedTotalMs !== undefined ? updates.pausedTotalMs : pausedTotalMs,
          pauseStartedAt: updates.pauseStartedAt !== undefined ? updates.pauseStartedAt : pauseStartedAt,
        };
        await AsyncStorage.setItem('active_meeting', JSON.stringify(currentState));
      } catch (err) {
        console.error('Failed to update meeting state:', err);
      }
    }
  }, [meetingActive, meetingStartTime, currentLead, isRecordingPaused, pausedTotalMs, pauseStartedAt]);

  const value = {
    meetingActive,
    meetingStartTime,
    currentLead,
    isRecordingPaused,
    pausedTotalMs,
    pauseStartedAt,
    startMeeting,
    endMeeting,
    updateMeetingState,
    checkActiveMeeting,
  };

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};
