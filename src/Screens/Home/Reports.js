import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ChevronLeft, Download, Calendar } from 'lucide-react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import BASE_URL from '../../config';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import React, { useEffect, useState } from 'react';
import UserStats from '../../components/UserStats';
import UserLeadStatusBreakdown from '../../components/UserLeadStatusBreakdown';

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

const ReportsDashboard = ({ bgColor }) => {

  // Auth Context
  const { user, logout } = useAuth();

  // Stats State
  const [stats, setStats] = useState(null);

  // Fetch user stats
  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const res = await axios.get(`${BASE_URL}/user-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Time Filter Tabs */}
        {/* 
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
        */}

        {/* My Stats Section */}
        {/* <UserStats /> */}

        {/* Daily Activity Section */}

        {
          stats && (
            <>
              <View style={[styles.activityContainer, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>Daily Activity</Text>
                <View style={styles.activityItemContainer}>
                  <View style={styles.activityItem}>
                    <CircularProgress percentage={40} color="#34C759" size={80}>
                      <Text style={styles.progressText}>{stats['meeting']} / {stats['meeting target']}</Text>
                    </CircularProgress>
                    <Text style={styles.activityLabel}>Visit Completed</Text>
                  </View>

                  {/* 
                    <View style={styles.activityItem}>
                    <CircularProgress percentage={42} color="#FF6B35" size={80}>
                      <Text style={styles.progressText}>5/12</Text>
                    </CircularProgress>
                    <Text style={styles.activityLabel}>Follow-ups Due</Text>
                  </View> 
                  */}
                </View>
              </View>
            </>
          )
        }

        {/* Lead Status Breakdown */}

        <UserLeadStatusBreakdown />

        {/* Revenue by Plan */}
        <View style={styles.revenueContainer}>
          <Text style={styles.sectionTitle}>Monthly Revenue by Plan</Text>
          {
            stats && stats['revenueByPlan'].map((item, index) => (
              <View style={styles.revenueItem} key={index}>
                <View>
                  <Text style={styles.planName}>{item['plan_interest']}</Text>
                  <Text style={styles.planDetails}>{item['leads_count']} Sales</Text>
                </View>
                <Text style={[styles.revenueAmount, { color: '#34C759' }]}>₹{item['revenue']}</Text>
              </View>
            ))
          }

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  activityItemContainer: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%'
  },
  activityItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
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