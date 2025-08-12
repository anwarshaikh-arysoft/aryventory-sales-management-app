import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ChevronLeft, Search, Phone, Edit, Users } from 'lucide-react-native';

const LeadsScreen = () => {
  const leads = [
    {
      id: 1,
      company: "Mobile Zone",
      name: "Rajesh Kumar",
      phone: "+91 0934569854",
      address: "42 Maplewood Lane, Springfield, IL 62704, United States",
      date: "2024-01-15",
      time: "2:00 PM",
      notes: "Interested in Premium Plan",
      status: "Interested"
    },
    {
      id: 2,
      company: "Mobile Zone",
      name: "Rajesh Kumar",
      phone: "+91 0934569854",
      address: "42 Maplewood Lane, Springfield, IL 62704, United States",
      date: "2024-01-15",
      time: "2:00 PM",
      notes: "Interested in Premium Plan",
      status: "Follow-Up"
    }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Interested':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' }; // blue
      case 'Follow-Up':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' }; // blue
      default:
        return { backgroundColor: '#E5E7EB', color: '#374151' }; // gray
    }
  };

  const renderLead = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={[styles.status, { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color }]}>
            {item.status}
          </Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactRow}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>

        {/* Address */}
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.label}>{item.date} • {item.time}</Text>
          </View>
          <Text style={styles.addressText}>{item.address}</Text>
        </View>

        {/* Notes */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#22C55E' }]}>
            <Phone size={18} color="white" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}>
            <Edit size={18} color="white" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F97316' }]}>
            <Users size={18} color="white" />
            <Text style={styles.actionText}>Meet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Leads</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F97316' }]}>
          <Search size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLead}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

export default LeadsScreen;

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
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  company: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  status: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden'
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  contactName: { fontWeight: '500', color: '#111827' },
  phone: { color: '#111827' },
  addressSection: { marginBottom: 8 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, color: '#6B7280' },
  addressText: { fontSize: 14, color: '#374151' },
  notesText: { fontSize: 14, color: '#374151' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8
  },
  actionText: { color: 'white', fontWeight: '500', marginLeft: 6 }
});