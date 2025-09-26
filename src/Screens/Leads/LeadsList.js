// src/Screens/Leads/LeadsList.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../../theme/colors';
import BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { set } from 'date-fns';
import getLeadStatuses from '../../utils/getLeadStatuses';
import { useAuth } from '../../context/AuthContext';

// ---- helpers -------------------------------------------------------------
const ymd = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const todayYMD = () => ymd(new Date());

const formatDateForDisplay = (date) => {
  if (!date) return '';
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};



/** Map API lead to UI card shape (keeps your card render intact) */
const mapLead = (l) => ({
  id: String(l.id ?? Math.random()),
  company: l.shop_name ?? '—',
  status: l.lead_status_data?.name ?? '—',
  statusId: l.lead_status,
  name: l.contact_person ?? '—',
  phone: l.mobile_number ?? '—',
  email: l.email ?? '—',
  datetime: l.next_follow_up_date
    ? new Date(l.next_follow_up_date).toLocaleString()
    : (l.created_at ? new Date(l.created_at).toLocaleString() : '—'),
  address: l.address
    ? `${l.address}${l.area_locality ? ', ' + l.area_locality : ''}${l.pincode ? ', ' + l.pincode : ''}`
    : [l.area_locality, l.pincode].filter(Boolean).join(', ') || '—',
  note: l.meeting_notes || '—',
  rating: l.prospect_rating || 0,
  planInterest: l.plan_interest || '—',
  completedAt: l.completed_at,
  originalData: l, // Keep original data for advanced operations
});

// ---- component -----------------------------------------------------------
export default function LeadsList(props) {
  const { navigation, route } = props;
  const tab = route?.params?.tab || 'all';

  const [query, setQuery] = useState('');

  const [activeTab, setActiveTab] = useState(tab);

  const [items, setItems] = useState([]);            // mapped UI items
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Date filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  // Lead statuses
  const [leadStatuses, setLeadStatuses] = useState([]);

  const debounced = useRef(null);
  const isInitialMount = useRef(true);

  // Debounced search effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounced.current) {
      clearTimeout(debounced.current);
    }

    debounced.current = setTimeout(() => {
      setItems([]);
      fetchLeads(1);
    }, 500);

    return () => {
      if (debounced.current) {
        clearTimeout(debounced.current);
      }
    };
  }, [query, activeTab, startDate, endDate]);



  // Initial load
  useEffect(() => {
    fetchLeads(1);
    fetchLeadStatuses();
  }, []);

  const { user } = useAuth();

  const buildQueryParams = useCallback((pageNum = 1) => {
    const params = new URLSearchParams();
    params.set('per_page', '20');
    params.set('page', String(pageNum));

    // search across: shop_name, contact_person, mobile_number, email, address, area_locality, pincode
    if (query?.trim()) params.set('search', query.trim());

    // Custom date range filters (takes priority over tab filters)
    if (startDate && endDate) {
      params.set('follow_up_start_date', ymd(startDate));
      params.set('follow_up_end_date', ymd(endDate));
    } else if (startDate) {
      params.set('follow_up_start_date', ymd(startDate));
    } else if (endDate) {
      params.set('follow_up_end_date', ymd(endDate));
    }
    // else {
    //   // tab-specific filters (only applied when no custom date range is set)
    //   if (activeTab === 'today') {
    //     const t = todayYMD();
    //     params.set('follow_up_start_date', t);
    //     params.set('follow_up_end_date', t);
    //   }
    // }

    if (activeTab !== 'all') {
      params.set('lead_status', activeTab);
    }

    // optional: default sort
    params.set('sort', 'next_follow_up_date');
    params.set('direction', 'asc');

    return params.toString();
  }, [query, activeTab, startDate, endDate]);

  // Fetch lead statuses
  const fetchLeadStatuses = useCallback(async () => {
    const leadStatuses = await getLeadStatuses();
    setLeadStatuses(leadStatuses);


  }, []);

  const fetchLeads = useCallback(async (pageNum = 1) => {
    if (loading) return;
    setLoading(true);
    let controller;
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');

      controller = new AbortController();
      const qs = buildQueryParams(pageNum);
      console.log('Query String:', qs);
      const res = await fetch(`${BASE_URL}/sales-executive/leads?${qs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 401) {
          // e.g. navigation?.replace('Login');
          console.warn('Unauthorized. Redirect to login.');
        }
        const msg = await res.text();
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }

      const json = await res.json();
      // Laravel paginator response
      const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      const mapped = data.map(mapLead);

      setItems(mapped);

      // Set pagination data from Laravel paginator response
      setPagination({
        current_page: json?.current_page || 1,
        last_page: json?.last_page || 1,
        total: json?.total || data.length,
        per_page: json?.per_page || 20,
        from: json?.from || 0,
        to: json?.to || data.length,
      });

    } catch (e) {
      console.warn('Failed to load leads:', e?.message || e);
    } finally {
      setLoading(false);
      if (refreshing) setRefreshing(false);
    }

    // return a cancel function for safety (optional, see below)
    return () => controller?.abort();
  }, [buildQueryParams, loading, refreshing, leadStatuses]);

  const onRefresh = () => {
    setRefreshing(true);
    setItems([]);
    fetchLeads(1);
    fetchLeadStatuses();
  };

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setShowDateFilter(false);
  };

  // Local search refinement (light filtering on already-fetched data)
  const data = useMemo(() => {
    if (!query.trim()) return items;
    const searchTerm = query.toLowerCase();
    return items.filter(l =>
      [l.company, l.name, l.phone, l.email, l.address, l.note, l.status, l.planInterest]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm),
    );
  }, [items, query]);

  const goToPreviousPage = () => {
    if (pagination.current_page > 1) {
      fetchLeads(pagination.current_page - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.current_page < pagination.last_page) {
      fetchLeads(pagination.current_page + 1);
    }
  };

  const callNumber = phone => {
    console.log('Call:', phone);
  };
  const onEdit = lead => {
    console.log('Edit:', lead.id);
    // Navigate to edit screen
    // navigation.navigate('EditLead', { leadId: lead.id });
  };
  const onMeet = lead => {
    console.log('Meet:', lead.id);
    // Navigate to meeting screen
    // navigation.navigate('Meeting', { leadId: lead.id });
  };

  const TABS = [{ key: 'all', label: 'All', count: 0 }, { key: 'today', label: 'Todays Follow Up', count: 0 }, ...leadStatuses.map(status => ({ key: status.id, label: status.name, count: 0 }))];


  console.log('TABS', TABS);
  const renderTab = t => {
    const isActive = activeTab === t.key;
    return (
      <TouchableOpacity
        key={t.key}
        style={[
          styles.tabPill,
          { backgroundColor: isActive ? colors.ctaBackground : '#F5F5F5' },
        ]}
        onPress={() => setActiveTab(t.key)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.tabText,
            { color: isActive ? '#FFFFFF' : colors.textPrimary ?? '#333' },
          ]}
        >
          {t.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to ShowLead screen with lead details
        navigation.navigate('showlead', { lead: item.originalData });
      }}
    >
      <View style={styles.card}>
        <View style={styles.cardHeadRow}>
          <Text style={styles.company}>
            {item.company}
          </Text>

          <View
            style={[
              styles.badge,
              item.status === 'Sold'
                ? { backgroundColor: '#22C55E33' }
                : item.status === 'Not Interested'
                  ? { backgroundColor: '#EF444433' }
                  : item.status === 'Interested'
                    ? { backgroundColor: (colors.primaryLight ?? '#A8A3D7') + '33' }
                    : { backgroundColor: '#E6F0FF' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.status === 'Sold'
                  ? { color: '#22C55E' }
                  : item.status === 'Not Interested'
                    ? { color: '#EF4444' }
                    : item.status === 'Interested'
                      ? { color: colors.primary ?? '#281C9D' }
                      : { color: '#5B7FFF' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-start' }}>
          <Text style={[{fontWeight: '600', fontSize: 12, marginTop: 5, backgroundColor: item.originalData.created_by != user?.id ? '#dbeafe' : '', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }]}>
            {item.originalData.created_by != user?.id ? 'Assigned' : ''}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.mutedLabel}>Address</Text>
          <Text style={styles.datetime}>{item.datetime}</Text>
        </View>

        <Text style={styles.address}>{item.address}</Text>

        <View style={styles.rowBetween}>
          <Text style={styles.mutedLabel}>Plan Interest</Text>
          <Text style={styles.mutedLabel}>Rating: {item.rating}/5</Text>
        </View>
        <Text style={styles.planInterest}>{item.planInterest}</Text>

        <Text style={[styles.mutedLabel, { marginTop: 8 }]}>Notes</Text>
        <Text style={styles.note}>{item.note}</Text>

        <View style={[styles.actionsRow, { display: 'none' }]}>
          <ActionButton
            label="Call"
            icon="call-outline"
            onPress={() => callNumber(item.phone)}
            background="#22C55E"
          />
          <ActionButton
            label="Edit"
            icon="create-outline"
            onPress={() => onEdit(item)}
            background={colors.info ?? '#281C9D'}
          />
          <ActionButton
            label="Meet"
            icon="swap-vertical-outline"
            onPress={() => onMeet(item)}
            background="#FB923C"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primaryBackground ?? '#F6F6F6' }]}>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search your Leads..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={() => setShowDateFilter(!showDateFilter)}
          style={styles.dateFilterToggle}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={(startDate || endDate) ? colors.primary : "#999"}
          />
        </TouchableOpacity>
      </View>

      {/* Date Filter */}
      {showDateFilter && (
        <View style={styles.dateFilterContainer}>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {startDate ? formatDateForDisplay(startDate) : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateToText}>to</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {endDate ? formatDateForDisplay(endDate) : 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {(startDate || endDate) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearDateFilters}
            >
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          maximumDate={endDate || new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startDate || undefined}
          maximumDate={new Date()}
        />
      )}

      {/* Tabs */}
      <FlatList
        data={TABS}
        renderItem={({ item }) => renderTab(item)}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsList}
      />

      {/* List */}
      <FlatList
        contentContainerStyle={{ marginTop: 10, paddingHorizontal: 16, paddingBottom: 24, alignItems: 'stretch', flexGrow: 1, justifyContent: 'space-between' }}
        data={data}
        keyExtractor={item => item.id}
        renderItem={(item) => renderItem(item)}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          <>
            {loading ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}

            {/* Pagination Controls */}
            {data.length > 0 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={goToPreviousPage}
                  disabled={pagination.current_page <= 1}
                  style={[
                    styles.paginationButton,
                    { opacity: pagination.current_page <= 1 ? 0.5 : 1 }
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    Page {pagination.current_page} of {pagination.last_page}
                  </Text>
                  <Text style={styles.paginationSubtext}>
                    {pagination.from}-{pagination.to} of {pagination.total} leads
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={goToNextPage}
                  disabled={pagination.current_page >= pagination.last_page}
                  style={[
                    styles.paginationButton,
                    { opacity: pagination.current_page >= pagination.last_page ? 0.5 : 1 }
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280' }}>No leads found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ActionButton({ icon, label, onPress, background }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.actionBtn, { backgroundColor: background }]}
    >
      <Ionicons name={icon} size={16} color="#FFFFFF" />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---- styles (unchanged) ---------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchWrap: {
    marginTop: 8,
    marginHorizontal: 16,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  dateFilterToggle: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFilterContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
    borderRadius: 8,
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
  tabsList: { paddingVertical: 12 },
  tabsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 10 },
  tabPill: {
    paddingHorizontal: 14, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  company: { width: '50%', fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: {
    paddingHorizontal: 12,
    minHeight: 30,               // 👈 use minHeight instead of fixed height
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    width: '50%',
  },
  badgeText: { fontSize: 12, fontWeight: '700', flexShrink: 1, flexWrap: 'wrap', textAlign: 'center', width: '100%' },
  separator: { height: 1, backgroundColor: '#F1F1F1', marginVertical: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: '#111827', },
  phone: { fontSize: 13, fontWeight: '600', color: '#111827', },
  mutedLabel: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  datetime: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  address: { marginTop: 2, fontSize: 13, color: '#111827', lineHeight: 18 },
  planInterest: { marginTop: 2, fontSize: 13, color: '#111827', fontWeight: '600' },
  note: { marginTop: 4, fontSize: 13, color: '#111827' },
  actionsRow: { marginTop: 14, flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
});
