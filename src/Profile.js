import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const ProfileScreen = () => {
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
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

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
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        {/* Status Bar Simulation */}
        <View style={styles.statusBar}>
          <Text style={styles.statusTime}>9:41</Text>
          <View style={styles.statusIcons}>
            <View style={styles.signalBars}>
              <View style={styles.signalBar} />
              <View style={styles.signalBar} />
              <View style={styles.signalBar} />
              <View style={styles.signalBar} />
            </View>
            <View style={styles.wifiIcon} />
            <View style={styles.batteryIcon} />
          </View>
        </View>

        {/* Navigation Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Good Morning</Text>
              <Text style={styles.userName}>Rahul Sharma</Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>ID: EXE001</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.contentSection} showsVerticalScrollIndicator={false}>
        {/* My Stats Section */}
        <Text style={styles.sectionTitle}>My Stats</Text>
        
        <View style={styles.statsGrid}>
          <StatCard title="Total Leads" value="156" />
          <StatCard title="Conversion" value="42" />
        </View>

        <View style={styles.statsGrid}>
          <StatCard title="Success" value="26.9%" valueColor="#3b82f6" />
          <StatCard title="Revenue" value="₹1,24,000" valueColor="#10b981" />
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Setting</Text>
        
        <View style={styles.settingsContainer}>
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
          <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync Data Now</Text>
          </TouchableOpacity>
          
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4b5563',
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsContainer: {
    marginBottom: 32,
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
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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