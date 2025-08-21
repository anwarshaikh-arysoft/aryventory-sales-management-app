import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getLeadsByFollowUpDate } from '../../utils/getLeadsByFollowUpDate';
import ModalSelector from 'react-native-modal-selector';
import { ArrowRight, Icon, Camera } from 'lucide-react-native';

const MeetingTimerScreen = () => {
  const [timerState, setTimerState] = useState('stopped'); // 'stopped', 'running', 'paused'
  const [time, setTime] = useState(0); // time in seconds
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [notes, setNotes] = useState('');
  const intervalRef = useRef(null);

  // Leads
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);

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

  // Start timer
  const startTimer = () => {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
  };

  // Pause timer
  const pauseTimer = () => {
    setTimerState('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Resume timer
  const resumeTimer = () => {
    startTimer();
  };

  // Stop timer with confirmation
  const handleStopPress = () => {
    setShowStopConfirmation(true);
  };

  // Confirm stop
  const confirmStop = () => {
    setTimerState('stopped');
    setTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setShowStopConfirmation(false);
  };

  // Cancel stop
  const cancelStop = () => {
    setShowStopConfirmation(false);
  };

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


      <ScrollView
        // refreshControl={
        //   // <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        contentContainerStyle={{
          paddingBottom: 80, // height of fixedActionBar
        }}
      >

        {selectedLead ? (
          <View style={{ flex: 1, paddingHorizontal: 20, backgroundColor: '#F6F6F6' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 20, }}>

              {/* Meeting Info */}
              <View style={styles.meetingInfo}>
                <View style={styles.meetingHeader}>
                  <View>
                    <Text style={styles.meetingName}>{selectedLead?.contact_person}</Text>
                    <Text style={styles.meetingLocation}>At {selectedLead?.shop_name}</Text>
                  </View>
                  <View style={styles.recordingControls}>
                    {/* Pause Button - Only visible when recording */}
                    {/* {timerState === 'running' && (
                      <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
                        <MaterialIcons name="pause" size={20} color="#ff9500" />
                      </TouchableOpacity>
                    )} */}

                    {/* Record Button */}
                    <TouchableOpacity style={styles.recordButton}>
                      <MaterialIcons name="mic" size={16} color="#ff9500" />
                      <Text style={styles.recordText}>
                        {timerState === 'stopped' ? 'Not Started yet' :
                          timerState === 'running' ? 'Recording...' : 'Paused'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Timer Display */}
              <Text style={styles.timerDisplay}>{formatTime(time)}</Text>

              {/* Status and Controls */}
              <View style={styles.statusSection}>
                <View style={styles.controlButtons}>


                  {/* Yellow Pause/Play Button */}
                  {timerState !== 'stopped' && (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.yellowButton]}
                      onPress={timerState === 'running' ? pauseTimer : resumeTimer}
                    >
                      <MaterialIcons
                        name={timerState === 'running' ? 'pause' : 'play-arrow'}
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  )}

                  {/* Green Play / Red Stop Button */}
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      timerState === 'stopped' ? styles.greenButton : styles.redButton
                    ]}
                    onPress={timerState === 'stopped' ? startTimer : handleStopPress}
                  >
                    <MaterialIcons
                      name={timerState === 'stopped' ? 'play-arrow' : 'stop'}
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>

                </View>
              </View>

            </View>

            {/* Photo Options */}
            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoOption}>
                <MaterialIcons name="camera-alt" size={40} color="#ccc" />
                <Text style={styles.photoText}>Take Selfie <Text style={styles.required}>*</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.photoOption}>
                <MaterialIcons name="camera-alt" size={40} color="#ccc" />
                <Text style={styles.photoText}>Take Shop Photo <Text style={styles.required}>*</Text></Text>
              </TouchableOpacity>
            </View>

            {/* Meeting Outcome */}
            <View>
              <Text style={styles.sectionTitle}>Meeting Outcome</Text>
              <TouchableOpacity style={styles.dropdown}>
                <Text style={styles.dropdownText}>Select Outcome</Text>
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
              <TouchableOpacity style={styles.saveButton}>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Meeting</Text>
              </TouchableOpacity>
            </View>

          </View>


        ) : (
          <View style={[styles.container, { paddingHorizontal: 20, marginBottom: 20 }]}>
            <View style={styles.photoOption} >
              <Ionicons name="people-outline" size={50} color="#ccc" />
              <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 20, color: '#666' }]}>
                Please select a lead to start the meeting.
              </Text>
            </View>
          </View>
        )}

        {/* Stop Recording Confirmation Modal */}
        <Modal
          visible={showStopConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelStop}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}>
                <MaterialIcons name="mic-off" size={30} color="#ff6b6b" />
              </View>

              <Text style={styles.modalTitle}>Stop Recording</Text>
              <Text style={styles.modalMessage}>
                Are sure you want to stop recording
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelStop}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.stopButton]}
                  onPress={confirmStop}
                >
                  <Text style={styles.stopButtonText}>Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal */}
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
                          lead.lead_status_data.name == 'Sold'
                            ? styles.statusOngoing
                            : styles.statusStart,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {lead.lead_status_data.name || 'Pending'}
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
    marginVertical: 30,
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
});

export default MeetingTimerScreen;