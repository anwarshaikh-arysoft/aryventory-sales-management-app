import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

const NotificationScreen = () => {
  const notifications = [
    {
      id: 1,
      title: 'Meeting Reminder',
      description: 'Mobile zone meeting in 30 minutes',
      time: '28 min ago',
      color: 'green'
    },
    {
      id: 2,
      title: 'New Lead Assigned',
      description: 'Smart Electronics - Visit scheduled for tomorrow',
      time: '2 hours ago',
      color: 'blue'
    }
  ];

  const getDotColor = (color) => {
    return color === 'green' ? '#22C55E' : '#3B82F6';
  };

  const renderNotification = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: getDotColor(item.color) }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mark All Read */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'flex-end' }}>
        <TouchableOpacity>
          <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  header: {
    marginTop: 50,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  row: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  time: { fontSize: 12, color: '#6B7280' },
  description: { fontSize: 14, color: '#374151' }
});