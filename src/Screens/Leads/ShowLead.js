import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ShowLead() {
    const navigation = useNavigation();
    const route = useRoute();
    const { lead } = route.params;

    const openLocation = () => {
        const [lat, lng] = lead.gps_location.split(',');
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(url);
    };

    const callNumber = () => {
        Linking.openURL(`tel:${lead.mobile_number}`);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                {/* Title and status */}
                <View style={styles.header}>
                    <Text style={styles.shopName}>{lead.shop_name}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{lead.lead_status_data?.name}</Text>
                    </View>
                </View>

                {/* Contact info */}
                <Text style={styles.contactPerson}>{lead.contact_person}</Text>
                <Text style={styles.mobileNumber}>+{lead.mobile_number}</Text>

                {/* Address */}
                <View style={styles.section}>
                    <Text style={styles.label}>Address</Text>
                    <Text style={styles.value}>{lead.address}</Text>
                </View>

                {/* Plan Interest */}
                {lead.plan_interest ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>Plan Interest</Text>
                        <Text style={styles.value}>{lead.plan_interest}</Text>
                    </View>
                ) : null}

                {/* Next Follow-up Date */}
                {lead.next_follow_up_date ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>Next Follow-up</Text>
                        <Text style={styles.value}>{lead.next_follow_up_date}</Text>
                    </View>
                ) : null}

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.label}>Notes</Text>
                    <Text style={styles.value}>{lead.meeting_notes || '-'}</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#22C55E' }]}
                        onPress={callNumber}
                    >
                        <Ionicons name="call-outline" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#3B82F6' }]}
                        onPress={openLocation}
                    >
                        <Ionicons name="location-outline" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Locate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#F97316' }]}
                        onPress={() => navigation.navigate('Meeting', { lead })}
                    >
                        <Ionicons name="people-outline" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Meet</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* All Leads */}
            <TouchableOpacity
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={() => navigation.navigate('leadlist')}
            >
                <Text style={{ color: '#3B82F6', fontSize: 16 }}>View All Leads</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#F6F6F6',
        flexGrow: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        // shadowColor: '#000',
        // shadowOpacity: 0.1,
        // shadowOffset: { width: 0, height: 1 },
        // shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statusBadge: {
        backgroundColor: '#DBEAFE',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 12,
    },
    contactPerson: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    mobileNumber: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 12,
    },
    section: {
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        color: '#111827',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 12,
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 4,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    map: {
        flex: 1,
    },
});
