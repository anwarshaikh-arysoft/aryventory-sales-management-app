// src/Screens/Leads/LeadsList.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../theme/colors';
import BASE_URL from '../../config';

const TABS = [
  { key: 'all', label: 'All', count: 47 },
  { key: 'today', label: 'Today', count: 8 },
  { key: 'interested', label: 'Interested', count: 12 },
];

const MOCK_LEADS = [
  {
    id: '1',
    company: 'Mobile Zone',
    status: 'Interested',
    name: 'Irshad Shaikh',
    phone: '+91 0934569854',
    datetime: '2024-01-15 • 2:00 PM',
    address: '42 Maplewood Lane, Springfield, IL 62704, United States',
    note: 'Interested in Premium Plan',
  },
  {
    id: '2',
    company: 'Mobile Zone',
    status: 'Follow-Up',
    name: 'Anwar Shaikh',
    phone: '+91 0934569854',
    datetime: '2024-01-15 • 2:00 PM',
    address: '42 Maplewood Lane, Springfield, IL 62704, United States',
    note: 'Interested in Premium Plan',
  },
];

export default function LeadsList({ navigation }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const data = useMemo(() => {
    // Simple example filter logic
    const filtered = MOCK_LEADS.filter(l =>
      [l.company, l.name, l.phone, l.address, l.note]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    if (activeTab === 'all') return filtered;
    if (activeTab === 'today') return filtered; // plug in real filter for "today"
    if (activeTab === 'interested') return filtered.filter(l => l.status === 'Interested');
    return filtered;
  }, [query, activeTab]);

  const callNumber = phone => {
    // Linking.openURL(`tel:${phone}`) — leaving as a stub to keep this file UI-only
    console.log('Call:', phone);
  };

  const onEdit = lead => {
    // navigation?.navigate('EditLead', { id: lead.id });
    console.log('Edit:', lead.id);
  };

  const onMeet = lead => {
    // e.g., open calendar deep link
    console.log('Meet:', lead.id);
  };

  const renderTab = t => {
    const isActive = activeTab === t.key;
    return (
      <TouchableOpacity
        key={t.key}
        style={[
          styles.tabPill,
          {
            backgroundColor: isActive ? colors.ctaBackground : '#F5F5F5',
          },
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
          {t.label} ({t.count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeadRow}>
        <Text style={styles.company}>{item.company}</Text>

        <View
          style={[
            styles.badge,
            item.status === 'Interested'
              ? { backgroundColor: (colors.primaryLight ?? '#A8A3D7') + '33' }
              : { backgroundColor: '#E6F0FF' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.status === 'Interested'
                ? { color: colors.primary ?? '#281C9D' }
                : { color: '#5B7FFF' },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.separator} />

      {/* Person & Phone */}
      <View style={styles.rowBetween}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>

      {/* Address label + Date/Time */}
      <View style={styles.rowBetween}>
        <Text style={styles.mutedLabel}>Address</Text>
        <Text style={styles.datetime}>{item.datetime}</Text>
      </View>

      {/* Address */}
      <Text style={styles.address}>{item.address}</Text>

      {/* Notes */}
      <Text style={[styles.mutedLabel, { marginTop: 10 }]}>Notes</Text>
      <Text style={styles.note}>{item.note}</Text>

      {/* Actions */}
      <View style={styles.actionsRow}>
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
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>{TABS.map(renderTab)}</View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        showsVerticalScrollIndicator={false}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabPill: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    // shadowColor: '#000',
    // shadowOpacity: 0.05,
    // shadowRadius: 10,
    // shadowOffset: { width: 0, height: 4 },
    // elevation: 2,
  },
  cardHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  company: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F1F1',
    marginVertical: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  phone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  mutedLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  datetime: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  address: {
    marginTop: 2,
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
  },
  note: {
    marginTop: 4,
    fontSize: 13,
    color: '#111827',
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
