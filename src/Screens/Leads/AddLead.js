// src/Leads/AddLead.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Button,
    Platform,
    Modal,
    FlatList,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureLocation } from '../../utils/LocationCapture';
import { colors } from '../../../theme/colors';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';

export default function AddLead({ navigation }) {
    const steps = ['Shop Information', 'Location Details', 'Business Details'];
    const [step, setStep] = useState(1);
    const [location, setLocation] = useState({ latitude: '', longitude: '' });

    const [date, setDate] = useState(new Date());
    const [show, setShow] = useState(false);
    
    // Location picker modal states
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 19.0760, // Default to Mumbai
        longitude: 72.8777,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [manualLatitude, setManualLatitude] = useState('');
    const [manualLongitude, setManualLongitude] = useState('');
    const [showManualEntry, setShowManualEntry] = useState(false);

    //dropdown data states
    const [business_type, setBusinessType] = useState([]);
    const [lead_status, setLeadStatus] = useState([]);
    const [plan_data, setPlan_data] = useState([]);
    const [system_data, setSystem_data] = useState([]);

    // get Business types list
    const getBusinessData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/business-types`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const businessArray = response.data.data;
            setBusinessType(businessArray);

        } catch (error) {
            console.error('Error fetching business types:', error);
            throw error;
        }
    };

    // get Lead status list
    const getLeadStatusData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/lead-statuses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            const data = await response.data.data;
            setLeadStatus(data);
        } catch (error) {
            console.error('Error fetching lead statuses:', error);
            throw error;
        }
    };

    // Get plans list
    const getPlansData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/plans`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            const data = await response.data.data;
            setPlan_data(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            throw error;
        }
    };

    // Get current list of system client might be using
    const getSystemData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/current-systems`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            const data = await response.data.data;
            setSystem_data(data);
        } catch (error) {
            console.error('Error fetching current systems:', error);
            throw error;
        }
    };

    useEffect(() => {
        getBusinessData();
        getLeadStatusData();
        getPlansData();
        getSystemData();
    }, []);

    const onChange = (event, selectedDate) => {
        if (selectedDate) {
            setShow(Platform.OS === 'ios'); // for iOS keep picker open, Android auto closes
            setDate(selectedDate);

            // format YYYY-MM-DD
            const formatted = selectedDate.toISOString().split("T")[0];
            handleChange('next_follow_up_date', formatted);
        } else {
            setShow(false);
        }
    };

    const updateLocation = async () => {
        const coords = await captureLocation();
        if (coords) {
            const locationString = `${coords.latitude},${coords.longitude}`;
            setLocation({ latitude: coords.latitude, longitude: coords.longitude });
            setFormData(prev => ({
                ...prev,
                gps_location: locationString
            }));
        }
    };

    // Location picker functions
    const openLocationPicker = () => {
        setLocationModalVisible(true);
        // If there's already a GPS location, center the map on it
        if (formData.gps_location) {
            const [lat, lng] = formData.gps_location.split(',');
            if (lat && lng) {
                setMapRegion({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                });
                setSelectedLocation({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                });
            }
        }
    };

    const searchLocation = async (query) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Try multiple geocoding services for better reliability
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'AryventoryApp/1.0',
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format');
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Location search error:', error);
            
            // Provide fallback options
            if (error.name === 'AbortError') {
                Alert.alert('Search Timeout', 'Location search timed out. Please try again or use the map to select a location.');
            } else if (error.message.includes('Network request failed')) {
                Alert.alert('Network Error', 'Unable to search locations. Please check your internet connection or use the map to select a location.');
            } else {
                Alert.alert('Search Error', 'Unable to search locations. Please use the map to select a location manually.');
            }
            
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result) => {
        const coords = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
        };
        setSelectedLocation(coords);
        setMapRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        setSearchQuery(result.display_name);
        setSearchResults([]);
    };

    const onMapPress = (event) => {
        const coords = event.nativeEvent.coordinate;
        setSelectedLocation(coords);
        setMapRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    };

    const confirmLocation = () => {
        if (selectedLocation) {
            const locationString = `${selectedLocation.latitude},${selectedLocation.longitude}`;
            setFormData(prev => ({
                ...prev,
                gps_location: locationString
            }));
            setLocationModalVisible(false);
            setSearchQuery('');
            setSearchResults([]);
        } else {
            Alert.alert('No Location Selected', 'Please select a location on the map or search for an address.');
        }
    };

    const getCurrentLocation = async () => {
        try {
            const coords = await captureLocation();
            if (coords) {
                setSelectedLocation(coords);
                setMapRegion({
                    ...coords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to get current location');
        }
    };

    const handleManualCoordinateEntry = () => {
        const lat = parseFloat(manualLatitude);
        const lng = parseFloat(manualLongitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values.');
            return;
        }
        
        if (lat < -90 || lat > 90) {
            Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90 degrees.');
            return;
        }
        
        if (lng < -180 || lng > 180) {
            Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180 degrees.');
            return;
        }
        
        const coords = { latitude: lat, longitude: lng };
        setSelectedLocation(coords);
        setMapRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        setShowManualEntry(false);
        setManualLatitude('');
        setManualLongitude('');
    };

    const toggleManualEntry = () => {
        setShowManualEntry(!showManualEntry);
        if (!showManualEntry) {
            // If there's a selected location, populate the manual entry fields
            if (selectedLocation) {
                setManualLatitude(selectedLocation.latitude.toString());
                setManualLongitude(selectedLocation.longitude.toString());
            }
        }
    };

    const [formData, setFormData] = useState({
        shop_name: '',
        contact_person: '',
        mobile_number: '',
        alternate_number: null, // null instead of ''
        email: '',
        address: '',
        area_locality: '',
        pincode: '',
        gps_location: location.latitude && location.longitude ? `${location.latitude},${location.longitude}` : '',
        business_type: '',
        monthly_sales_volume: '1',
        current_system: '',
        lead_status: '',
        plan_interest: '',        // NEW
        next_follow_up_date: date,  // NEW
        meeting_notes: '',        // NEW
        prospect_rating: '5',      // NEW
    });

    // Dummy dropdown options
    const businessTypes = business_type.map((bt) => ({
        id: `${bt.id}`,
        name: `${bt.name}`
    }));


    const plans = plan_data.map((pl) => ({
        id: `${pl.id}`,
        name: `${pl.name}`
    }));

    const currentSystems = system_data.map((cs) => ({
        id: `${cs.id}`,
        name: `${cs.name}`
    }));

    const leadStatuses = lead_status.map((ls) => ({
        id: `${ls.id}`,
        name: `${ls.name}`
    }));

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => step < steps.length && setStep(step + 1);
    const prevStep = () => step > 1 && setStep(step - 1);

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                alternate_number: formData.alternate_number || null
            };
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/sales-executive/leads`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(error);
                Alert.alert('Error', 'Please check your input fields.');
                return;
            }

            Alert.alert('Success', 'Lead created successfully!');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong.');
        }
    };

    const handleSubmitandStartMeeting = async () => {
        try {
            const payload = {
                ...formData,
                alternate_number: formData.alternate_number || null,
            };

            const token = await AsyncStorage.getItem("token");

            const response = await axios.post(
                `${BASE_URL}/sales-executive/leads`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(response.data);
            navigation.navigate('Meeting', { lead: response.data.data });
        } catch (error) {
            if (error.response) {
                // Server responded with an error
                console.error(error.response.data);
                Alert.alert("Error", "Please check your input fields.");
            } else {
                // Something else happened
                console.error(error);
                Alert.alert("Error", "Something went wrong. " + error.message);
            }
        }
    };


    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Shop Information</Text>
                            <InputField icon="business-outline" placeholder="Shop Name *" value={formData.shop_name} onChangeText={text => handleChange('shop_name', text)} />
                            <InputField icon="person-outline" placeholder="Name *" value={formData.contact_person} onChangeText={text => handleChange('contact_person', text)} />
                            <InputField icon="call-outline" placeholder="Mobile Number *" value={formData.mobile_number} onChangeText={text => handleChange('mobile_number', text)} keyboardType="phone-pad" />
                            <InputField icon="call-outline" placeholder="Alternate Number" value={formData.alternate_number ?? ''} onChangeText={text => handleChange('alternate_number', text)} keyboardType="phone-pad" />
                            <InputField icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={text => handleChange('email', text)} keyboardType="email-address" />
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Location Details</Text>
                            <InputField icon="location-outline" placeholder="Area / Locality *" value={formData.area_locality} onChangeText={text => handleChange('area_locality', text)} />
                            <InputField icon="location-outline" placeholder="Pincode *" value={formData.pincode} onChangeText={text => handleChange('pincode', text)} keyboardType="numeric" />
                            <InputField icon="home-outline" placeholder="Address *" value={formData.address} onChangeText={text => handleChange('address', text)} multiline />
                            <View style={[styles.gpsRow]}>
                                <View style={{ flex: 1 }}>
                                    <InputField icon="navigate-outline" placeholder="GPS Location *" value={formData.gps_location} onChangeText={text => handleChange('gps_location', text)} />
                                </View>
                                <TouchableOpacity style={styles.gpsButton} onPress={updateLocation}>
                                    <Icon name="map-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                );
            case 2:
                return (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Lead Status</Text>

                        <Dropdown label="Plan Interest" selectedValue={formData.plan_interest} onValueChange={val => handleChange('plan_interest', val)} options={plans} />

                        <View style={styles.gpsRow}>
                            <View style={{ flex: 1 }}>
                                <InputField
                                    icon="calendar-outline"
                                    placeholder="Next Follow Up Date (YYYY-MM-DD)"
                                    value={formData.next_follow_up_date}
                                    editable={false} // prevent typing, only pick via calendar
                                />
                            </View>
                            <TouchableOpacity onPress={() => setShow(true)} style={styles.gpsButton}>
                                <Icon name="calendar-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* <Button title="Select Follow Up Date" onPress={() => setShow(true)} /> */}

                        {show && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onChange}
                            />
                        )}

                        <InputField
                            icon="create-outline"
                            placeholder="Meeting Notes"
                            value={formData.meeting_notes}
                            onChangeText={text => handleChange('meeting_notes', text)}
                            multiline
                            numberOfLinesnumberOfLines={4}
                            style={{ textAlignVertical: 'center', height: 150 }}
                        />
                    </View>
                );
            case 3:
                return (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Business Details</Text>
                        <Dropdown label="Business Type" selectedValue={formData.business_type} onValueChange={val => handleChange('business_type', val)} options={businessTypes} />
                        <Dropdown label="Current System" selectedValue={formData.current_system} onValueChange={val => handleChange('current_system', val)} options={currentSystems} />
                        <Dropdown label="Lead Status" selectedValue={formData.lead_status} onValueChange={val => handleChange('lead_status', val)} options={leadStatuses} />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>

            {/* Stepper */}
            <View style={styles.progressContainer}>
                {steps.map((label, index) => {
                    const current = index + 1;
                    return (
                        <View key={index} style={styles.progressStep}>
                            <View style={[styles.circle, { backgroundColor: current <= step ? '#30CA37' : '#ccc' }]}>
                                <Text style={styles.circleText}>{current}</Text>
                            </View>
                            {index < steps.length - 1 && <View style={[styles.line, { backgroundColor: current < step ? '#30CA37' : '#ccc' }]} />}
                        </View>
                    );
                })}
            </View>

            <ScrollView style={{ flex: 1 }}>

                {/* Render without steps if is required then use renderStepContent() */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Shop Information</Text>
                    <InputField icon="business-outline" placeholder="Shop Name *" value={formData.shop_name} onChangeText={text => handleChange('shop_name', text)} />
                    <InputField icon="person-outline" placeholder="Name *" value={formData.contact_person} onChangeText={text => handleChange('contact_person', text)} />
                    <InputField icon="call-outline" placeholder="Mobile Number *" value={formData.mobile_number} onChangeText={text => handleChange('mobile_number', text)} keyboardType="phone-pad" />
                    <InputField icon="call-outline" placeholder="Alternate Number" value={formData.alternate_number ?? ''} onChangeText={text => handleChange('alternate_number', text)} keyboardType="phone-pad" />
                    <InputField icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={text => handleChange('email', text)} keyboardType="email-address" />
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Location Details</Text>
                    <InputField icon="location-outline" placeholder="Area / Locality *" value={formData.area_locality} onChangeText={text => handleChange('area_locality', text)} />
                    <InputField icon="location-outline" placeholder="Pincode *" value={formData.pincode} onChangeText={text => handleChange('pincode', text)} keyboardType="numeric" />
                    <InputField icon="home-outline" placeholder="Address *" value={formData.address} onChangeText={text => handleChange('address', text)} multiline />
                    <View style={[styles.gpsRow]}>
                        <View style={{ flex: 1 }}>
                            <InputField icon="navigate-outline" placeholder="GPS Location *" value={formData.gps_location} onChangeText={text => handleChange('gps_location', text)} />
                        </View>
                        <TouchableOpacity style={styles.gpsButton} onPress={updateLocation}>
                            <Icon name="map-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.buttonRow}>

                {/* Submit Button */}
                <TouchableOpacity style={styles.nextButton} onPress={handleSubmitandStartMeeting}>
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Submit and Start Meeting</Text>
                </TouchableOpacity>

                {/* if you want to use steps then use this */}
                {/* {step > 1 && (
                    <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                        <Text style={[styles.buttonText, { color: '#FF7A00' }]}>Previous</Text>
                    </TouchableOpacity>
                )}
                {step < steps.length ? (
                    <>
                        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Next</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity style={styles.nextButton} onPress={handleSubmit}>
                        <Text style={[styles.buttonText, { color: '#fff' }]}>Submit</Text>
                    </TouchableOpacity>
                )} */}
            </View>

            {/* Location Picker Modal */}
            <Modal
                visible={locationModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setLocationModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            onPress={() => setLocationModalVisible(false)}
                            style={styles.modalCloseButton}
                        >
                            <Icon name="close" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Location</Text>
                        <TouchableOpacity 
                            onPress={confirmLocation}
                            style={styles.modalConfirmButton}
                        >
                            <Text style={styles.modalConfirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search for an address..."
                                value={searchQuery}
                                onChangeText={(text) => {
                                    setSearchQuery(text);
                                    searchLocation(text);
                                }}
                            />
                            {isSearching && <ActivityIndicator size="small" color="#FF7A00" />}
                        </View>
                        <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
                            <Icon name="locate-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Manual Entry Toggle */}
                    <View style={styles.manualEntryContainer}>
                        <TouchableOpacity style={styles.manualEntryToggle} onPress={toggleManualEntry}>
                            <Icon name={showManualEntry ? "chevron-up" : "chevron-down"} size={20} color="#FF7A00" />
                            <Text style={styles.manualEntryToggleText}>
                                {showManualEntry ? 'Hide' : 'Enter'} Coordinates Manually
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Manual Coordinate Entry */}
                    {showManualEntry && (
                        <View style={styles.manualEntryForm}>
                            <View style={styles.coordinateRow}>
                                <View style={styles.coordinateInputContainer}>
                                    <Text style={styles.coordinateLabel}>Latitude</Text>
                                    <TextInput
                                        style={styles.coordinateInput}
                                        placeholder="e.g., 19.0760"
                                        value={manualLatitude}
                                        onChangeText={setManualLatitude}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.coordinateInputContainer}>
                                    <Text style={styles.coordinateLabel}>Longitude</Text>
                                    <TextInput
                                        style={styles.coordinateInput}
                                        placeholder="e.g., 72.8777"
                                        value={manualLongitude}
                                        onChangeText={setManualLongitude}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.applyCoordinatesButton} onPress={handleManualCoordinateEntry}>
                                <Icon name="checkmark-outline" size={20} color="#fff" />
                                <Text style={styles.applyCoordinatesText}>Apply Coordinates</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <View style={styles.searchResultsContainer}>
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.searchResultItem}
                                        onPress={() => selectSearchResult(item)}
                                    >
                                        <Icon name="location-outline" size={16} color="#FF7A00" />
                                        <View style={styles.searchResultText}>
                                            <Text style={styles.searchResultTitle} numberOfLines={1}>
                                                {item.display_name.split(',')[0]}
                                            </Text>
                                            <Text style={styles.searchResultSubtitle} numberOfLines={2}>
                                                {item.display_name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                style={styles.searchResultsList}
                            />
                        </View>
                    )}

                    {/* Map */}
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            region={mapRegion}
                            onPress={onMapPress}
                            showsUserLocation={true}
                            showsMyLocationButton={false}
                        >
                            {selectedLocation && (
                                <Marker
                                    coordinate={selectedLocation}
                                    title="Selected Location"
                                    description="Tap to confirm this location"
                                />
                            )}
                        </MapView>
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsText}>
                            📍 Search for an address, enter coordinates manually, or tap on the map to select a location
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const InputField = ({ icon, ...props }) => (
    <View style={styles.inputWrapper}>
        <Icon name={icon} size={20} color="#999" style={styles.inputIcon} />
        <TextInput style={styles.input} {...props} />
    </View>
);

const Dropdown = ({ label, selectedValue, onValueChange, options }) => (
    <View style={styles.dropdownWrapper}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <Picker selectedValue={selectedValue} onValueChange={onValueChange}>
            <Picker.Item label="Select..." value="" />
            {options.map(opt => (
                <Picker.Item key={opt.id} label={opt.name} value={opt.id} />
            ))}
        </Picker>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },
    progressStep: { flexDirection: 'row', alignItems: 'center' },
    circle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    circleText: { color: '#fff', fontWeight: 'bold' },
    line: { height: 2, width: 40 },
    card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 12, backgroundColor: '#fff' },
    inputIcon: { paddingHorizontal: 10 },
    input: { flex: 1, paddingVertical: 10, paddingHorizontal: 5 },
    gpsRow: { flexDirection: 'row', alignItems: 'center' },
    gpsButton: { backgroundColor: '#FF7A00', padding: 12, borderRadius: 8, marginLeft: 8, marginBottom: 12 },
    dropdownWrapper: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 12, backgroundColor: '#fff' },
    dropdownLabel: { fontSize: 14, fontWeight: '500', paddingHorizontal: 10, paddingTop: 8 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    prevButton: { padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#FF7A00', flex: 1, marginRight: 5 },
    nextButton: { backgroundColor: '#FF7A00', padding: 14, borderRadius: 8, flex: 1, marginLeft: 5 },
    buttonText: { fontWeight: 'bold', textAlign: 'center' },
    
    // Location Picker Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#F8F9FA',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    modalConfirmButton: {
        backgroundColor: '#FF7A00',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
        marginRight: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    currentLocationButton: {
        backgroundColor: '#FF7A00',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultsContainer: {
        maxHeight: 200,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchResultsList: {
        flexGrow: 0,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchResultText: {
        flex: 1,
        marginLeft: 12,
    },
    searchResultTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 2,
    },
    searchResultSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    mapContainer: {
        flex: 1,
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    map: {
        flex: 1,
    },
    instructionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    instructionsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    
    // Manual Entry Styles
    manualEntryContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    manualEntryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    manualEntryToggleText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#FF7A00',
        fontWeight: '500',
    },
    manualEntryForm: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    coordinateRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    coordinateInputContainer: {
        flex: 1,
        marginHorizontal: 4,
    },
    coordinateLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        marginBottom: 4,
    },
    coordinateInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
    },
    applyCoordinatesButton: {
        backgroundColor: '#FF7A00',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 6,
        gap: 6,
    },
    applyCoordinatesText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

