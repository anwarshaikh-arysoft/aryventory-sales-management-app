import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Orders</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' }
});
