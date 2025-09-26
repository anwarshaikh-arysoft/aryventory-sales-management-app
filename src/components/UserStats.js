// components/userStats.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { View, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import BASE_URL from '../config';
import { useNavigation } from '@react-navigation/native';


export default function UserStats({ bgColor }) {

    // Auth Context
    const { user, logout } = useAuth();
    const navigation = useNavigation();

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

    // Navigation handler - same logic as HomeScreen
    function handleNavigation(title) {
        let tab;
        if (title == 'total leads') {
            tab = 'all'
        }
        else if (title == 'sold') {
            tab = 5
        }
        else if (title == 'today') {
            tab = 'today'
        }
        if (title == 'target' || title == 'revenue target') { navigation.navigate('Reports') }
        else if (title == 'follow up target') { navigation.navigate('Reports') }
        else navigation.navigate('leadlist', { tab: tab })
    }


    return (
        <>
            {/* My Stats Section */}

            {stats && (
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>Monthly Stats</Text>
                    <View style={styles.statsGrid}>
                        <TouchableOpacity onPress={() => navigation.navigate('leadlist', { tab: 'all' })} style={[styles.statCard, { backgroundColor: bgColor }]}>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statLabel}>Total Leads</Text>
                                <View style={styles.labelContainer}>
                                    <MaterialIcons name="domain" size={18} color="#f97316" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stats['total leads']}</Text>
                            <Text style={styles.statLabel}>/ {stats['total leads']}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('leadlist', { tab: 5 })} style={[styles.statCard, { backgroundColor: bgColor }]}>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statLabel}>Sold</Text>
                                <View style={styles.labelContainer}>
                                    <MaterialIcons name="emoji-events" size={18} color="#f97316" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stats['sold']}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('leadlist', { tab: 'today' })} style={[styles.statCard, { backgroundColor: bgColor }]}>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statLabel}>Today's Follow Up</Text>
                                <View style={styles.labelContainer}>
                                    <MaterialIcons name="calendar-today" size={18} color="#f97316" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stats['follow ups']}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Reports')} style={[styles.statCard, { backgroundColor: bgColor }]}>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statLabel}>Target</Text>
                                <View style={styles.labelContainer}>
                                    <MaterialIcons name="track-changes" size={18} color="#f97316" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stats['sold']}</Text>
                            <Text style={styles.statLabel}>/ {stats['target']}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Reports')} style={[styles.statCard, { backgroundColor: bgColor }]}>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statLabel}>Revenue Target</Text>
                                <View style={styles.labelContainer}>
                                    <MaterialIcons name="price-change" size={18} color="#f97316" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stats['revenue']}</Text>
                            <Text style={styles.statLabel}>/ {stats['revenue target']}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('MeetingHistory')} style={[styles.statCard, { backgroundColor: bgColor }]}>
                            <View style={styles.statValueContainer}>
                                <Text style={styles.statLabel}>Meetings Target</Text>
                                <View style={styles.labelContainer}>
                                    <MaterialIcons name="handshake" size={18} color="#f97316" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{stats['meeting']}</Text>
                            <Text style={styles.statLabel}>/ {stats['meeting target']}</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flex: 1,
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statLabel: { flexShrink: 1, color: '#888', marginBottom: 6, textTransform: 'capitalize' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    labelContainer: {
        padding: 5,
        borderRadius: 4,
        backgroundColor: '#f9731620',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
})
