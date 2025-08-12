// HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Button
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // or from 'react-native-vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useEffect, useState } from 'react';


export default function HomeScreen() {

  // Auth Context
  const { user, logout } = useAuth();

  // Stats
  const [stats, setStats] = useState(null);

  const schedule = [
    { name: 'Rajesh Kumar', time: '2:00 PM', status: 'Ongoing' },
    { name: 'Rajesh Kumar', time: '2:00 PM', status: 'Start' },
  ];

  const activities = [
    {
      title: 'Meeting completed with mobile zone',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    },
    {
      title: 'Meeting completed with mobile zone',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }

        const res = await axios.get('http://192.168.1.48:8001/api/user-stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats(res.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <ScrollView>
      {/* Header */}
      <View>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://avatar.iran.liara.run/public/4' }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.subText}>Good Morning</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{user?.designation}</Text>
            </View>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity style={styles.notification}>
              <Ionicons name="notifications" size={22} color="#fff" />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logout} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.container}>

        {/* Actions */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addLeadButton}>
            <Ionicons name="add" size={20} color="#16a34a" />
            <Text style={styles.addLeadText}>Shift Start</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startMeetingButton}>
            <Ionicons name="time" size={20} color="#2563eb" />
            <Text style={styles.startMeetingText}>Start Break</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats && Object.entries(stats).map(([title, stat], index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statLabel}>{title}</Text>
              <View style={styles.statValueContainer}>
                <Text style={styles.statValue}>{stat}</Text>
                <MaterialIcons name="calendar-today" size={18} color="#f97316" />
              </View>
            </View>
          ))}
        </View>

        {/* Schedule */}
        <Text style={styles.sectionTitle}>Today’s Schedule</Text>
        {schedule.map((item, index) => (
          <View style={styles.scheduleItem} key={index}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleName}>{item.name}</Text>
              <Text style={styles.scheduleLocation}>At Mobile Zone</Text>
            </View>
            <Text style={styles.scheduleTime}>{item.time}</Text>
            <View
              style={[
                styles.statusTag,
                item.status === 'Ongoing'
                  ? styles.statusOngoing
                  : styles.statusStart,
              ]}
            >
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        ))}

        {/* Actions */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addLeadButton}>
            <Ionicons name="add" size={20} color="#16a34a" />
            <Text style={styles.addLeadText}>Add Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startMeetingButton}>
            <Ionicons name="time" size={20} color="#2563eb" />
            <Text style={styles.startMeetingText}>Start Meeting</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {activities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <Image
              source={{ uri: 'https://i.ibb.co/Fq2yzvJ/thumb.jpg' }}
              style={styles.thumb}
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.activityTitle}>
                {activity.title}
              </Text>
              <Text numberOfLines={1} style={styles.activityDesc}>
                {activity.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111214',
    paddingTop: 30,
    paddingBottom: 20.5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  avatar: { width: 50, height: 50, borderRadius: 100 },
  headerText: { flex: 1, marginLeft: 12, color: '#fff' },
  subText: { color: '#888', fontSize: 12 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  roleTag: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleText: { fontSize: 12, color: '#444' },
  notification: {
    backgroundColor: '#888',
    padding: 8,
    borderRadius: 20,
    position: 'relative',
  },
  logout: {
    backgroundColor: '#888',
    padding: 8,
    borderRadius: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  statLabel: { color: '#888', marginBottom: 6, textTransform: 'capitalize' },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },

  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  thumb: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  scheduleName: { fontWeight: 'bold' },
  scheduleLocation: { fontSize: 12, color: '#888' },
  scheduleTime: { fontSize: 12, color: '#666', marginHorizontal: 8 },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusOngoing: { backgroundColor: '#fef3c7' },
  statusStart: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#111' },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  addLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  startMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  addLeadText: { color: '#16a34a', marginLeft: 6, fontWeight: 'bold' },
  startMeetingText: { color: '#2563eb', marginLeft: 6, fontWeight: 'bold' },

  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  viewAllText: { color: '#2563eb', fontSize: 12 },

  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  activityTitle: { fontWeight: 'bold' },
  activityDesc: { fontSize: 12, color: '#666' },
});
