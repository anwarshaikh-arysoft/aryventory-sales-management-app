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
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureLocation } from '../../utils/LocationCapture';
import { colors } from '../../../theme/colors';
import axios from 'axios';
import { getAddressFromCoords } from '../../utils/getAddressFromCoords';

export default function AddLead({ navigation }) {
    const steps = ['Shop Information', 'Location Details', 'Business Details'];
    const [step, setStep] = useState(1);
    const [location, setLocation] = useState({ latitude: '', longitude: '' });

    const [date, setDate] = useState(new Date());
    const [show, setShow] = useState(false);

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

            const address = await getAddressFromCoords(locationString);
            console.log('address', address);
            handleChange('address', address.address);
            handleChange('pincode', address.postalCode);
        }
    };

    const [formData, setFormData] = useState({
        shop_name: '',
        contact_person: '',
        mobile_number: '',
        alternate_number: null, // null instead of ''
        email: '',
        address: '',
        branches: 1,
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
                            <InputField icon="person-outline" placeholder="Name" value={formData.contact_person} onChangeText={text => handleChange('contact_person', text)} />
                            <InputField icon="call-outline" placeholder="Mobile Number" value={formData.mobile_number} onChangeText={text => handleChange('mobile_number', text)} keyboardType="phone-pad" />
                            <InputField icon="call-outline" placeholder="Alternate Number" value={formData.alternate_number ?? ''} onChangeText={text => handleChange('alternate_number', text)} keyboardType="phone-pad" />
                            <InputField icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={text => handleChange('email', text)} keyboardType="email-address" />
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Location Details</Text>
                            <InputField icon="location-outline" placeholder="Branches *" value={formData.branches} onChangeText={text => handleChange('branches', parseInt(text))} keyboardType="numeric" />
                            <InputField icon="location-outline" placeholder="Area / Locality *" value={formData.area_locality} onChangeText={text => handleChange('area_locality', text)} />
                            <InputField icon="location-outline" placeholder="Pincode *" value={formData.pincode} onChangeText={text => handleChange('pincode', text)} keyboardType="numeric" />
                            <InputField icon="home-outline" placeholder="Address *" value={formData.address} onChangeText={text => handleChange('address', text)} multiline />
                            <View style={[styles.gpsRow]}>
                                <View style={{ flex: 1 }}>
                                    <InputField icon="navigate-outline" placeholder="GPS Location *" value={formData.gps_location} onChangeText={text => handleChange('gps_location', text)} />
                                </View>
                                <TouchableOpacity style={styles.gpsButton} onPress={() => updateLocation()}>
                                    <Icon name="locate-outline" size={20} color="#fff" />
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
                    <InputField icon="person-outline" placeholder="Name" value={formData.contact_person} onChangeText={text => handleChange('contact_person', text)} />
                    <InputField icon="call-outline" placeholder="Mobile Number" value={formData.mobile_number} onChangeText={text => handleChange('mobile_number', text)} keyboardType="phone-pad" />
                    <InputField icon="call-outline" placeholder="Alternate Number" value={formData.alternate_number ?? ''} onChangeText={text => handleChange('alternate_number', text)} keyboardType="phone-pad" />
                    <InputField icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={text => handleChange('email', text)} keyboardType="email-address" />
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Location Details</Text>
                    <InputField icon="location-outline" placeholder="Branches *" value={formData.branches} onChangeText={text => handleChange('branches', text)} keyboardType="numeric" />
                    <InputField icon="location-outline" placeholder="Area / Locality *" value={formData.area_locality} onChangeText={text => handleChange('area_locality', text)} />
                    <InputField icon="location-outline" placeholder="Pincode *" value={formData.pincode} onChangeText={text => handleChange('pincode', text)} keyboardType="numeric" />
                    <InputField icon="home-outline" placeholder="Address *" value={formData.address} onChangeText={text => handleChange('address', text)} multiline />
                    <View style={[styles.gpsRow]}>
                        <View style={{ flex: 1 }}>
                            <InputField icon="navigate-outline" placeholder="GPS Location *" value={formData.gps_location} onChangeText={text => handleChange('gps_location', text)} />
                        </View>
                        <TouchableOpacity style={styles.gpsButton} onPress={() => updateLocation()}>
                            <Icon name="locate-outline" size={20} color="#fff" />
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
        </View>
    );
}

const InputField = ({ icon, ...props }) => (
    <View style={styles.inputWrapper}>
        <Icon name={icon} size={20} color="#999" style={styles.inputIcon} />
        <TextInput placeholderTextColor={'#ccc'} style={styles.input} {...props} />
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
});

