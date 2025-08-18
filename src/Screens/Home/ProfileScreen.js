import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  StatusBar,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import BASE_URL from '../../config';
import axios from 'axios';

const ProfileScreen = () => {

  // Auth Context
  const { user, logout } = useAuth();

  // Stats State
  const [stats, setStats] = useState(null);

  const [settings, setSettings] = useState({
    locationTracking: true,
    pushNotification: true,
    autoSync: false
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleSetting = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    // Add your logout logic here
    console.log('User logged out');
    setShowLogoutModal(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

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

  // Fetch user settings from AsyncStorage
  useEffect(() => {
    const fetchSettings = async () => {
      try {        
        const storedSettings = await AsyncStorage.getItem('userSettings');
        console.log('Stored Settings:', storedSettings);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const CustomToggleSwitch = ({ isOn, onToggle }) => {
    return (
      <TouchableOpacity
        onPress={onToggle}
        style={[
          styles.toggleContainer,
          { backgroundColor: isOn ? '#ff6b35' : '#e5e7eb' }
        ]}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.toggleCircle,
            {
              transform: [{ translateX: isOn ? 22 : 2 }]
            }
          ]}
        />
      </TouchableOpacity>
    );
  };

  const StatCard = ({ title, value, valueColor = '#111827', icon = 'calendar-outline' }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Ionicons name={icon} size={16} color="#ff6b35" />
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111214" />

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
          </View>
        </View>
      </View>

      <ScrollView style={styles.contentSection} showsVerticalScrollIndicator={false}>
        {/* My Stats Section */}
        <Text style={styles.sectionTitle}>My Stats</Text>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats && Object.entries(stats).map(([title, stat], index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statValueContainer}>
                <Text style={styles.statLabel}>{title}</Text>
                <MaterialIcons name="calendar-today" size={18} color="#f97316" />
              </View>
              <Text style={styles.statValue}>{title == 'target' ? stats['sold'] + ' /' : ''} {stat}</Text>
            </View>
          ))}
        </View>

        {/* Settings Section */}

        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Location Tracking</Text>
            <CustomToggleSwitch
              isOn={settings.locationTracking}
              onToggle={() => toggleSetting('locationTracking')}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Notification</Text>
            <CustomToggleSwitch
              isOn={settings.pushNotification}
              onToggle={() => toggleSetting('pushNotification')}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto Sync</Text>
            <CustomToggleSwitch
              isOn={settings.autoSync}
              onToggle={() => toggleSetting('autoSync')}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>

          {/* <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync Data Now</Text>
          </TouchableOpacity> */}


          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutClick}
          >
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="logout" size={32} color="#ef4444" />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Logout</Text>

            {/* Message */}
            <Text style={styles.modalMessage}>
              Are sure you want to Logout
            </Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.confirmButtonText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111214',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statLabel: { color: '#888', marginBottom: 6, textTransform: 'capitalize' },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  // New
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
  headerSection: {
    backgroundColor: '#111827',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statusTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalBars: {
    flexDirection: 'row',
    gap: 1,
  },
  signalBar: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  wifiIcon: {
    width: 16,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginLeft: 4,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  profileInfo: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  idBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  idText: {
    color: '#fff',
    fontSize: 14,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    color: '#6b7280',
    fontSize: 14,
  },
  settingsContainer: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  actionButtons: {
    gap: 16,
    paddingBottom: 32,
  },
  syncButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#fef2f2',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;