// components/userStats.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { View, Button, Text, StyleSheet, } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import BASE_URL from '../config';


export default function UserLeadStatusBreakdown() {

    // Auth Context
    const { user, logout } = useAuth();

    // Stats State
    const [stats, setStats] = useState([]);

    // Fetch user stats
    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const res = await axios.get(`${BASE_URL}/sales-executive/lead-counts-by-status`, {
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

    // Color mapping for each status
    const statusColors = {
        "Sold": { bg: "#E6F7E6", text: "#34C759" },
        "Interested": { bg: "#E6F2FF", text: "#007AFF" },
        "Follow-Up": { bg: "#FFF2E6", text: "#FF8C00" },
        "Not Interested": { bg: "#FFE6E6", text: "#FF3B30" },
        "Visit Again": { bg: "#F0E6FF", text: "#8E44AD" } // added for your new status
    };

    // Total leads for percentage calculation
    const totalLeads = stats.reduce((sum, item) => sum + item.total, 0);


    return (
        <>
            {/* Stats */}
            <View style={styles.statusContainer}>
                <Text style={styles.sectionTitle}>Lead Status Breakdown</Text>

                {!stats || stats.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#666' }}>No lead data available.</Text>
                ) :
                    stats.map((item, index) => {
                        const colors = statusColors[item.status_name] || { bg: "#EEE", text: "#333" }; // fallback
                        const percentage = totalLeads > 0 ? ((item.total / totalLeads) * 100).toFixed(1) : 0;

                        return (
                            <View key={index} style={styles.statusItem}>
                                <Text style={styles.statusLabel}>{item.status_name}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                                    <Text style={[styles.statusText, { color: colors.text }]}>
                                        {item.total} ({percentage}%)
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                }

            </View>
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
        marginTop: 8,
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
})
