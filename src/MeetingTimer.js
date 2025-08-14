import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const MeetingTimerScreen = () => {
  const [timerState, setTimerState] = useState('stopped'); // 'stopped', 'running', 'paused'
  const [time, setTime] = useState(0); // time in seconds
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [notes, setNotes] = useState('');
  const intervalRef = useRef(null);

  // Format time to HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Timer</Text>
      </View>

      {/* Select Meeting */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Meeting</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>Choose from today's schedule</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Meeting Info */}
      <View style={styles.meetingInfo}>
        <View style={styles.meetingHeader}>
          <View>
            <Text style={styles.meetingName}>Rajesh Kumar</Text>
            <Text style={styles.meetingLocation}>At Mobile Zone</Text>
          </View>
          <View style={styles.recordingControls}>
            {/* Pause Button - Only visible when recording */}
            {timerState === 'running' && (
              <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
                <MaterialIcons name="pause" size={20} color="#ff9500" />
              </TouchableOpacity>
            )}
            
            {/* Record Button */}
            <TouchableOpacity style={styles.recordButton}>
              <MaterialIcons name="mic" size={16} color="#ff9500" />
              <Text style={styles.recordText}>Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Timer Display */}
      <Text style={styles.timerDisplay}>{formatTime(time)}</Text>

      {/* Status and Controls */}
      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>Status</Text>
        <View style={styles.statusControls}>
          <Text style={styles.statusText}>
            {timerState === 'stopped' ? 'Not Started yet' : 
             timerState === 'running' ? 'Recording...' : 'Paused'}
          </Text>
          
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
          <Text style={styles.saveButtonText}>Save Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Meeting Outcome */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meeting Outcome</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>Select Outcome</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 20,
    marginBottom: 30,
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
    marginBottom: 30,
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  photoOption: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderStyle: 'dashed',
    width: '45%',
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
    paddingHorizontal: 20,
    marginBottom: 30,
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
});

export default MeetingTimerScreen;