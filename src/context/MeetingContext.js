import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../config';
import { dismissRecordingNotification } from '../utils/voiceRecording';

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
      // First, always verify with backend if there's an active meeting
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // No token means user is not logged in, clear everything
        await AsyncStorage.removeItem('active_meeting');
        setMeetingActive(false);
        setMeetingStartTime(null);
        setCurrentLead(null);
        setIsRecordingPaused(false);
        setPausedTotalMs(0);
        setPauseStartedAt(null);
        // Dismiss notification since user is not logged in
        try {
          await dismissRecordingNotification();
        } catch (err) {
          console.error('Failed to dismiss notification:', err);
        }
        return;
      }

      // Check if there's a stored active meeting in AsyncStorage
      const storedMeeting = await AsyncStorage.getItem('active_meeting');
      
      if (storedMeeting) {
        const meetingData = JSON.parse(storedMeeting);
        
        // Validate meeting data structure
        if (!meetingData.meetingActive || !meetingData.meetingStartTime || !meetingData.currentLead) {
          console.log('Invalid meeting data structure, clearing...');
          await AsyncStorage.removeItem('active_meeting');
          setMeetingActive(false);
          setMeetingStartTime(null);
          setCurrentLead(null);
          setIsRecordingPaused(false);
          setPausedTotalMs(0);
          setPauseStartedAt(null);
          // Dismiss notification since meeting data is invalid
          try {
            await dismissRecordingNotification();
          } catch (err) {
            console.error('Failed to dismiss notification:', err);
          }
          return;
        }

        // Check if meeting start time is valid and not too old (more than 24 hours = stale)
        const startTime = new Date(meetingData.meetingStartTime);
        const now = new Date();
        const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);
        
        if (isNaN(startTime.getTime()) || hoursSinceStart > 24) {
          console.log('Meeting data is stale (older than 24 hours) or invalid, clearing...');
          await AsyncStorage.removeItem('active_meeting');
          setMeetingActive(false);
          setMeetingStartTime(null);
          setCurrentLead(null);
          setIsRecordingPaused(false);
          setPausedTotalMs(0);
          setPauseStartedAt(null);
          // Dismiss notification since meeting is stale
          try {
            await dismissRecordingNotification();
          } catch (err) {
            console.error('Failed to dismiss notification:', err);
          }
          return;
        }

        // Verify with backend if meeting is actually still active
        try {
          const lead_id = meetingData.currentLead?.id;
          if (lead_id) {
            const res = await axios.post(
              `${BASE_URL}/meetings/check/status`,
              { lead_id },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
                timeout: 10000,
              }
            );

            const data = res.data;
            
            // If backend says no active meeting, clear local storage and dismiss notification
            if (!data.exists || !data.data?.meeting_start_time) {
              console.log('Backend confirms no active meeting, clearing local storage...');
              await AsyncStorage.removeItem('active_meeting');
              setMeetingActive(false);
              setMeetingStartTime(null);
              setCurrentLead(null);
              setIsRecordingPaused(false);
              setPausedTotalMs(0);
              setPauseStartedAt(null);
              // Dismiss notification since meeting is not active
              try {
                await dismissRecordingNotification();
              } catch (err) {
                console.error('Failed to dismiss notification:', err);
              }
              return;
            }

            // Backend confirms meeting is active, restore state
            setMeetingActive(true);
            setMeetingStartTime(data.data.meeting_start_time || meetingData.meetingStartTime);
            setCurrentLead(meetingData.currentLead);
            setIsRecordingPaused(meetingData.isRecordingPaused || false);
            setPausedTotalMs(meetingData.pausedTotalMs || 0);
            setPauseStartedAt(meetingData.pauseStartedAt || null);
          } else {
            // No lead_id, clear the meeting
            console.log('No lead_id found in stored meeting, clearing...');
            await AsyncStorage.removeItem('active_meeting');
            setMeetingActive(false);
            setMeetingStartTime(null);
            setCurrentLead(null);
            setIsRecordingPaused(false);
            setPausedTotalMs(0);
            setPauseStartedAt(null);
            // Dismiss notification since no lead_id
            try {
              await dismissRecordingNotification();
            } catch (err) {
              console.error('Failed to dismiss notification:', err);
            }
          }
        } catch (apiErr) {
          // If API call fails, be conservative and clear the meeting
          // This prevents showing stale meeting data
          console.error('Failed to verify meeting with backend, clearing local storage:', apiErr);
          await AsyncStorage.removeItem('active_meeting');
          setMeetingActive(false);
          setMeetingStartTime(null);
          setCurrentLead(null);
          setIsRecordingPaused(false);
          setPausedTotalMs(0);
          setPauseStartedAt(null);
          // Dismiss notification since we can't verify meeting is active
          try {
            await dismissRecordingNotification();
          } catch (err) {
            console.error('Failed to dismiss notification:', err);
          }
        }
      } else {
        // No stored meeting, ensure state is cleared
        setMeetingActive(false);
        setMeetingStartTime(null);
        setCurrentLead(null);
        setIsRecordingPaused(false);
        setPausedTotalMs(0);
        setPauseStartedAt(null);
      }
    } catch (err) {
      console.error('Failed to check active meeting:', err);
      // On error, clear any potentially corrupted data and assume no active meeting
      try {
        await AsyncStorage.removeItem('active_meeting');
      } catch (clearErr) {
        console.error('Failed to clear corrupted meeting data:', clearErr);
      }
      setMeetingActive(false);
      setMeetingStartTime(null);
      setCurrentLead(null);
      setIsRecordingPaused(false);
      setPausedTotalMs(0);
      setPauseStartedAt(null);
      // Dismiss notification on error
      try {
        await dismissRecordingNotification();
      } catch (err) {
        console.error('Failed to dismiss notification:', err);
      }
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
    
    // Dismiss the notification when meeting ends
    try {
      await dismissRecordingNotification();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
    
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
    
    // If meeting is being set to inactive, clear AsyncStorage and dismiss notification
    if (updates.meetingActive === false) {
      try {
        await AsyncStorage.removeItem('active_meeting');
        // Dismiss the notification when meeting becomes inactive
        await dismissRecordingNotification();
      } catch (err) {
        console.error('Failed to clear meeting state:', err);
      }
    } 
    // Persist updated state if meeting is active
    else if (updates.meetingActive !== false) {
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


  // console.log(pauseStartedAt, "pauseStartedAt")


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
