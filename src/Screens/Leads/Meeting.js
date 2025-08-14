// MeetingScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function MeetingScreen() {
  const route = useRoute();
  const { lead } = route.params || {}; // safely get lead

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Meeting Details</Text>
      {lead ? (
        <View style={styles.card}>
          <Text><Text style={styles.label}>Lead Name:</Text> {lead.contact_person}</Text>
          <Text><Text style={styles.label}>Shop Name:</Text> {lead.shop_name}</Text>
          <Text><Text style={styles.label}>Mobile:</Text> {lead.mobile_number}</Text>
          <Text><Text style={styles.label}>Next Follow-Up:</Text> {lead.next_follow_up_date}</Text>
          <Text><Text style={styles.label}>Meeting Notes:</Text> {lead.meeting_notes || '-'}</Text>
        </View>
      ) : (
        <Text>No lead data available.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 50,
    flexGrow: 1,
    backgroundColor: '#F6F6F6',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
  },
});
