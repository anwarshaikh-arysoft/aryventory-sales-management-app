import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function VisitsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Visits</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' }
});
