import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

const formatDateForDisplay = (date) => {
  if (!date) return '';
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export default function ShiftsScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('today'); // today, this_week, custom

  const [customStartDate, setStartCustomDate] = useState(null);
  const [customEndDate, setEndCustomDate] = useState(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchShifts = async (pageNumber = 1, selectedFilter = filter) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    const token = await AsyncStorage.getItem('token');

    let url = `${BASE_URL}/users/${user.id}/shifts?page=${pageNumber}`;

    // Custom date range takes priority
    if (customStartDate && customEndDate) {
      url += `&filter=custom&start_date=${formatDate(customStartDate)}&end_date=${formatDate(customEndDate)}`;
    } else if (customStartDate) {
      url += `&filter=custom&start_date=${formatDate(customStartDate)}`;
    } else if (customEndDate) {
      url += `&filter=custom&end_date=${formatDate(customEndDate)}`;
    } else if (selectedFilter) {
      url += `&filter=${selectedFilter}`;
    }

    console.log('Fetching shifts from URL:', url);

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (pageNumber === 1) {
        setShifts(data.shifts?.data || []);
      } else {
        setShifts((prev) => [...prev, ...(data.shifts?.data || [])]);
      }

      setHasMore(data.shifts?.next_page_url !== null);
      setPage(pageNumber);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      Alert.alert('Error', 'Failed to fetch shifts data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(1, filter);
  }, [filter, customStartDate, customEndDate, user?.id]);

  // Reset custom dates and filter
  const resetCustomDates = () => {
    setStartCustomDate(null);
    setEndCustomDate(null);
    setFilter('today');
  };

  // handle start date
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    console.log('Selected Start Date:', selectedDate);
    if (selectedDate) {
      setStartCustomDate(selectedDate);
    }
  };

  // handle end date
  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    console.log('Selected End Date:', selectedDate);
    if (selectedDate) {
      setEndCustomDate(selectedDate);
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartCustomDate(null);
    setEndCustomDate(null);
    setShowDateFilter(false);
    setFilter('today');
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Calculate duration in hours, minutes, and seconds
  const calculateDuration = (start, end) => {
    if (!start || !end) return "0h 0m 0s";
    
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;

    if (isNaN(diffMs)) {
      return "0h 0m 0s";
    }

    const durationMs = Math.max(diffMs, 0);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Return time in HH:MM format
  const formatTime = (time) => {
    if (!time) return 'Not available';
    const date = new Date(time);
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format meeting time
  const formatMeetingTime = (time) => {
    if (!time) return 'Not ended';
    const date = new Date(time);
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render each meeting item
  const renderMeeting = ({ item, index, allMeetings }) => {
    const isFirstMeeting = index === 0;
    const previousMeeting = index > 0 ? allMeetings[index - 1] : null;
    
    return (
      <View style={styles.meetingCard}>
        {/* Meeting Header */}
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingNumber}>{index + 1}</Text>
          <View style={styles.meetingTitleContainer}>
            <Text style={styles.shopName}>{item.lead?.shop_name || 'Unknown Shop'}</Text>
            <Text style={styles.contactPerson}>
              {item.lead?.contact_person || 'Unknown Contact'} • {item.lead?.mobile_number || 'No number'}
            </Text>
          </View>
        </View>

        {/* Meeting Time and Duration */}
        <View style={styles.meetingTimeSection}>
          <Text style={styles.meetingTimeText}>
            {formatMeetingTime(item.meeting_start_time)} - {formatMeetingTime(item.meeting_end_time)}
          </Text>
          <Text style={styles.meetingDuration}>
            {item.meeting_end_time ? calculateDuration(item.meeting_start_time, item.meeting_end_time) : '0h 0m'}
          </Text>
        </View>

        {/* Lead Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{item.lead?.address || 'No address'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Area:</Text>
            <Text style={styles.infoValue}>{item.lead?.area_locality || 'No area'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pincode:</Text>
            <Text style={styles.infoValue}>{item.lead?.pincode || 'No pincode'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.statusValue}>{item.lead?.lead_status_data?.name || 'No status'}</Text>
          </View>
        </View>

        {/* Travel Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Information</Text>
          {isFirstMeeting ? (
            <Text style={styles.travelInfo}>First meeting of the day</Text>
          ) : (
            <View>
              {item.time_from_previous_meeting ? (
                <Text style={styles.travelInfo}>
                  Time from previous meeting: {typeof item.time_from_previous_meeting === 'object' 
                    ? item.time_from_previous_meeting.formatted || `${item.time_from_previous_meeting.hours || 0}h ${item.time_from_previous_meeting.minutes || 0}m`
                    : item.time_from_previous_meeting}
                </Text>
              ) : (
                <Text style={styles.travelInfo}>No time data available</Text>
              )}
              {item.distance_from_previous_meeting ? (
                <Text style={styles.travelInfo}>
                  Distance from previous meeting: {typeof item.distance_from_previous_meeting === 'object' 
                    ? `${item.distance_from_previous_meeting.kilometers || 0}.${String(item.distance_from_previous_meeting.meters || 0).padStart(2, '0')} km (${item.distance_from_previous_meeting.meters || 0} m)`
                    : item.distance_from_previous_meeting}
                </Text>
              ) : (
                <Text style={styles.travelInfo}>No distance data available</Text>
              )}
            </View>
          )}
          <Text style={styles.travelInfo}>
            Meeting Location: {item.meeting_start_latitude}, {item.meeting_start_longitude}
          </Text>
        </View>

        {/* Meeting Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Notes</Text>
          <Text style={styles.meetingNotes}>
            {item.meeting_end_notes || 'No notes available'}
          </Text>
        </View>
      </View>
    );
  };

  // Render each shift item - only showing meetings
  const renderShift = ({ item }) => (
    <View style={styles.shiftContainer}>
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Icon name='calendar-number-outline' size={16} />
        <Text style={styles.dateText}>{item.shift_date}</Text>
        <Text style={styles.meetingCount}>
          {item.meetings ? item.meetings.length : 0} meetings
        </Text>
      </View>

      {/* Meetings Section */}
      {item.meetings && item.meetings.length > 0 ? (
        <View style={styles.meetingsContainer}>
          {item.meetings.map((meeting, index) => (
            <View key={meeting.id}>
              {renderMeeting({ 
                item: meeting, 
                index: index, 
                allMeetings: item.meetings 
              })}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noMeetingsCard}>
          <Icon name="calendar-outline" size={32} color="#ccc" />
          <Text style={styles.noMeetingsText}>No meetings for this day</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        {/* Current Day filter */}
        <TouchableOpacity 
          style={filter === 'today' ? styles.ActivefilterBtn : styles.filterBtn} 
          onPress={() => { clearDateFilters(); setFilter('today'); }}
        >
          <Icon name='calendar-number-outline' size={15} style={filter === 'today' ? styles.ActivefilterBtnText : styles.filterBtnText} />
          <Text style={filter === 'today' ? styles.ActivefilterBtnText : styles.filterBtnText}> Today</Text>
        </TouchableOpacity>

        {/* This Week Filter starts from sunday */}
        <TouchableOpacity 
          style={filter === 'this_week' ? styles.ActivefilterBtn : styles.filterBtn} 
          onPress={() => { clearDateFilters(); setFilter('this_week'); }}
        >
          <Icon name='calendar-number-outline' size={15} style={filter === 'this_week' ? styles.ActivefilterBtnText : styles.filterBtnText} />
          <Text style={filter === 'this_week' ? styles.ActivefilterBtnText : styles.filterBtnText}>This Week</Text>
        </TouchableOpacity>

        {/* Date Range Filter Toggle */}
        <TouchableOpacity 
          style={[
            (customStartDate || customEndDate) ? styles.ActivefilterBtn : styles.filterBtn,
            styles.dateFilterToggle
          ]} 
          onPress={() => {
            setFilter('');
            setShowDateFilter(!showDateFilter);
          }}
        >
          <Icon 
            name='calendar-outline' 
            size={15} 
            style={(customStartDate || customEndDate) ? styles.ActivefilterBtnText : styles.filterBtnText} 
          /> 
          <Text style={(customStartDate || customEndDate) ? styles.ActivefilterBtnText : styles.filterBtnText}>
            Date Range
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Container */}
      {showDateFilter && (
        <View style={styles.dateFilterContainer}>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Icon name="calendar-outline" size={16} color="#F97316" />
              <Text style={styles.dateButtonText}>
                {customStartDate ? formatDateForDisplay(customStartDate) : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateToText}>to</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Icon name="calendar-outline" size={16} color="#F97316" />
              <Text style={styles.dateButtonText}>
                {customEndDate ? formatDateForDisplay(customEndDate) : 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {(customStartDate || customEndDate) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearDateFilters}
            >
              <Icon name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={customStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          maximumDate={customEndDate || new Date()}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={customEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={customStartDate || undefined}
          maximumDate={new Date()}
        />
      )}

      {/* Shift List */}
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : shifts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No shifts found for the selected period</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderShift}
          onEndReached={() => {
            if (hasMore && !loading) {
              fetchShifts(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F6F6', 
    padding: 16 
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 15,
  },
  filterBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFE5D3',
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  filterBtnText: {
    color: '#F97316',
    textAlign: 'center',
  },
  ActivefilterBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F97316',
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  ActivefilterBtnText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dateFilterToggle: {
    // Additional styles for date filter toggle button
  },
  dateFilterContainer: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  dateToText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginHorizontal: 12,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  shiftContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 8,
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  meetingCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  meetingsContainer: {
    gap: 12,
  },
  noMeetingsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noMeetingsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  meetingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  meetingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F97316',
    minWidth: 20,
  },
  meetingTitleContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  contactPerson: {
    fontSize: 14,
    color: '#666',
  },
  meetingTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  meetingTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  meetingDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    minWidth: 80,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  travelInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  meetingNotes: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});
