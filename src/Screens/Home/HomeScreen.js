// HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'; // or from 'react-native-vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

// Media and location capturing components
import { takeSelfie } from '../../utils/TakeSelfie';
import { captureLocation } from '../../utils/LocationCapture';

// Get leads
import { getLeadsByFollowUpDate } from '../../utils/getLeadsByFollowUpDate';
// Import BASE_URL from '../../config';
import BASE_URL from '../../config';

import MeetingTimerOverlay from '../../components/MeetingTimerOverlay';
import { useMeeting } from '../../context/MeetingContext';

export default function HomeScreen({ navigation }) {

  // Meeting State
  const { meetingActive } = useMeeting();

  // Screen Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Auth Context
  const { user } = useAuth();

  // Stats State
  const [stats, setStats] = useState(null);

  // Selfie and location state
  const [selfie, setSelfie] = useState(null);
  const [location, setLocation] = useState(null);

  // Shift State 
  const [loadingAction, setLoadingAction] = useState(null);
  const [shiftActive, setShiftActive] = useState(false);
  const [breakActive, setBreakActive] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [shiftElapsed, setShiftElapsed] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);

  // Leads
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Data fetch
    fetchShiftStatus();
    fetchStats();
    fetchLeads();

    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Time formater for shifts and breaks
  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(seconds);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Send shift actions
  const sendShiftAction = async (endpoint, actionKey) => {
    setLoadingAction(actionKey);

    let selfieImage = null;
    let locationCoords = null;

    try {
      if (endpoint === '/shift/start' || endpoint === '/shift/end') {
        // selfieImage = await takeSelfie();
        locationCoords = await captureLocation();

        if (!locationCoords) {
          Alert.alert("Error", "Please capture location");
          return;
        }

        // if (!selfieImage) {
        //   Alert.alert("Error", "Please capture selfie");
        //   return;
        // }

        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert('Error', 'No token found');

        const formData = new FormData();
        // formData.append('selfie', { uri: selfieImage, type: 'image/jpeg', name: 'selfie.jpg' });
        formData.append('latitude', locationCoords.latitude);
        formData.append('longitude', locationCoords.longitude);

        const res = await axios.post(`${BASE_URL}${endpoint}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        Alert.alert('Success', res.data.message);
      } else {
        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert('Error', 'No token found');

        const res = await axios.post(`${BASE_URL}${endpoint}`, null, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        Alert.alert('Success', res.data.message);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoadingAction(null);
      // Re-fetch after action
      await fetchShiftStatus();
    }
  };


  // Poll timers
  useEffect(() => {
    let interval;
    if (shiftActive) {
      interval = setInterval(() => {
        setShiftElapsed(prev => prev + 1);
        if (breakActive) {
          setBreakElapsed(prev => prev + 1);
        }
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [shiftActive, breakActive, shiftStartTime, breakStartTime]);

  // Fetch shift status on load
  const fetchShiftStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/shift/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;

      console.log('data', data);

      setShiftActive(data.shift_started && !data.shift_ended);
      setBreakActive(data.break_started && !data.break_ended);
      if (data.shift_started) setShiftStartTime(new Date(data.shiftStart).getTime());
      if (data.break_started) setBreakStartTime(new Date(data.breakStart).getTime());

      console.log('breakActive', breakActive);
      console.log('breakElapsed', breakElapsed);
      console.log('data.break_timer', data.break_timer);
      console.log('data.total_break_time', data.total_break_time);

      if (data.shift_started && !data.shift_ended) {
        setShiftElapsed(Math.floor(data.shift_timer));
        
        if (breakActive) {
          setBreakElapsed(Math.floor(data.break_timer + data.total_break_time));
        } else {
          setBreakElapsed(Math.floor(data.total_break_time));
        }
        
      } else {
        setShiftElapsed(0);
        setBreakElapsed(0);
      }      

    } catch (err) {
      console.error('Error fetching shift status:', err);
    }
  };

  // Fetch shift status on app foreground
  useEffect(() => {
    fetchShiftStatus();

    // Run on app foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchShiftStatus();
      }
    });

    return () => {
      subscription.remove(); // cleanup
    };

  }, [shiftActive, breakActive, shiftStartTime, breakStartTime]);

  // Fetch user stats
  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const res = await axios.get(`${BASE_URL}/user-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch stats on component mount   
  useEffect(() => {
    fetchStats();
    console.log('fetchStats', stats);
  }, []);

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getLeadsByFollowUpDate(page);
      setLeads(data.data); // `data` is the Laravel paginated object
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);


  function handleNavigation(title) {
    let tab;
    if (title == 'total leads') {
      tab = 'all'
    }
    else if (title == 'sold') {
      tab = 'Sold'
    }
    else {
      tab = 'today'
    }
    if (title == 'target') navigation.navigate('Reports')
    else navigation.navigate('leadlist', { tab: tab })
  }

  return (
    <View style={{ flex: 1 }}>


      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingBottom: 80, // height of fixedActionBar
        }}
      >
        {/* Header */}
        <View>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('profile-screen')}>
              <Image
                source={{ uri: 'https://avatar.iran.liara.run/public/4' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.subText}>Good Morning</Text>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>{user?.designation}</Text>
              </View>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              {/* <TouchableOpacity style={styles.notification}>
                <Ionicons name="notifications" size={22} color="#fff" />
                <View style={styles.badge} />
              </TouchableOpacity> */}

              {/* Add Shift History Button */}
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.navigate('ShiftHistory')}
              >
                <Ionicons name="time" size={22} color="#fff" />

              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.container}>

          {/* Attendance */}
          {/* Render Shift Controls */}
          <View style={styles.buttonRow}>
            {!shiftActive && (
              <TouchableOpacity
                style={styles.addLeadButton}
                onPress={() => sendShiftAction('/shift/start', 'shift-start')}
                disabled={loadingAction === 'shift-start'}
              >
                {loadingAction === 'shift-start'
                  ? <ActivityIndicator color="#16a34a" />
                  : <>
                    <Ionicons name="add" size={20} color="#16a34a" />
                    <Text style={styles.addLeadText}>Shift Start</Text>
                  </>
                }
              </TouchableOpacity>
            )}

            {shiftActive && !breakActive && (
              <>
                <TouchableOpacity
                  style={styles.startMeetingButton}
                  onPress={() => sendShiftAction('/shift/end', 'shift-end')}
                  disabled={loadingAction === 'shift-end'}
                >
                  {loadingAction === 'shift-end'
                    ? <ActivityIndicator color="#000" />
                    : <>
                      <Ionicons name="stop" size={20} color="#000" />
                      <Text style={styles.startMeetingText}>Shift End</Text>
                    </>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startMeetingButton}
                  onPress={() => sendShiftAction('/shift/start-break', 'start-break')}
                  disabled={loadingAction === 'start-break'}
                >
                  {loadingAction === 'start-break'
                    ? <ActivityIndicator color="#2563eb" />
                    : <>
                      <Ionicons name="time" size={20} color="#2563eb" />
                      <Text style={styles.startMeetingText}>Start Break</Text>
                    </>
                  }
                </TouchableOpacity>
              </>
            )}

            {breakActive && (
              <TouchableOpacity
                style={styles.startMeetingButton}
                onPress={() => sendShiftAction('/shift/end-break', 'end-break')}
                disabled={loadingAction === 'end-break'}
              >
                {loadingAction === 'end-break'
                  ? <ActivityIndicator color="#ef4444" />
                  : <>
                    <Ionicons name="pause" size={20} color="#ef4444" />
                    <Text style={styles.startMeetingText}>End Break</Text>
                  </>
                }
              </TouchableOpacity>
            )}
          </View>


          {/* Timers */}
          {(
            <Text style={{ marginTop: 8, fontWeight: 'bold' }}>
              Shift Time: {formatTime(shiftElapsed)}
            </Text>
          )}
          {(
            <Text style={{ marginTop: 4, fontWeight: 'bold', color: 'red' }}>
              Break Time: {formatTime(breakElapsed)}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsGrid}>
            {stats && Object.entries(stats).map(([title, stat], index) => (
              <TouchableOpacity onPress={() => handleNavigation(title)} key={index} style={styles.statCard}>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statLabel}>{title}</Text>
                  <MaterialIcons name="calendar-today" size={18} color="#f97316" />
                </View>
                <Text style={styles.statValue}>{title == 'target' ? stats['sold'] + ' /' : ''} {stat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Schedule */}

          <View>
            {/* Follow-up Leads */}
            <View style={[styles.recentActivityHeader]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, }}>
                <Text style={styles.sectionTitle}>Upcoming Follow-ups</Text>
                <Text style={[styles.sectionTitle, { backgroundColor: 'black', paddingHorizontal: 5, color: 'white', borderRadius: 100, }]}>{leads.filter((lead) => lead.lead_status_data?.name != 'Sold' && lead.lead_status_data?.name != 'Not Interested').length}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: '#dbeafe', padding: 8, borderRadius: 12, }} onPress={() => navigation.navigate('leadlist')}>
                <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>View All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <>
                {/* Remove leads which are sold and not interested */}
                {leads.filter((lead) => lead.lead_status_data?.name != 'Sold' && lead.lead_status_data?.name != 'Not Interested').map((lead, index) => (
                  <TouchableOpacity
                    key={index}
                    title={lead.contact_person}
                    onPress={() => {
                      // Navigate to ShowLead screen with lead details
                      navigation.navigate('showlead', { lead });
                    }}
                  >
                    <View style={styles.scheduleItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scheduleName}>{lead.contact_person}</Text>
                        <Text style={styles.scheduleLocation}>{lead.shop_name}</Text>
                        <Text style={{ marginTop: 5, backgroundColor: lead.created_by != user?.id ? '#dbeafe' : '#f9fafb', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 100, width: 80 }}>
                          {lead.created_by != user?.id ? 'Assigned' : ''}
                        </Text>
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

                {/* Pagination Controls */}
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    onPress={() => fetchLeads(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    style={[
                      styles.paginationButton,
                      { opacity: pagination.current_page <= 1 ? 0.5 : 1 }
                    ]}
                  >
                    <Text style={styles.paginationButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <Text>
                    Page {pagination.current_page} of {pagination.last_page}
                  </Text>

                  <TouchableOpacity
                    onPress={() => fetchLeads(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    style={[styles.paginationButton,
                    { opacity: pagination.current_page >= pagination.last_page ? 0.5 : 1 }
                    ]}
                  >
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

        </View>

      </ScrollView>


      {/* Fixed Actions Bar */}
      <View style={[styles.fixedActionBar, styles.container]}>
        {meetingActive && (
          <View style={{ marginBottom: 16 }}>
            {/* <MeetingTimerOverlay /> */}
          </View>
        )}
        <View style={styles.fixedActionBarContent}>

          <TouchableOpacity style={styles.addLeadButton} onPress={() => navigation.navigate('addlead')}>
            <Ionicons name="add" size={20} color="#16a34a" />
            <Text style={styles.addLeadText}>Add Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startMeetingButton} onPress={() => navigation.navigate('Meeting')}>
            <Ionicons name="time" size={20} color="#2563eb" />
            <Text style={styles.startMeetingText}>Start Meeting</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111214',
    paddingTop: 45,
    paddingBottom: 20.5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  avatar: { width: 50, height: 50, borderRadius: 100 },
  headerText: { flex: 1, marginLeft: 12, color: '#fff' },
  subText: { color: '#888', fontSize: 12 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  roleTag: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleText: { fontSize: 12, color: '#444' },
  notification: {
    backgroundColor: '#888',
    padding: 8,
    borderRadius: 20,
    position: 'relative',
  },
  historyButton: {
    backgroundColor: '#888',
    padding: 8,
    borderRadius: 20,
    position: 'relative',
  },
  logout: {
    backgroundColor: '#888',
    padding: 8,
    borderRadius: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007bff',
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationInfo: {
    alignItems: 'center',
    flex: 1,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paginationSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Current Shift Status Card
  currentShiftCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  shiftStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8',
  },
  activeShiftIndicator: {
    backgroundColor: '#16a34a',
  },
  timerRow: {
    marginBottom: 8,
  },
  timerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '600',
  },
  timerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'monospace',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  statCard: {
    width: '47%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statLabel: { color: '#888', marginBottom: 6, textTransform: 'capitalize' },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

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

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  addLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  startMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  addLeadText: { color: '#16a34a', marginLeft: 6, fontWeight: 'bold' },
  startMeetingText: { color: '#2563eb', marginLeft: 6, fontWeight: 'bold' },

  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  viewAllText: { color: '#2563eb', fontSize: 12 },

  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  activityTitle: { fontWeight: 'bold' },
  activityDesc: { fontSize: 12, color: '#666' },
  fixedActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    paddingVertical: 10,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  fixedActionBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

});