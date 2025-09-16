import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Image, Modal, Dimensions, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Audio } from 'expo-av';
import BASE_URL from '../../config';

export default function ShowLead() {
    const navigation = useNavigation();
    const route = useRoute();
    const { lead } = route.params;
    const MediaURL = `https://sales-aryventory.s3.ap-south-1.amazonaws.com`;
    
    const [leadDetails, setLeadDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [meetings, setMeetings] = useState([]);
    
    // Media states
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [playingAudio, setPlayingAudio] = useState(null);
    const [audioStates, setAudioStates] = useState({});



    const openLocation = () => {
        const [lat, lng] = lead.gps_location.split(',');
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(url);
    };

    const callNumber = () => {
        Linking.openURL(`tel:${lead.mobile_number}`);
    };

    const fetchLeadDetails = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'No token found');
                return;
            }

            const response = await axios.get(`${BASE_URL}/leads/${lead.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            setLeadDetails(response.data);
            setMeetings(response.data.meetings || []);
        } catch (error) {
            console.error('Error fetching lead details:', error);
            Alert.alert('Error', 'Failed to fetch lead details');
        } finally {
            setLoading(false);
        }
    };

    const openMeetingLocation = (latitude, longitude) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url);
    };

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    const playAudio = async (audioUrl, audioId) => {
        try {
            // Stop any currently playing audio
            if (playingAudio) {
                await playingAudio.unloadAsync();
                setPlayingAudio(null);
            }

            // Load and play new audio
            const { sound } = await Audio.Sound.createAsync(
                { uri: `${MediaURL}/${audioUrl}` },
                { shouldPlay: true }
            );
            
            setPlayingAudio(sound);
            setAudioStates(prev => ({ ...prev, [audioId]: 'playing' }));
            
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setAudioStates(prev => ({ ...prev, [audioId]: 'stopped' }));
                    setPlayingAudio(null);
                }
            });
        } catch (error) {
            console.error('Error playing audio:', error);
            Alert.alert('Error', 'Unable to play audio');
        }
    };

    const stopAudio = async (audioId) => {
        try {
            if (playingAudio) {
                await playingAudio.unloadAsync();
                setPlayingAudio(null);
                setAudioStates(prev => ({ ...prev, [audioId]: 'stopped' }));
            }
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    };

    const openImageGallery = (images, startIndex = 0) => {
        setSelectedImages(images);
        setCurrentImageIndex(startIndex);
        setImageModalVisible(true);
    };

    const renderImageModal = () => {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;

        return (
            <Modal
                visible={imageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.imageModalContainer}>
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    
                    <FlatList
                        data={selectedImages}
                        horizontal
                        pagingEnabled
                        initialScrollIndex={currentImageIndex}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => `image-${index}`}
                        renderItem={({ item }) => (
                            <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center' }}>
                                <Image 
                                    source={{ uri: `${MediaURL}/${item.media}` }}
                                    style={styles.fullScreenImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                            setCurrentImageIndex(index);
                        }}
                    />
                    
                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {currentImageIndex + 1} of {selectedImages.length}
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderMeetingCard = (meeting, index) => {
        const startDateTime = formatDateTime(meeting.meeting_start_time);
        const endDateTime = formatDateTime(meeting.meeting_end_time);
        
        return (
            <View key={meeting.id} style={styles.meetingCard}>
                <View style={styles.meetingHeader}>
                    <Text style={styles.meetingTitle}>Meeting #{meetings.length - index}</Text>
                    <View style={styles.meetingDuration}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.durationText}>
                            {startDateTime.time} - {endDateTime.time}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.meetingDate}>{startDateTime.date}</Text>
                
                {/* Location */}
                <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={() => openMeetingLocation(meeting.meeting_start_latitude, meeting.meeting_start_longitude)}
                >
                    <Ionicons name="location-outline" size={16} color="#3B82F6" />
                    <Text style={styles.locationText}>View Meeting Location</Text>
                </TouchableOpacity>
                
                {/* Notes */}
                {meeting.meeting_end_notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.notesText}>{meeting.meeting_end_notes}</Text>
                    </View>
                )}
                
                {/* Media Section */}
                <View style={styles.mediaSection}>
                    {/* Recorded Audios */}
                    {meeting.recorded_audios && meeting.recorded_audios.length > 0 && (
                        <View style={styles.mediaGroup}>
                            <Text style={styles.mediaGroupTitle}>Audio Recordings</Text>
                            {meeting.recorded_audios.map((audio, audioIndex) => {
                                const audioId = `${meeting.id}-audio-${audioIndex}`;
                                const isPlaying = audioStates[audioId] === 'playing';
                                
                                return (
                                    <TouchableOpacity 
                                        key={audioIndex}
                                        style={styles.audioItem}
                                        onPress={() => isPlaying ? stopAudio(audioId) : playAudio(audio.media, audioId)}
                                    >
                                        <Ionicons 
                                            name={isPlaying ? "pause-circle" : "play-circle"} 
                                            size={24} 
                                            color="#10B981" 
                                        />
                                        <Text style={styles.audioText}>
                                            Recording {audioIndex + 1} {isPlaying ? '(Playing...)' : ''}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                    
                    {/* Selfies */}
                    {meeting.selfies && meeting.selfies.length > 0 && (
                        <View style={styles.mediaGroup}>
                            <Text style={styles.mediaGroupTitle}>Selfies</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.imageRow}>
                                    {meeting.selfies.map((selfie, selfieIndex) => (
                                        <TouchableOpacity 
                                            key={selfieIndex}
                                            onPress={() => openImageGallery(meeting.selfies, selfieIndex)}
                                        >
                                            <Image 
                                                source={{ uri: `${MediaURL}/${selfie.media}` }}
                                                style={styles.thumbnailImage}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                    
                    {/* Shop Photos */}
                    {meeting.shop_photos && meeting.shop_photos.length > 0 && (
                        <View style={styles.mediaGroup}>
                            <Text style={styles.mediaGroupTitle}>Shop Photos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.imageRow}>
                                    {meeting.shop_photos.map((photo, photoIndex) => (
                                        <TouchableOpacity 
                                            key={photoIndex}
                                            onPress={() => openImageGallery(meeting.shop_photos, photoIndex)}
                                        >
                                            <Image 
                                                source={{ uri: `${MediaURL}/${photo.media}` }}
                                                style={styles.thumbnailImage}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    useEffect(() => {
        fetchLeadDetails();
        
        // Setup audio
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
        
        // Cleanup function
        return () => {
            if (playingAudio) {
                playingAudio.unloadAsync();
            }
        };
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading...</Text>
            </View>
        );
    }

    

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>  
                {/* Assigned by */}
                <View style={styles.assignedBy}>
                    <Text style={styles.assignedByText}>Assigned by: {leadDetails.created_by_user?.name}</Text>
                </View>

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

            {/* Meetings Section */}
            {meetings.length > 0 && (
                <View style={styles.meetingsSection}>
                    <Text style={styles.sectionTitle}>Meeting History ({meetings.length})</Text>
                    {meetings.map((meeting, index) => renderMeetingCard(meeting, index))}
                </View>
            )}

            {/* All Leads */}
            <TouchableOpacity
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={() => navigation.navigate('leadlist')}
            >
                <Text style={{ color: '#3B82F6', fontSize: 16 }}>View All Leads</Text>
            </TouchableOpacity>
            </ScrollView>
            
            {/* Image Modal */}
            {renderImageModal()}
        </View>
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
    meetingsSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    meetingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    meetingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    meetingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    meetingDuration: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        fontSize: 12,
        color: '#6B7280',
    },
    meetingDate: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 12,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    locationText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '500',
    },
    notesSection: {
        marginBottom: 12,
    },
    notesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 14,
        color: '#111827',
        lineHeight: 20,
    },
    mediaSection: {
        gap: 16,
    },
    mediaGroup: {
        marginBottom: 12,
    },
    mediaGroupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    audioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    audioText: {
        fontSize: 14,
        color: '#065F46',
        fontWeight: '500',
    },
    imageRow: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 16,
    },
    thumbnailImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    imageModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    fullScreenImage: {
        width: '90%',
        height: '70%',
        alignSelf: 'center',
    },
    imageCounter: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    imageCounterText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    assignedBy: {
        marginBottom: 12,
    },
    assignedByText: {
        fontSize: 14,
        color: '#4B5563',
    },
});
