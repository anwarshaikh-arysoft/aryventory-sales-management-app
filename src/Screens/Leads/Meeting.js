import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  FlatList,
  StatusBar,
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
import { startMeetingRecording, stopMeetingRecording, buildAudioFormPart, getRecordingStatus } from '../../utils/voiceRecording';
import { captureLocation } from '../../utils/LocationCapture';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BASE_URL from '../../config';
import DateTimePicker from "@react-native-community/datetimepicker";

const MeetingTimerScreen = () => {

  const [timerState, setTimerState] = useState('stopped'); // 'stopped', 'running', 'paused'
  const [time, setTime] = useState(0); // time in seconds
  const timerIdRef = useRef(null);     // holds setInterval id
  const startMsRef = useRef(null);     // stores the meeting start timestamp (ms) 

  // Meeting Controls
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [notes, setNotes] = useState('');
  const intervalRef = useRef(null);
  const [selfieUri, setSelfieUri] = useState(null);
  const [shopPhotoUri, setShopPhotoUri] = useState(null);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null); // { id, name }
  const [statusSearch, setStatusSearch] = useState('');

  const filteredStatuses = useMemo(() => {
    if (!Array.isArray(meetingOutcomeOptions)) return [];
    if (!statusSearch.trim()) return meetingOutcomeOptions;
    const q = statusSearch.toLowerCase();
    return meetingOutcomeOptions.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [meetingOutcomeOptions, statusSearch]);

  const openStatusModal = () => setStatusModalVisible(true);
  const closeStatusModal = () => setStatusModalVisible(false);
  
  const openPlanModal = () => setPlanModalVisible(true);
  const closePlanModal = () => setPlanModalVisible(false);

  const onPickStatus = (status) => {
    setSelectedStatus(status);    // store the object; or store status.id if you prefer
    setStatusModalVisible(false);
    // if you also keep `meetingOutcome` for your form submission, set it here:
    // setMeetingOutcome(status.id);
  };

  const onPickPlan = (plan) => {
    setSelectedPlan(plan);    // store the object; or store status.id if you prefer
    setPlanModalVisible(false);
    // if you also keep `meetingOutcome` for your form submission, set it here:
    // setMeetingOutcome(status.id);
  };

  // Meeting States
  const [loadingAction, setLoadingAction] = useState(null);
  const [meetingActive, setMeetingActive] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState(null);
  const [meetingElapsed, setMeetingElapsed] = useState(0);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Meeting Outcome
  const [meetingOutcome, setMeetingOutcome] = useState(null);
  const [meetingOutcomeOptions, setMeetingOutcomeOptions] = useState([]);

  // Plans State
  const [plansOptions, setPlansOptions] = useState([]);
  const [planInterest, setPlanInterest] = useState(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null); // { id, name }


  // Meeting Recording
  const [recordingUri, setRecordingUri] = useState(null);

  // Leads
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);

  // Navigation
  const route = useRoute();

  // Fetch meeting outcomes
  const fetchMeetingOutcomes = async () => {
    try {
      // token
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Error', 'No token found');

      // headers
      const res = await axios.get(`${BASE_URL}/lead-statuses/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMeetingOutcomeOptions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch meeting outcomes', err);
    }
  };

    // Fetch meeting outcomes
  const fetchPlanOutcomes = async () => {
    try {
      // token
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Error', 'No token found');

      // headers
      const res = await axios.get(`${BASE_URL}/plans/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlansOptions(res.data.data);
      console.log(res.data.data)      
    } catch (err) {
      console.error('Failed to fetch plan outcomes', err);
    }
  };

  // On mount
  useEffect(() => {
    fetchMeetingOutcomes();
    fetchPlanOutcomes();

  }, []);


  // If lead is passed as a parameter, set it as the selected lead
  useEffect(() => {
    if (route.params && route.params.lead) {
      setSelectedLead(route.params.lead);
    }
  }, []);

  // Format time to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch leads for dropdown
  const fetchLeads = async (page = 1) => {
    setLoadingLeads(true);
    try {
      const data = await getLeadsByFollowUpDate(page);
      setLeads(data.data); // `data` is the Laravel paginated object
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
      });
    } finally {
      loadingLeads(false);
    }
  };

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads();
  }, []);



  // Take selfie function
  const handleTakeSelfie = async (setfor) => {
    const selfieUri = await takeSelfie();
    if (selfieUri) {
      console.log('Selfie taken:', selfieUri);
      if (setfor === 'selfie') {
        setSelfieUri(selfieUri);
      } else if (setfor === 'shop') {
        setShopPhotoUri(selfieUri);
      }
    } else {
      console.log('Selfie not taken');
    }
  };


  // Start Timer
  const startTimer = (startAt) => {
    if (!startAt) return;                  // need a start time
    const startMs = typeof startAt === 'number' ? startAt : new Date(startAt).getTime();
    startMsRef.current = startMs;          // (re)set base start time

    // clear any previous interval to avoid duplicates
    if (timerIdRef.current) clearInterval(timerIdRef.current);

    const tick = () => setTime(Math.floor((Date.now() - startMsRef.current) / 1000));
    tick();                                 // immediate update
    timerIdRef.current = setInterval(tick, 1000);
  };

  // Pause Timer
  const pauseTimer = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  // Reset Timer
  const resetTimer = () => {
    pauseTimer();
    startMsRef.current = null;
    setTime(0);
  };

  // Make sure we don't leave an interval running after unmount
  useEffect(() => {
    return () => pauseTimer();
  }, []);

  // Follow Up Date Picker
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false); // close after picking
    if (selectedDate) {
      setNextFollowUpDate(selectedDate.toISOString().split("T")[0]); // format YYYY-MM-DD
    }
  };

  // Send shift actions
  const sendMeetingAction = async (endpoint, actionKey) => {
    console.log('Sending meeting action:', endpoint, actionKey);
    setLoadingAction(true);

    let selfieImage = null;
    let locationCoords = null;

    try {
      if (endpoint === '/meetings/start' || endpoint === '/meetings/end') {

        // Capture selfie and location
        selfieImage = await takeSelfie();
        locationCoords = await captureLocation();

        if (!selfieImage || !locationCoords) {
          Alert.alert("Error", "Please capture selfie and location");
          return;
        }

        // If starting, kick off recorder first (so you don't miss initial seconds)
        if (endpoint === '/meetings/start') {

          // Set meeting outcome, notes, and next follow up date for the meeting before 
          let nextFollowUpDate = null;
          let meetingOutcome = null;
          let notes = null;

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
        formData.append('plan_interest', selectedPlan.name);
        formData.append('next_follow_up_date', nextFollowUpDate);

        // If stopping, stop recorder and attach audio
        if (endpoint === '/meetings/end') {

          const statusId = selectedStatus?.id;
          if (!statusId) {
            Alert.alert('Select Status', 'Please select a meeting outcome/status.');
            setLoadingAction(false);
            return;
          }


          if (!nextFollowUpDate && selectedStatus.name !== 'Sold' ) {
            Alert.alert('Error', 'Please set a next follow up date');
            setLoadingAction(false);
            return;
          }

          formData.append('lead_status_id', String(statusId));

          // Stop recorder and attach audio
          const { uri } = await stopMeetingRecording();
          setRecordingUri(uri);

          const audioPart = buildAudioFormPart(uri, 'meeting');
          if (audioPart) {
            formData.append('recording', audioPart);
          }

          // also append optional duration if you want (example)
          // formData.append('duration', Math.floor(durationMillis / 1000));
        }

        if (endpoint === '/meetings/end') {


          // Add recording to form data
          recordingUri ? formData.append('recording', { uri: recordingUri, type: 'audio/m4a', name: 'meeting.m4a' }) : null;
          // Add notes to form data
          notes ? formData.append('notes', notes) : null;
        }

        console.log('request:', `${BASE_URL}${endpoint}`, formData);

        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        // Show success message
        Alert.alert('Success', res.data.message);
      } else {
        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert('Error', 'No token found');

        const res = await axios.post(`${BASE_URL}${endpoint}`, null, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        Alert.alert('Error', res.data.message);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoadingAction(null);
      // Re-fetch after action
      await fetchMeetingStatus();
    }
  };

  // Fetch meeting status
  const fetchMeetingStatus = async () => {
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
        // ⬇️ drive the timer from backend start time
        startTimer(data.data.meeting_start_time);
      } else {
        setMeetingActive(false);
        setMeetingStartTime(null);
        // ⬇️ stop/reset timer when no active meeting
        resetTimer();
      }
    } catch (err) {
      if (err.response) {
        console.log('Server responded:', err.response.status, err.response.data);
      } else if (err.request) {
        console.log('No response:', err.message);
      } else {
        console.log('Setup error:', err.message);
      }
    } finally {
      setLoadingAction(false);
    }
  };


  // Fetch meeting status on load
  useEffect(() => {
    if (selectedLead) {
      fetchMeetingStatus();
    }
  }, [selectedLead]);

  useEffect(() => {
    console.log('meetingActive:', meetingActive);
    console.log('meetingStartTime:', meetingStartTime);
    console.log('meetingElapsed:', meetingElapsed);
    console.log('loadingAction:', loadingAction);
  }, [meetingActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />

      {/* Select a lead for meeting */}
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


      <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80} // adjust if you have headers/navbars
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        // refreshControl={
        //   // <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        contentContainerStyle={{
          paddingBottom: 80, // height of fixedActionBar
        }}
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

                {/* // If meeting is active, show the timer */}
                <View>

                  <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, }}>

                    {/* Meeting Info */}
                    <View style={styles.meetingInfo}>
                      <View style={styles.meetingHeader}>
                        <View>
                          <Text style={styles.meetingName}>{selectedLead?.contact_person}</Text>
                          <Text style={styles.meetingLocation}>At {selectedLead?.shop_name}</Text>
                        </View>
                        <View style={styles.recordingControls}>

                          {/* Record Button */}
                          <TouchableOpacity style={styles.recordButton}>
                            <MaterialIcons name="mic" size={16} color="#ff9500" />
                            <Text style={styles.recordText}>
                              Recording...
                              {/* {timerState === 'stopped' ? 'Not Started yet' :
                                timerState === 'running' ? 'Recording...' : 'Paused'} */}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Timer Display */}
                    <Text style={styles.timerDisplay}>{formatTime(time)}</Text>



                  </View>

                  {/* Meeting Outcome */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>Meeting Outcome</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={openStatusModal}>
                      <Text style={styles.dropdownText}> {selectedStatus?.name || 'Select Outcome'}</Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Meeting Outcome */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>Plan interested in</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={openPlanModal}>
                      <Text style={styles.dropdownText}> {selectedPlan?.name || 'Select Plan'}</Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Meeting Notes */}
                  <View style={styles.notesSection}>
                    <Text style={styles.sectionTitle}>Meeting Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add Notes during the meeting..."
                      placeholderTextColor="#999"
                      multiline
                      value={notes}
                      onChangeText={setNotes}
                    />
                  </View>

                  {/* Next Follow Up Date */}
                  {console.log("selectedStatus " + selectedStatus)}
                  {selectedStatus?.name !== 'Sold' &&
                  (
                  <View style={{ marginVertical: 20 }}>
                    <Text style={styles.sectionTitle}>Next Follow Up Date</Text>

                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={{ color: nextFollowUpDate ? "#000" : "#999" }}>
                        {nextFollowUpDate || "Select a date"}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Date Picker */}
                    {showDatePicker && (
                      <DateTimePicker
                        value={nextFollowUpDate ? new Date(nextFollowUpDate) : new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onChangeDate}
                      />
                    )}
                  </View>
                  )
                  }

                  <TouchableOpacity
                    style={[styles.meetingControlButton, styles.meetingControlButtonStop, { marginBottom: 20 }]}
                    onPress={() => sendMeetingAction('/meetings/end', 'end')}
                  >
                    <Text style={styles.meetingControlButtonText}>Stop Meeting</Text>
                    <MaterialIcons name="stop" size={24} color="#fff" />
                  </TouchableOpacity>

                </View>
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
        )
          :
          (
            <View style={[styles.container, { paddingHorizontal: 20, marginBottom: 20 }]}>
              <View style={styles.photoOption} >
                <Ionicons name="people-outline" size={50} color="#ccc" />
                <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 20, color: '#666' }]}>
                  Please select a lead to start the meeting.
                </Text>
              </View>
            </View>
          )
        }

        {/* Select Lead Modal */}
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
                {/* Scrollable Leads List */}
                {leads.map((lead, index) => (
                  <TouchableOpacity
                    key={index}
                    title={lead.contact_person}
                    onPress={() => {
                      // Navigate to ShowLead screen with lead details
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

        {/* Meeting Outcome Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={statusModalVisible}
          onRequestClose={closeStatusModal}
        >
          <View style={styles.leadModalOverlay}>
            <View style={styles.leadModalContent}>
              <Text style={styles.leadTitle}>Select Status</Text>

              {/* Search input (optional) */}
              {/* <View style={{ marginBottom: 10 }}>
                <TextInput
                  placeholder="Search status..."
                  value={statusSearch}
                  onChangeText={setStatusSearch}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                />
              </View> */}

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
                        <Text style={[
                          styles.scheduleName,
                          { flex: 1 }
                        ]}>
                          {status?.name}
                        </Text>

                        {/* radio / check indicator */}
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


        {/* Plan Modal */}
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
                        <Text style={[
                          styles.scheduleName,
                          { flex: 1 }
                        ]}>
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
                onPress={closeStatusModal}
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