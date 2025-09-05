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
              {meetingOutcomeOptions.map((status) => {
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
              {plansOptions.map((plan) => {
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

const MeetingTimerScreen = () => {
  // Meeting States
  const [loadingAction, setLoadingAction] = useState(null);
  const [meetingActive, setMeetingActive] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
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
  const [pausedTotalMs, setPausedTotalMs] = useState(0);
  const [pauseStartedAt, setPauseStartedAt] = useState(null);

  // Leads
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Navigation
  const route = useRoute();

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
      setLeads(data.data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
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
        selfieImage = await takeSelfie();
        locationCoords = await captureLocation();

        if (!selfieImage || !locationCoords) {
          Alert.alert("Error", "Please capture selfie and location");
          return;
        }

        if (endpoint === '/meetings/start') {
          try {
            await startMeetingRecording();
          } catch (e) {
            Alert.alert('Mic Error', e.message || 'Unable to start recording');
            return;
          }
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert('Error', 'No token found');

        const formData = new FormData();
        formData.append('lead_id', selectedLead.id);
        formData.append('selfie', { uri: selfieImage, type: 'image/jpeg', name: 'selfie.jpg' });
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
          if (!statusId) {
            Alert.alert('Select Status', 'Please select a meeting outcome/status.');
            setLoadingAction(false);
            return;
          }

          formData.append('lead_status_id', String(statusId));

          const { uri } = await stopMeetingRecording();
          setRecordingUri(uri);

          const audioPart = buildAudioFormPart(uri, 'meeting');
          if (audioPart) {
            formData.append('recording', audioPart);
          }

          if (selectedPlan) formData.append('plan_interest', selectedPlan.name);
          if (recordingUri) formData.append('recording', { uri: recordingUri, type: 'audio/m4a', name: 'meeting.m4a' });
          if (notes) {formData.append('notes', notes)} else {formData.append('notes', '')}

          // Clear persisted draft on successful end
          try { await AsyncStorage.removeItem(`meeting_draft_${selectedLead.id}`); } catch {}
          setPausedTotalMs(0);
          setPauseStartedAt(null);
          setIsRecordingPaused(false);
        }

        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        Alert.alert('Success', res.data.message);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoadingAction(null);
      await fetchMeetingStatus();
    }
  }, [selectedLead, nextFollowUpDate, selectedStatus, selectedPlan, recordingUri, notes]);

  // Fetch meeting status
  const fetchMeetingStatus = useCallback(async () => {
    setLoadingAction(true);
    try {
      const lead_id = selectedLead?.id;
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
        setMeetingActive(true);
        setMeetingStartTime(data.data.meeting_start_time);
      } else {
        setMeetingActive(false);
        setMeetingStartTime(null);
      }

      // Also sync local recording paused state if there is an ongoing recording
      const status = await getRecordingStatus();
      if (status) {
        setIsRecordingPaused(!status.isRecording);
      } else {
        setIsRecordingPaused(false);
      }
    } catch (err) {
      console.error('Meeting status error:', err);
    } finally {
      setLoadingAction(false);
    }
  }, [selectedLead?.id]);

  const onPauseRecording = useCallback(async () => {
    const res = await pauseMeetingRecording();
    if (res?.paused !== undefined) {
      // mark paused state and start accumulating paused duration
      setIsRecordingPaused(!!res.paused);
      setPauseStartedAt(Date.now());
      // persist draft state
      if (selectedLead?.id) {
        const draft = {
          selectedStatus,
          selectedPlan,
          notes,
          nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
          isRecordingPaused: true,
          pausedTotalMs,
          pauseStartedAt: Date.now(),
        };
        try { await AsyncStorage.setItem(`meeting_draft_${selectedLead.id}`, JSON.stringify(draft)); } catch {}
      }
    }
  }, [selectedLead?.id, selectedStatus, selectedPlan, notes, nextFollowUpDate, pausedTotalMs]);

  const onResumeRecording = useCallback(async () => {
    const res = await resumeMeetingRecording();
    if (res?.resumed !== undefined) {
      // add the last pause segment to total and clear start
      if (pauseStartedAt) {
        setPausedTotalMs((prev) => prev + (Date.now() - pauseStartedAt));
      }
      setPauseStartedAt(null);
      setIsRecordingPaused(!res.resumed ? true : false);
      // persist draft state
      if (selectedLead?.id) {
        const draft = {
          selectedStatus,
          selectedPlan,
          notes,
          nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
          isRecordingPaused: false,
          pausedTotalMs: (pauseStartedAt ? pausedTotalMs + (Date.now() - pauseStartedAt) : pausedTotalMs),
          pauseStartedAt: null,
        };
        try { await AsyncStorage.setItem(`meeting_draft_${selectedLead.id}`, JSON.stringify(draft)); } catch {}
      }
    }
  }, [selectedLead?.id, selectedStatus, selectedPlan, notes, nextFollowUpDate, pausedTotalMs, pauseStartedAt]);

  // Effects
  useEffect(() => {
    fetchMeetingOutcomes();
    fetchPlanOutcomes();
  }, [fetchMeetingOutcomes, fetchPlanOutcomes]);

  useEffect(() => {
    if (route.params && route.params.lead) {
      setSelectedLead(route.params.lead);
    }
  }, [route.params]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (selectedLead) {
      fetchMeetingStatus();
      // restore draft per lead
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        if (!s) return;
        try {
          const draft = JSON.parse(s);
          if (draft.selectedStatus) setSelectedStatus(draft.selectedStatus);
          if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan);
          if (typeof draft.notes === 'string') setNotes(draft.notes);
          if (draft.nextFollowUpDate) setNextFollowUpDate(new Date(draft.nextFollowUpDate));
          if (typeof draft.isRecordingPaused === 'boolean') setIsRecordingPaused(draft.isRecordingPaused);
          if (typeof draft.pausedTotalMs === 'number') setPausedTotalMs(draft.pausedTotalMs);
          if (draft.pauseStartedAt) setPauseStartedAt(draft.pauseStartedAt);
        } catch {}
      }).catch(() => {});
    }
  }, [selectedLead, fetchMeetingStatus]);

  // Also restore draft on screen focus (covers cases where component isn't unmounted)
  useFocusEffect(
    useCallback(() => {
      if (!selectedLead?.id) return;
      let cancelled = false;
      const draftKey = `meeting_draft_${selectedLead.id}`;
      AsyncStorage.getItem(draftKey).then((s) => {
        if (cancelled || !s) return;
        try {
          const draft = JSON.parse(s);
          if (draft.selectedStatus) setSelectedStatus(draft.selectedStatus);
          if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan);
          if (typeof draft.notes === 'string') setNotes(draft.notes);
          if (draft.nextFollowUpDate) setNextFollowUpDate(new Date(draft.nextFollowUpDate));
          if (typeof draft.isRecordingPaused === 'boolean') setIsRecordingPaused(draft.isRecordingPaused);
          if (typeof draft.pausedTotalMs === 'number') setPausedTotalMs(draft.pausedTotalMs);
          if (draft.pauseStartedAt) setPauseStartedAt(draft.pauseStartedAt);
        } catch {}
      }).catch(() => {});
      return () => { cancelled = true; };
    }, [selectedLead?.id])
  );

  // Memoized components to prevent unnecessary renders
  const leadSelector = useMemo(() => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Meeting</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {selectedLead ? (
            <>
              <Text style={styles.dropdownText}>{selectedLead.contact_person} </Text>
              <ArrowRight size={18} />
              <Text style={styles.dropdownText}> {selectedLead.shop_name}</Text>
            </>
          ) : (
            <Text style={styles.dropdownText}>Choose from today's schedule</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  ), [selectedLead]);

  const meetingInfo = useMemo(() => (
    <View style={styles.meetingInfo}>
      <View style={styles.meetingHeader}>
        <View>
          <Text style={styles.meetingName}>{selectedLead?.contact_person}</Text>
          <Text style={styles.meetingLocation}>At {selectedLead?.shop_name}</Text>
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
  ), [selectedLead?.contact_person, selectedLead?.shop_name, isRecordingPaused, onPauseRecording, onResumeRecording]);

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
                    {leads.map((lead, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedLead(lead);
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
  dropdownText: {
    color: '#666',
    fontSize: 14,
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