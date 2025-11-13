import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
  Image,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getLeadsByFollowUpDate } from '../../utils/getLeadsByFollowUpDate';
import { ArrowRight, Icon, Camera } from 'lucide-react-native';
import { takeSelfie } from '../../utils/TakeSelfie';
import { startMeetingRecording, stopMeetingRecording, pauseMeetingRecording, resumeMeetingRecording, buildAudioFormPart, getRecordingStatus } from '../../utils/voiceRecording';
import { captureLocation } from '../../utils/LocationCapture';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../config';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMeeting } from '../../context/MeetingContext';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

// Memoized Timer Component
const MeetingTimer = memo(({ startTime, isActive, isPaused, pausedTotalMs = 0, pauseStartedAt = null }) => {
  const [time, setTime] = useState(0);
  const timerIdRef = useRef(null);
  const startMsRef = useRef(null);

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
      const dynamicPaused = isPaused && pauseStartedAt ? (Date.now() - pauseStartedAt) : 0;
      const totalPausedMs = (pausedTotalMs || 0) + dynamicPaused;
      const elapsedMs = Date.now() - startMsRef.current - totalPausedMs;
      setTime(Math.max(0, Math.floor(elapsedMs / 1000)));
    };
    tick(); // immediate update
    timerIdRef.current = setInterval(tick, 1000);
  }, [isPaused, pausedTotalMs, pauseStartedAt]);

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
    if (isActive && startTime) {
      if (isPaused) {
        pauseTimer();
      } else {
        startTimer(startTime);
      }
    } else {
      resetTimer();
    }
  }, [isActive, isPaused, startTime, startTimer, resetTimer, pauseTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => pauseTimer();
  }, [pauseTimer]);

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, marginTop: 20 }}>
      <Text style={styles.timerDisplay}>{formatTime(time)}</Text>
    </View>
  );
});

// Memoized Status Selector Component
const StatusSelector = memo(({ 
  selectedStatus, 
  onStatusSelect, 
  meetingOutcomeOptions, 
  statusModalVisible, 
  setStatusModalVisible 
}) => {
  const openStatusModal = useCallback(() => setStatusModalVisible(true), [setStatusModalVisible]);
  const closeStatusModal = useCallback(() => setStatusModalVisible(false), [setStatusModalVisible]);

  const onPickStatus = useCallback((status) => {
    onStatusSelect(status);
    setStatusModalVisible(false);
  }, [onStatusSelect, setStatusModalVisible]);

  return (
    <>
      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>Meeting Outcome</Text>
        <TouchableOpacity style={styles.dropdown} onPress={openStatusModal}>
          <Text style={styles.dropdownText}>{selectedStatus?.name || 'Select Outcome'}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Status Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={closeStatusModal}
      >
        <View style={styles.leadModalOverlay}>
          <View style={styles.leadModalContent}>
            <Text style={styles.leadTitle}>Select Status</Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              {meetingOutcomeOptions && meetingOutcomeOptions.map((status) => {
                const isSelected = selectedStatus?.id === status.id;
                return (
                  <TouchableOpacity
                    key={status.id}
                    onPress={() => onPickStatus(status)}
                  >
                    <View style={[
                      styles.scheduleItem,
                      { alignItems: 'center', paddingVertical: 12 }
                    ]}>
                      <Text style={[styles.scheduleName, { flex: 1 }]}>
                        {status?.name}
                      </Text>
                      <View style={[
                        {
                          width: 22, height: 22, borderRadius: 11,
                          borderWidth: 2, borderColor: isSelected ? '#4CAF50' : '#bbb',
                          alignItems: 'center', justifyContent: 'center',
                        }
                      ]}>
                        {isSelected ? (
                          <View style={{
                            width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50'
                          }} />
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.stopButton]}
              onPress={closeStatusModal}
            >
              <Text style={styles.stopButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

// Memoized Plan Selector Component
const PlanSelector = memo(({ 
  selectedPlan, 
  onPlanSelect, 
  plansOptions, 
  planModalVisible, 
  setPlanModalVisible 
}) => {
  const openPlanModal = useCallback(() => setPlanModalVisible(true), [setPlanModalVisible]);
  const closePlanModal = useCallback(() => setPlanModalVisible(false), [setPlanModalVisible]);

  const onPickPlan = useCallback((plan) => {
    onPlanSelect(plan);
    setPlanModalVisible(false);
  }, [onPlanSelect, setPlanModalVisible]);

  return (
    <>
      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>Plan interested in</Text>
        <TouchableOpacity style={styles.dropdown} onPress={openPlanModal}>
          <Text style={styles.dropdownText}>{selectedPlan?.name || 'Select Plan'}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Plan Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={planModalVisible}
        onRequestClose={closePlanModal}
      >
        <View style={styles.leadModalOverlay}>
          <View style={styles.leadModalContent}>
            <Text style={styles.leadTitle}>Select Plan</Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              { plansOptions && plansOptions.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => onPickPlan(plan)}
                  >
                    <View style={[
                      styles.scheduleItem,
                      { alignItems: 'center', paddingVertical: 12 }
                    ]}>
                      <Text style={[styles.scheduleName, { flex: 1 }]}>
                        {plan?.name}
                      </Text>
                      <View style={[
                        {
                          width: 22, height: 22, borderRadius: 11,
                          borderWidth: 2, borderColor: isSelected ? '#4CAF50' : '#bbb',
                          alignItems: 'center', justifyContent: 'center',
                        }
                      ]}>
                        {isSelected ? (
                          <View style={{
                            width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50'
                          }} />
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.stopButton]}
              onPress={closePlanModal}
            >
              <Text style={styles.stopButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

// Memoized Date Picker Component
const DatePickerComponent = memo(({ 
  nextFollowUpDate, 
  onDateChange, 
  showDatePicker, 
  setShowDatePicker 
}) => {
  const defaultDate = useRef(new Date());

  const onChangeDate = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  }, [onDateChange, setShowDatePicker]);

  const openDatePicker = useCallback(() => {
    setShowDatePicker(true);
  }, [setShowDatePicker]);

  return (
    <View style={{ marginVertical: 20 }}>
      <Text style={styles.sectionTitle}>Next Follow Up Date</Text>
      <TouchableOpacity style={styles.dropdown} onPress={openDatePicker}>
        <Text style={{ color: nextFollowUpDate ? "#000" : "#999" }}>
          {nextFollowUpDate?.toISOString().split("T")[0] || "Select a date"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={nextFollowUpDate || defaultDate.current}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
        />
      )}
    </View>
  );
});

const MeetingTimerScreen = ({ navigation }) => {
  // Meeting Context
  const { 
    meetingActive, 
    meetingStartTime, 
    currentLead, 
    isRecordingPaused, 
    pausedTotalMs, 
    pauseStartedAt,
    startMeeting,
    endMeeting,
    updateMeetingState
  } = useMeeting();

  // Local States
  const [loadingAction, setLoadingAction] = useState(null);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Meeting Outcome
  const [meetingOutcome, setMeetingOutcome] = useState(null);
  const [meetingOutcomeOptions, setMeetingOutcomeOptions] = useState([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Plans State
  const [plansOptions, setPlansOptions] = useState([]);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Meeting Controls
  const [notes, setNotes] = useState('');
  const [recordingUri, setRecordingUri] = useState(null);
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Leads
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Navigation
  const route = useRoute();

  // Battery Optimization Check (for problematic Android devices)
  const checkAndRequestBatteryOptimization = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    
    // Check if we've already shown this prompt
    const hasShown = await AsyncStorage.getItem('battery_optimization_prompted');
    if (hasShown) return true;
    
    try {
      const pkg = 'com.anwar.squarebiz.snackadf3a45a30e344f0acc59f65f9f82009';
      
      return new Promise((resolve) => {
        Alert.alert(
          'Battery Optimization',
          'For reliable background processing, please disable battery optimization for this app.',
          [
            {
              text: 'Open Settings',
              onPress: async () => {
                try {
                  // Mark as shown
                  await AsyncStorage.setItem('battery_optimization_prompted', 'true');
                  
                  // Try to open battery optimization settings
                  await IntentLauncher.startActivityAsync(
                    IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    {
                      data: 'package:' + pkg,
                    }
                  );
                  resolve(true);
                } catch (e) {
                  console.warn('Could not open battery settings:', e);
                  // Fallback to general app settings
                  try {
                    await Linking.openSettings();
                  } catch (err) {
                    console.warn('Could not open settings:', err);
                  }
                  resolve(true);
                }
              },
            },
            {
              text: 'Skip',
              style: 'cancel',
              onPress: async () => {
                await AsyncStorage.setItem('battery_optimization_prompted', 'true');
                resolve(true);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.warn('Battery optimization check failed:', error);
      return true;
    }
  }, []);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleStatusSelect = useCallback((status) => {
    setSelectedStatus(status);
    if (selectedLead?.id) {
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        const prev = s ? JSON.parse(s) : {};
        const next = { ...prev, selectedStatus: status };
        AsyncStorage.setItem(draftKey, JSON.stringify(next)).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedLead?.id]);

  const handlePlanSelect = useCallback((plan) => {
    setSelectedPlan(plan);
    if (selectedLead?.id) {
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        const prev = s ? JSON.parse(s) : {};
        const next = { ...prev, selectedPlan: plan };
        AsyncStorage.setItem(draftKey, JSON.stringify(next)).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedLead?.id]);

  const handleDateChange = useCallback((date) => {
    setNextFollowUpDate(date);
    if (selectedLead?.id) {
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        const prev = s ? JSON.parse(s) : {};
        const next = { ...prev, nextFollowUpDate: date?.toISOString() || null };
        AsyncStorage.setItem(draftKey, JSON.stringify(next)).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedLead?.id]);

  const handleNotesChange = useCallback((text) => {
    setNotes(text);
    if (selectedLead?.id) {
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        const prev = s ? JSON.parse(s) : {};
        const next = { ...prev, notes: text };
        AsyncStorage.setItem(draftKey, JSON.stringify(next)).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedLead?.id]);

  const handleContactPersonChange = useCallback((text) => {
    setContactPerson(text);
    if (selectedLead?.id) {
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        const prev = s ? JSON.parse(s) : {};
        const next = { ...prev, contactPerson: text };
        AsyncStorage.setItem(draftKey, JSON.stringify(next)).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedLead?.id]);

  const handleMobileNumberChange = useCallback((text) => {
    setMobileNumber(text);
    if (selectedLead?.id) {
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        const prev = s ? JSON.parse(s) : {};
        const next = { ...prev, mobileNumber: text };
        AsyncStorage.setItem(draftKey, JSON.stringify(next)).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedLead?.id]);

  // Fetch meeting outcomes
  const fetchMeetingOutcomes = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Error', 'No token found');

      const res = await axios.get(`${BASE_URL}/lead-statuses/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMeetingOutcomeOptions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch meeting outcomes', err);
    }
  }, []);

  // Fetch plan outcomes
  const fetchPlanOutcomes = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Error', 'No token found');

      const res = await axios.get(`${BASE_URL}/plans/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlansOptions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch plan outcomes', err);
    }
  }, []);

  // Fetch leads for dropdown
  const fetchLeads = useCallback(async (page = 1) => {
    setLoadingLeads(true);
    try {
      const data = await getLeadsByFollowUpDate(page);
      setLeads(data.leads.data);
      setPagination({
        current_page: data.leads.current_page,
        last_page: data.leads.last_page,
      });
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  // Send meeting actions
  const sendMeetingAction = useCallback(async (endpoint, actionKey) => {
    console.log('Sending meeting action:', endpoint, actionKey);
    setLoadingAction(true);

    let selfieImage = null;
    let locationCoords = null;

    try {
      if (endpoint === '/meetings/start' || endpoint === '/meetings/end') {

        // console.log('Sending selfie image...');
        // const sendSelfieImageStartTime = Date.now();
        // selfieImage = await takeSelfie();
        // // Track time taken to send selfie image
        // const sendSelfieImageEndTime = Date.now();
        // console.log('Time taken to send selfie image:', (sendSelfieImageEndTime - sendSelfieImageStartTime) / 1000, 'seconds');


        // capture location
        console.log('Capturing location...');
        // Track time taken to capture location
        const captureLocationStartTime = Date.now();
        locationCoords = await captureLocation();
        // Track time taken to capture location
        const captureLocationEndTime = Date.now();
        console.log('Time taken to capture location:', (captureLocationEndTime - captureLocationStartTime) / 1000, 'seconds');

        if (!locationCoords) {
          Alert.alert("Error", "Please capture location.");
          return;
        }

        // if (!selfieImage) {
        //   Alert.alert("Error", "Please capture selfie.");
        //   return;
        // }

        if (endpoint === '/meetings/start') {
          // Check battery optimization on first meeting start
          await checkAndRequestBatteryOptimization();
          
          try {
            await startMeetingRecording();
            // Keep device awake during recording
            await activateKeepAwakeAsync();
            console.log('Keep-awake activated for recording');
          } catch (e) {
            Alert.alert('101 Error', e.message || 'Unable to start 101');
            return;
          }
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert('Error', 'No token found');

        const formData = new FormData();
        formData.append('lead_id', selectedLead.id);
        // formData.append('selfie', { uri: selfieImage, type: 'image/jpeg', name: 'selfie.jpg' });
        formData.append('latitude', locationCoords.latitude);
        formData.append('longitude', locationCoords.longitude);

        if (nextFollowUpDate) {
          formData.append(
            'next_follow_up_date',
            nextFollowUpDate.toISOString().split("T")[0]
          );
        }



        if (endpoint === '/meetings/end') {
          const statusId = selectedStatus?.id;

          // Check if status is selected
          if (!statusId) {
            Alert.alert('Select Status', 'Please select a meeting outcome/status.');
            setLoadingAction(false);
            fetchMeetingStatus();
            return;
          }

          // Check if status is Sold and plan is not selected
          if (selectedStatus.name === 'Sold' && !selectedPlan) {
            Alert.alert('Select Plan', 'Please select a plan.');
            setLoadingAction(false);
            fetchMeetingStatus();
            return;
          }

          // Add status id to form data
          formData.append('lead_status_id', String(statusId));

          // Stop recording and deactivate keep-awake
          const { uri } = await stopMeetingRecording();
          deactivateKeepAwake();
          console.log('Keep-awake deactivated after recording stopped');
          setRecordingUri(uri);

          // Build audio part
          const audioPart = buildAudioFormPart(uri, 'meeting');
          if (audioPart) {
            formData.append('recording', audioPart);
          }

          // if selectedPlan then add it to the form else add empty string
          if (selectedPlan) formData.append('plan_interest', selectedPlan.name); else formData.append('plan_interest', '');
          
          // if recordingUri then add it to the form else add empty string
          if (recordingUri) formData.append('recording', { uri: recordingUri, type: 'audio/m4a', name: 'meeting.m4a' });
          
          // if notes then add it to the form else add empty string
          if (notes) {formData.append('notes', notes)} else {formData.append('notes', '')}
          
          // if contactPerson then add it to the form else add empty string
          if (contactPerson) {formData.append('contact_person', contactPerson)} else {formData.append('contact_person', '')}
          
          // if mobileNumber then add it to the form else add empty string
          if (mobileNumber) {formData.append('mobile_number', mobileNumber)} else {formData.append('mobile_number', '')}

          // Clear persisted draft on successful end
          try { await AsyncStorage.removeItem(`meeting_draft_${selectedLead.id}`); } catch {}
          
          // Update context state          
          updateMeetingState({            
            pausedTotalMs: 0,
            pauseStartedAt: null,
            isRecordingPaused: false,
          });

        }

        console.log('Sending meeting action...');
        const sendMeetingActionStartTime = Date.now();

        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        Alert.alert('Success', res.data.message);
        const sendMeetingActionEndTime = Date.now();
        console.log('Time taken to send meeting action:', (sendMeetingActionEndTime - sendMeetingActionStartTime) / 1000, 'seconds');

        if (res.status === 200) {          
          fetchMeetingStatus();                  
        }
        
        // Update context based on action
        if (endpoint === '/meetings/start') {
          startMeeting(selectedLead, new Date().toISOString());          
        } else if (endpoint === '/meetings/end') {
          endMeeting();
          navigation.navigate('Home');
        }
      }

    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
      // If error occurred during start, make sure to deactivate keep-awake
      if (endpoint === '/meetings/start') {
        deactivateKeepAwake();
      }
    } finally {
      setLoadingAction(null);
    }
  }, [selectedLead, nextFollowUpDate, selectedStatus, selectedPlan, recordingUri, notes, contactPerson, mobileNumber, startMeeting, endMeeting, updateMeetingState, checkAndRequestBatteryOptimization]);

  // Fetch meeting status
  const fetchMeetingStatus = useCallback(async () => {
    console.log('Fetching meeting status...');
    // Track time taken to fetch meeting status
    const startTime = Date.now();

    setLoadingAction(true);
    try {      
      const lead_id = currentLead?.id;
      console.log('Lead ID:', lead_id);
      const token = await AsyncStorage.getItem('token');

      const res = await axios.post(
        `${BASE_URL}/meetings/check/status`,
        { lead_id },        
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          timeout: 15000,
        }
      );

      const data = res.data;

      if (data.exists && data.data?.meeting_start_time) {
        // Update context with meeting status
        updateMeetingState({
          meetingActive: true,
          meetingStartTime: data.data.meeting_start_time,
          currentLead: currentLead,
        });
      } else {
        // Update context to clear meeting status
        updateMeetingState({
          meetingActive: false,
          meetingStartTime: null,
          currentLead: null,
        });
      }

      // Also sync local recording paused state if there is an ongoing recording
      const status = await getRecordingStatus();
      if (status) {
        updateMeetingState({
          isRecordingPaused: !status.isRecording,
        });
      } else {
        updateMeetingState({
          isRecordingPaused: false,
        });
      }
    } catch (err) {
      console.error('Meeting status error:', err);
    } finally {
      setLoadingAction(false);
    }

    // Track time taken to fetch meeting status in seconds 
    const endTime = Date.now();
    console.log('Time taken to fetch meeting status:', (endTime - startTime) / 1000, 'seconds');
  }, [currentLead?.id, updateMeetingState]);

  const onPauseRecording = useCallback(async () => {
    const res = await pauseMeetingRecording();
    if (res?.paused !== undefined) {
      // mark paused state and start accumulating paused duration
      updateMeetingState({
        isRecordingPaused: !!res.paused,
        pauseStartedAt: Date.now(),
      });
      // persist draft state
      if (selectedLead?.id) {
        const draft = {
          selectedStatus,
          selectedPlan,
          notes,
          contactPerson,
          mobileNumber,
          nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
          isRecordingPaused: true,
          pausedTotalMs,
          pauseStartedAt: Date.now(),
        };
        try { await AsyncStorage.setItem(`meeting_draft_${selectedLead.id}`, JSON.stringify(draft)); } catch {}
      }
    }
  }, [selectedLead?.id, selectedStatus, selectedPlan, notes, contactPerson, mobileNumber, nextFollowUpDate, pausedTotalMs, updateMeetingState]);

  const onResumeRecording = useCallback(async () => {
    const res = await resumeMeetingRecording();
    if (res?.resumed !== undefined) {
      // add the last pause segment to total and clear start
      const newPausedTotalMs = pauseStartedAt ? pausedTotalMs + (Date.now() - pauseStartedAt) : pausedTotalMs;
      
      updateMeetingState({
        pausedTotalMs: newPausedTotalMs,
        pauseStartedAt: null,
        isRecordingPaused: !res.resumed ? true : false,
      });
      
      // persist draft state
      if (selectedLead?.id) {
        const draft = {
          selectedStatus,
          selectedPlan,
          notes,
          contactPerson,
          mobileNumber,
          nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
          isRecordingPaused: false,
          pausedTotalMs: newPausedTotalMs,
          pauseStartedAt: null,
        };
        try { await AsyncStorage.setItem(`meeting_draft_${selectedLead.id}`, JSON.stringify(draft)); } catch {}
      }
    }
  }, [selectedLead?.id, selectedStatus, selectedPlan, notes, contactPerson, mobileNumber, nextFollowUpDate, pausedTotalMs, pauseStartedAt, updateMeetingState]);

  // Effects
  useEffect(() => {
    fetchMeetingOutcomes();
    fetchPlanOutcomes();
  }, [fetchMeetingOutcomes, fetchPlanOutcomes]);

  useEffect(() => {
    if (route.params && route.params.lead) {
      setSelectedLead(route.params.lead);
      // Only update context if this is a different lead
      if (!currentLead || currentLead.id !== route.params.lead.id) {
        updateMeetingState({ currentLead: route.params.lead });
      }
    }
  }, [route.params]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (currentLead) {
      // Only fetch meeting status if we don't already have meeting data
      // if (!meetingActive) {
      //   fetchMeetingStatus();
      // }
      fetchMeetingStatus();
      // restore draft per lead
      const draftKey = `meeting_draft_${currentLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        if (!s) return;
        try {
          const draft = JSON.parse(s);
          if (draft.selectedStatus) setSelectedStatus(draft.selectedStatus);
          if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan);
          if (typeof draft.notes === 'string') setNotes(draft.notes);
          if (typeof draft.contactPerson === 'string') setContactPerson(draft.contactPerson);
          if (typeof draft.mobileNumber === 'string') setMobileNumber(draft.mobileNumber);
          if (draft.nextFollowUpDate) setNextFollowUpDate(new Date(draft.nextFollowUpDate));
          if (typeof draft.isRecordingPaused === 'boolean') {
            updateMeetingState({ isRecordingPaused: draft.isRecordingPaused });
          }
          if (typeof draft.pausedTotalMs === 'number') {
            updateMeetingState({ pausedTotalMs: draft.pausedTotalMs });
          }
          if (draft.pauseStartedAt) {
            updateMeetingState({ pauseStartedAt: draft.pauseStartedAt });
          }
        } catch {}
      }).catch(() => {});
    }
  }, [currentLead?.id, fetchMeetingStatus, updateMeetingState, meetingActive]);

  // Also restore draft on screen focus (covers cases where component isn't unmounted)
  useFocusEffect(
    useCallback(() => {
      if (!currentLead?.id) return;
      let cancelled = false;
      const draftKey = `meeting_draft_${currentLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        if (cancelled || !s) return;
        try {
          const draft = JSON.parse(s);
          if (draft.selectedStatus) setSelectedStatus(draft.selectedStatus);
          if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan);
          if (typeof draft.notes === 'string') setNotes(draft.notes);
          if (typeof draft.contactPerson === 'string') setContactPerson(draft.contactPerson);
          if (typeof draft.mobileNumber === 'string') setMobileNumber(draft.mobileNumber);
          if (draft.nextFollowUpDate) setNextFollowUpDate(new Date(draft.nextFollowUpDate));
          if (typeof draft.isRecordingPaused === 'boolean') {
            updateMeetingState({ isRecordingPaused: draft.isRecordingPaused });
          }
          if (typeof draft.pausedTotalMs === 'number') {
            updateMeetingState({ pausedTotalMs: draft.pausedTotalMs });
          }
          if (draft.pauseStartedAt) {
            updateMeetingState({ pauseStartedAt: draft.pauseStartedAt });
          }
        } catch {}
      }).catch(() => {});
      return () => { cancelled = true; };
    }, [currentLead?.id, updateMeetingState])
  );

  // Sync selectedLead with currentLead when meeting is active
  useEffect(() => {
    if (meetingActive && currentLead && (!selectedLead || selectedLead.id !== currentLead.id)) {
      setSelectedLead(currentLead);
    }
  }, [meetingActive, currentLead]);

  // Handle notification taps to bring app to foreground
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      // If it's a recording notification tap, just ensure we're on the Meeting screen
      if (data?.type === 'recording' && data?.action === 'open_app') {
        // The app is already being brought to foreground by default
        // No need to stop recording - that's the whole point!
        console.log('Recording notification tapped - app brought to foreground');
      }
    });

    return () => subscription.remove();
  }, []);

  // Cleanup: Deactivate keep-awake when component unmounts
  useEffect(() => {
    return () => {
      // Make sure to deactivate keep-awake if user navigates away
      deactivateKeepAwake();
      console.log('Component unmounted - keep-awake deactivated');
    };
  }, []);

  // Memoized components to prevent unnecessary renders
  const leadSelector = useMemo(() => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Meeting</Text>
      <TouchableOpacity 
        style={[styles.dropdown, meetingActive && styles.dropdownDisabled]} 
        onPress={() => {
          if (!meetingActive) {
            setModalVisible(true);
          }
        }}
        disabled={meetingActive}
      >        
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {selectedLead ? (
            <>
              <Text style={[styles.dropdownText, meetingActive && styles.dropdownTextDisabled]}>
                {selectedLead.contact_person} 
              </Text>
              <ArrowRight size={18} color={meetingActive ? "#999" : "#666"} />
              <Text style={[styles.dropdownText, meetingActive && styles.dropdownTextDisabled]}>
                {" "}{selectedLead.shop_name}
              </Text>
            </>
          ) : (
            <Text style={[styles.dropdownText, meetingActive && styles.dropdownTextDisabled]}>
              Choose from today's schedule
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={meetingActive ? "#999" : "#666"} />
      </TouchableOpacity>      
    </View>
  ), [selectedLead, meetingActive]);

  const meetingInfo = useMemo(() => {
    
    return (
      <View style={styles.meetingInfo}>
        <View style={styles.meetingHeader}>
          <View>
            <Text style={styles.meetingName}>{currentLead?.contact_person}</Text>
            <Text style={styles.meetingLocation}>At {currentLead?.shop_name}</Text>
          </View>
          <View style={styles.recordingControls}>
            {isRecordingPaused ? (
              <TouchableOpacity style={styles.recordButton} onPress={onResumeRecording}>
                <MaterialIcons name="play-arrow" size={16} color="#4CAF50" />
                <Text style={styles.recordText}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.recordButton} onPress={onPauseRecording}>
                <MaterialIcons name="pause" size={16} color="#ff9500" />
                <Text style={styles.recordText}>Pause</Text>        
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  }, [currentLead?.contact_person, currentLead?.shop_name, isRecordingPaused, onPauseRecording, onResumeRecording]);

  return (
    <SafeAreaView style={styles.container}>

      {leadSelector}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {/* Meeting Controls */}
            {selectedLead?.id ? (
              <View style={styles.meetingControls}>
                {loadingAction ? (
                  <TouchableOpacity style={[styles.meetingControlButton, styles.loadingButton]}>                  
                    <Text style={styles.meetingControlButtonText}>Loading...</Text>
                    <MaterialIcons name="hourglass-empty" size={24} color="#fff" />
                  </TouchableOpacity>
                ) : loadingAction === false && meetingActive ? (
                  <View style={{ flex: 1 }}>
                    {meetingInfo}
                    
                    {/* Timer Component - Isolated to prevent re-renders */}
                    <MeetingTimer 
                      startTime={meetingStartTime} 
                      isActive={meetingActive}
                      isPaused={isRecordingPaused}
                      pausedTotalMs={pausedTotalMs}
                      pauseStartedAt={pauseStartedAt}
                    />

                    {/* Status Selector */}
                    <StatusSelector
                      selectedStatus={selectedStatus}
                      onStatusSelect={handleStatusSelect}
                      meetingOutcomeOptions={meetingOutcomeOptions}
                      statusModalVisible={statusModalVisible}
                      setStatusModalVisible={setStatusModalVisible}
                    />

                    {/* Plan Selector */}
                    <PlanSelector
                      selectedPlan={selectedPlan}
                      onPlanSelect={handlePlanSelect}
                      plansOptions={plansOptions}
                      planModalVisible={planModalVisible}
                      setPlanModalVisible={setPlanModalVisible}
                    />

                    {/* Meeting Notes */}
                    <View style={styles.notesSection}>
                      <Text style={styles.sectionTitle}>Meeting Notes</Text>
                      <TextInput
                        style={styles.notesInput}
                        placeholder="Add Notes during the meeting..."
                        placeholderTextColor="#999"
                        multiline
                        value={notes}
                        onChangeText={handleNotesChange}
                      />
                    </View>

                    {/* Contact Person */}
                    <View style={styles.notesSection}>
                      <Text style={styles.sectionTitle}>Contact Person</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter contact person name..."
                        placeholderTextColor="#999"
                        value={selectedLead?.contact_person || contactPerson}
                        onChangeText={handleContactPersonChange}
                      />
                    </View>

                    {/* Mobile Number */}
                    <View style={styles.notesSection}>
                      <Text style={styles.sectionTitle}>Mobile Number</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter mobile number..."
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={selectedLead?.mobile_number || mobileNumber}
                        onChangeText={handleMobileNumberChange}
                      />
                    </View>

                    {/* Date Picker - Only show if not "Sold" */}
                    {selectedStatus?.name !== 'Sold' && (
                      <DatePickerComponent
                        nextFollowUpDate={nextFollowUpDate}
                        onDateChange={handleDateChange}
                        showDatePicker={showDatePicker}
                        setShowDatePicker={setShowDatePicker}
                      />
                    )}

                    <TouchableOpacity
                      style={[styles.meetingControlButton, styles.meetingControlButtonStop, { marginBottom: 20 }]}
                      onPress={() => sendMeetingAction('/meetings/end', 'end')}
                    >
                      <Text style={styles.meetingControlButtonText}>Stop Meeting</Text>
                      <MaterialIcons name="stop" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.meetingControlButton, styles.meetingControlButtonStart]}
                    onPress={() => sendMeetingAction('/meetings/start', 'start')}
                  >
                    <Text style={styles.meetingControlButtonText}>Start Meeting</Text>
                    <MaterialIcons name="play-arrow" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.container, { paddingHorizontal: 20, marginBottom: 20 }]}>
                <View style={styles.photoOption}>
                  <Ionicons name="people-outline" size={50} color="#ccc" />
                  <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 20, color: '#666' }]}>
                    Please select a lead to start the meeting.
                  </Text>
                </View>
              </View>
            )}

            {/* Lead Selection Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.leadModalOverlay}>
                <View style={styles.leadModalContent}>
                  <Text style={styles.leadTitle}>Select Leads</Text>

                  <ScrollView>
                    {leads && leads.map((lead, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedLead(lead);
                          updateMeetingState({ currentLead: lead });
                          setModalVisible(false);
                        }}
                      >
                        <View style={styles.scheduleItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.scheduleName}>{lead.contact_person}</Text>
                            <Text style={styles.scheduleLocation}>{lead.shop_name}</Text>
                          </View>
                          <Text style={styles.scheduleTime}>
                            {lead.next_follow_up_date || 'No date'}
                          </Text>
                          <View
                            style={[
                              styles.statusTag,
                              lead.lead_status_data?.name == 'Sold'
                                ? styles.statusOngoing
                                : styles.statusStart,
                            ]}
                          >
                            <Text style={styles.statusText}>
                              {lead.lead_status_data?.name || 'Pending'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Pagination Controls */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
                    <TouchableOpacity
                      onPress={() => fetchLeads(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1}
                      style={{ opacity: pagination.current_page <= 1 ? 0.5 : 1 }}
                    >
                      <Text style={{ color: '#007bff' }}>Previous</Text>
                    </TouchableOpacity>

                    <Text>
                      Page {pagination.current_page} of {pagination.last_page}
                    </Text>

                    <TouchableOpacity
                      onPress={() => fetchLeads(pagination.current_page + 1)}
                      disabled={pagination.current_page >= pagination.last_page}
                      style={{ opacity: pagination.current_page >= pagination.last_page ? 0.5 : 1 }}
                    >
                      <Text style={{ color: '#007bff' }}>Next</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.stopButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.stopButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F6F6F6',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
    borderColor: '#d0d0d0',
  },
  dropdownText: {
    color: '#666',
    fontSize: 14,
  },
  dropdownTextDisabled: {
    color: '#999',
  },
  meetingInfo: {
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meetingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  meetingLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pauseButton: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  recordButton: {
    backgroundColor: '#ffe4cc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recordText: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: '500',
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginVertical: 30,
  },
  statusSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#000',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenButton: {
    backgroundColor: '#4CAF50',
  },
  redButton: {
    backgroundColor: '#f44336',
  },
  yellowButton: {
    backgroundColor: '#ff9500',
  },
  photoSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
    marginVertical: 30,
  },
  photoOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  required: {
    color: '#f44336',
  },
  notesSection: {
    marginTop: 20,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#000',
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    fontSize: 14,
    color: '#000',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#ff9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 280,
  },
  modalIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#ffebee',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff9500',
  },
  stopButton: {
    backgroundColor: '#ff9500',
  },
  cancelButtonText: {
    color: '#ff9500',
    fontSize: 16,
    fontWeight: '500',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // Lead modal option styles
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  thumb: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  scheduleName: { fontWeight: 'bold' },
  scheduleLocation: { fontSize: 12, color: '#888' },
  scheduleTime: { fontSize: 12, color: '#666', marginHorizontal: 8 },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusOngoing: { backgroundColor: '#fef3c7' },
  statusStart: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#111' },


  leadButton: {
    padding: 10,
    backgroundColor: "#22C55E",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  leadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  leadModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // overlay
    justifyContent: "center",
    alignItems: "center",
  },
  leadModalContent: {
    width: "90%",
    height: "70%", // enough height to scroll leads
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
  },
  leadTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  leadItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },

  // Meeting Controls
  meetingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  meetingControlButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
  },
  loadingButton: {
    backgroundColor: '#ccc',
  },
  meetingControlButtonStart: {
    backgroundColor: '#22C55E',
  },
  meetingControlButtonStop: {
    backgroundColor: '#f44336',
  },
  meetingControlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MeetingTimerScreen;