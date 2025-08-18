import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Calendar, Phone, DollarSign } from 'lucide-react-native';

const ActivityTimelineScreen = ({ navigation }) => {
  const activities = [
    {
      id: 1,
      type: 'meeting',
      icon: Calendar,
      title: 'Meeting Completed with Mobile Zone',
      description: 'Interested in Premium Plan, demo scheduled',
      time: '2 hours ago',
      iconBg: '#FEF3C7', // bg-yellow-100
      iconColor: '#CA8A04' // text-yellow-600
    },
    {
      id: 2,
      type: 'call',
      icon: Phone,
      title: 'Follow-Up call to Tech Electronics',
      description: 'Will decide by next week',
      time: '2 hours ago',
      iconBg: '#D1FAE5', // bg-green-100
      iconColor: '#059669' // text-green-600
    },
    {
      id: 3,
      type: 'sale',
      icon: DollarSign,
      title: 'Sold Standard Plan to Digital world',
      description: '₹999/month subscription confirmed 1 day ago',
      time: '2 hours ago',
      iconBg: '#D1FAE5', // bg-green-100
      iconColor: '#059669' // text-green-600
    }
  ];

  const ActivityItem = ({ activity }) => {
    const IconComponent = activity.icon;
    return (
      <View style={styles.activityContainer}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: activity.iconBg }]}>
          <IconComponent size={20} color={activity.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
            </View>
            <Text style={styles.activityTime}>{activity.time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Timeline</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </ScrollView>
    </View>
  );
};

export default ActivityTimelineScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backButton: {
    padding: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  activityContent: {
    flex: 1
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  activityDescription: {
    fontSize: 14,
    color: '#4B5563'
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8
  }
});