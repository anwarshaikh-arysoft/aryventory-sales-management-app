// components/userStats.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { View, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import BASE_URL from '../config';
import { useNavigation } from '@react-navigation/native';


export default function UserStats() {

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
            tab = 'sold'
        }
        else {
            tab = 'today'
        }
        if (title == 'target') navigation.navigate('Reports')
        else navigation.navigate('leadlist', { tab: tab })
    }


    return (
        <>
            {/* My Stats Section */}
            <Text style={styles.sectionTitle}>Monthly Stats</Text>

            {/* Stats */}
            <View style={styles.statsGrid}>
                {stats && Object.entries(stats).map(([title, stat], index) => (
                    <TouchableOpacity onPress={() => handleNavigation(title)} key={index} style={styles.statCard}>
                        <View style={styles.statValueContainer}>
                            <Text style={styles.statLabel}>{title}</Text>
                            <MaterialIcons name="calendar-today" size={18} color="#f97316" />
                        </View>
                        <Text style={styles.statValue}>{title == 'target' ? stats['sold'] + ' /' : ''} {stat}</Text>
                    </TouchableOpacity>
                ))}
            </View>
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
    statLabel: { color: '#888', marginBottom: 6, textTransform: 'capitalize' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
})
