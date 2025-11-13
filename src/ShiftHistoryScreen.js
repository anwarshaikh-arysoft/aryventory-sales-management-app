import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import $BASE_URL from './config';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';

const formatDateForDisplay = (date) => {
  if (!date) return '';
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export default function ShiftHistoryScreen() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(''); // today, this_week, custom

  const [customStartDate, setStartCustomDate] = useState(null);
  const [customEndDate, setEndCustomDate] = useState(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchShifts = async (pageNumber = 1, selectedFilter = filter) => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');

    let url = `${$BASE_URL}/shift/history?page=${pageNumber}`;

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
        setShifts(data.shifts.data);
      } else {
        setShifts((prev) => [...prev, ...data.shifts.data]);
      }

      setHasMore(data.shifts.next_page_url !== null);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(1, filter);
  }, [filter, customStartDate, customEndDate]);


  // Reset custom dates and filter
  const resetCustomDates = () => {
    setStartCustomDate(null);
    setEndCustomDate(null);
    setFilter('');
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
    setFilter(''); // Reset to no filter
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Calculate duration in hours, minutes, and seconds
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime; // difference in milliseconds

    if (isNaN(diffMs)) {
      // console.error('Invalid date format:', start, end);
      return "0h 0m 0s";
    }

    // Convert to positive duration (in case start > end)
    const durationMs = Math.max(diffMs, 0);

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Return time in HH:MM format
  const formatTime = (time) => {
    const date = new Date(`${time}`);
    if (isNaN(date.getTime())) {
      console.error('Invalid time format:', time);
      return 'Shift not ended yet'; // return error message if time is invalid
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render each shift item
  const renderShift = ({ item }) => (
    <View style={styles.card}>
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Icon name='calendar-number-outline' size={15} />
          <Text style={styles.dateText}> {item.shift_date}</Text>
        </View>

        <Text style={{ backgroundColor: '#D8E9FF', color: '#2B7EEA', fontWeight: 'bold', paddingVertical: 4, paddingHorizontal: 13, borderRadius: 100 }} >
          {item.shift_start && item.shift_end ? (
            calculateDuration(item.shift_start, item.shift_end)
          ) : !item.shift_start && !item.shift_end ? (
            'Shift not started'
          ) : !item.shift_end ? (
            'Shift not ended yet'
          ) : null}
        </Text>

      </View>

      {/* Divider */}
      <View style={styles.horizontalLine} />

      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text>Shift Start Time</Text>
        <Text>{formatTime(item.shift_start)}</Text>
      </View>

      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text>Shift End Time</Text>
        <Text>{formatTime(item.shift_end)}</Text>
      </View>

      {/* Divider */}
      <View style={styles.horizontalLine} />

      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text>Total Break Time</Text>
        <Text style={{ backgroundColor: '#E5AA16', color: '#FFFFFF', fontWeight: 'bold', paddingVertical: 4, paddingHorizontal: 13, borderRadius: 100 }} >
          {item.break_start && item.break_end ? (
            calculateDuration(item.break_start, item.break_end)
          ) : !item.break_start && !item.break_end ? (
            'Break not taken'
          ) : !item.break_end ? (
            'Break not ended yet'
          ) : null}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterRow}>

        {/* Current Day filter */}
        <TouchableOpacity style={filter == 'today' ? styles.ActivefilterBtn : styles.filterBtn} onPress={() => { clearDateFilters(); setFilter('today'); }}>
          <Icon name='calendar-number-outline' size={15} style={filter == 'today' ? styles.ActivefilterBtnText : styles.filterBtnText} /> 
          <Text style={filter == 'today' ? styles.ActivefilterBtnText : styles.filterBtnText}> Today</Text>
        </TouchableOpacity>

        {/* This Week Filter starts from sunday */}
        <TouchableOpacity style={filter == 'this_week' ? styles.ActivefilterBtn : styles.filterBtn} onPress={() => { clearDateFilters(); setFilter('this_week'); }}>
          <Icon name='calendar-number-outline' size={15} style={filter == 'this_week' ? styles.ActivefilterBtnText : styles.filterBtnText} /> 
          <Text style={filter == 'this_week' ? styles.ActivefilterBtnText : styles.filterBtnText}>This Week</Text>
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
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderShift}
          onEndReached={() => {
            if (hasMore && !loading) {
              fetchShifts(page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F6F6', padding: 16 },
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
  card: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EFEFF0',
  },
  dateText: {
    fontWeight: 'bold',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: '#EFEFF0',
    marginVertical: 10,
  },
});
