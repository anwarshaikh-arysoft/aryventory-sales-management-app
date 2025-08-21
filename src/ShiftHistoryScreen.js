import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import $BASE_URL from './config';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';


export default function ShiftHistoryScreen() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(''); // today, this_week, custom

  const [customStartDate, setStartCustomDate] = useState(null);
  const [customEndDate, setEndCustomDate] = useState(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchShifts = async (pageNumber = 1, selectedFilter = filter) => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');

    let url = `${$BASE_URL}/shift/history?page=${pageNumber}&filter=${filter}`;

    if (selectedFilter) {
      url += `&filter=${selectedFilter}`;
      if (selectedFilter === 'custom') {
        url += `&start_date=${customStartDate}&end_date=${customEndDate}`; // later replace with Date Picker values
      }
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
  }, [filter]);


  // Reset custom dates and filter
  const resetCustomDates = () => {
    setStartCustomDate(null);
    setEndCustomDate(null);
    setFilter('');
  };

  // handle start date
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    console.log('Selected Start Date:', selectedDate);
    if (selectedDate) {
      setStartCustomDate(formatDate(selectedDate));
      setShowEndPicker(true);
    }
  };

  // handle end date
  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    console.log('Selected End Date:', selectedDate);
    if (selectedDate) {
      setEndCustomDate(formatDate(selectedDate));
      setFilter('custom');
    }
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
        <TouchableOpacity style={filter == 'today' ? styles.ActivefilterBtn : styles.filterBtn} onPress={() => setFilter('today')}>
          <Icon name='calendar-number-outline' size={15} style={filter == 'today' ? styles.ActivefilterBtnText : styles.filterBtnText} /> <Text style={filter == 'today' ? styles.ActivefilterBtnText : styles.filterBtnText}> Today</Text>
        </TouchableOpacity>

        {/* This Week Filter starts from sunday */}
        <TouchableOpacity style={filter == 'this_week' ? styles.ActivefilterBtn : styles.filterBtn} onPress={() => setFilter('this_week')}>
          <Icon name='calendar-number-outline' size={15} style={filter == 'this_week' ? styles.ActivefilterBtnText : styles.filterBtnText} /> <Text style={filter == 'this_week' ? styles.ActivefilterBtnText : styles.filterBtnText}>This Week</Text>
        </TouchableOpacity>

        {/* Custom Filter */}
        <TouchableOpacity style={filter == 'custom' ? styles.ActivefilterBtn : styles.filterBtn} onPress={() => { resetCustomDates(); setShowStartPicker(true); }}>
          <Icon name='calendar-outline' size={15} style={filter == 'custom' ? styles.ActivefilterBtnText : styles.filterBtnText} /> <Text style={filter == 'custom' ? styles.ActivefilterBtnText : styles.filterBtnText}>Custom</Text>
        </TouchableOpacity>

        {/* Show Start Date Picker */}
        {showStartPicker && (
          <DateTimePicker
            value={customStartDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onStartDateChange}
          />
        )}

        {/* Show End Date Picker */}
        {showEndPicker && (
          <DateTimePicker
            value={customEndDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onEndDateChange}
          />
        )}
      </View>

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


  card: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
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
