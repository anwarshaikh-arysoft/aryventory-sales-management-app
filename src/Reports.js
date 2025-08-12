import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ChevronLeft, Download, Calendar } from 'lucide-react-native';

const CircularProgress = ({ percentage, color, size = 60, strokeWidth = 6, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <View 
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#f0f0f0',
          }}
        />
        <View 
          style={[
            StyleSheet.absoluteFillObject,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ rotate: `${(percentage / 100) * 360 - 90}deg` }]
            }
          ]}
        />
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
};

const ReportsDashboard = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity style={styles.downloadButton}>
          <Download size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Filter Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>This Month</Text>
          </TouchableOpacity>
        </View>

        {/* My Stats Section */}
        <Text style={styles.sectionTitle}>My Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Leads</Text>
              <Calendar size={16} color="#FF6B35" />
            </View>
            <Text style={styles.statValue}>156</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Conversion</Text>
              <Calendar size={16} color="#FF6B35" />
            </View>
            <Text style={styles.statValue}>42</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Success</Text>
              <Calendar size={16} color="#FF6B35" />
            </View>
            <Text style={[styles.statValue, { color: '#007AFF' }]}>26.9%</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Calendar size={16} color="#FF6B35" />
            </View>
            <Text style={[styles.statValue, { color: '#34C759' }]}>₹1,24,000</Text>
          </View>
        </View>

        {/* Daily Activity Section */}
        <Text style={styles.sectionTitle}>Daily Activity</Text>
        
        <View style={styles.activityContainer}>
          <View style={styles.activityItem}>
            <CircularProgress percentage={80} color="#34C759" size={80}>
              <Text style={styles.progressText}>8/10</Text>
            </CircularProgress>
            <Text style={styles.activityLabel}>Visit Completed</Text>
          </View>
          
          <View style={styles.activityItem}>
            <CircularProgress percentage={60} color="#007AFF" size={80}>
              <Text style={styles.progressText}>12/20</Text>
            </CircularProgress>
            <Text style={styles.activityLabel}>Calls Made</Text>
          </View>
          
          <View style={styles.activityItem}>
            <CircularProgress percentage={42} color="#FF6B35" size={80}>
              <Text style={styles.progressText}>5/12</Text>
            </CircularProgress>
            <Text style={styles.activityLabel}>Follow-ups Due</Text>
          </View>
        </View>

        {/* Lead Status Breakdown */}
        <Text style={styles.sectionTitle}>Lead Status Breakdown</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Sold</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#E6F7E6' }]}>
              <Text style={[styles.statusText, { color: '#34C759' }]}>12 (25.5%)</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Interested</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#E6F2FF' }]}>
              <Text style={[styles.statusText, { color: '#007AFF' }]}>15 (31.9%)</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Follow-Up</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FFF2E6' }]}>
              <Text style={[styles.statusText, { color: '#FF8C00' }]}>12 (25.5%)</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Not Interested</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FFE6E6' }]}>
              <Text style={[styles.statusText, { color: '#FF3B30' }]}>8 (17.0%)</Text>
            </View>
          </View>
        </View>

        {/* Revenue by Plan */}
        <Text style={styles.sectionTitle}>Revenue by Plan</Text>
        
        <View style={styles.revenueContainer}>
          <View style={styles.revenueItem}>
            <View>
              <Text style={styles.planName}>Premium Plan</Text>
              <Text style={styles.planDetails}>5 Sales</Text>
            </View>
            <Text style={[styles.revenueAmount, { color: '#34C759' }]}>₹24,000</Text>
          </View>
          
          <View style={styles.revenueItem}>
            <View>
              <Text style={styles.planName}>Standard Plan</Text>
              <Text style={styles.planDetails}>6 Sales</Text>
            </View>
            <Text style={[styles.revenueAmount, { color: '#34C759' }]}>₹18,000</Text>
          </View>
          
          <View style={styles.revenueItem}>
            <View>
              <Text style={styles.planName}>Free Plan</Text>
              <Text style={styles.planDetails}>1 Upgrade</Text>
            </View>
            <Text style={[styles.revenueAmount, { color: '#34C759' }]}>₹6,000</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  downloadButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFE8DC',
  },
  activeTab: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  activityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 16,
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  revenueContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  planDetails: {
    fontSize: 14,
    color: '#666',
  },
  revenueAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ReportsDashboard;