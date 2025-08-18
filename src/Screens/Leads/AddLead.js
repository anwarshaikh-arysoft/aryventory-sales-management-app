// src/Leads/AddLead.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureLocation } from '../../utils/LocationCapture';


export default function AddLead({ navigation }) {
    const steps = ['Shop Information', 'Location Details', 'Business Details'];
    const [step, setStep] = useState(1);
    const [location, setLocation] = useState({ latitude: '', longitude: '' });

    useEffect(() => {
        (async () => {
            const coords = await captureLocation();
            if (coords) {
                const locationString = `${coords.latitude},${coords.longitude}`;
                setLocation({ latitude: coords.latitude, longitude: coords.longitude });
                setFormData(prev => ({
                    ...prev,
                    gps_location: locationString
                }));
            }
        })();
    }, []);

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
        monthly_sales_volume: '',
        current_system: '',
        lead_status: '',
        plan_interest: '',        // NEW
        next_follow_up_date: '',  // NEW
        meeting_notes: '',        // NEW
        prospect_rating: ''
    });

    // Dummy dropdown options
    const businessTypes = [
        { id: 1, name: 'Mobile Shop' },
        { id: 2, name: 'Electronic Store' },
        { id: 3, name: 'Computer Shop' },
        { id: 4, name: 'Accessories Shop' },
        { id: 5, name: 'Repair Center' },
        { id: 6, name: 'Others' },
    ];
    const monthlySales = [
        { id: 1, name: '₹0 - ₹50,000' },
        { id: 2, name: '₹50,000 - ₹1,00,000' },
        { id: 3, name: '₹1,00,000 - ₹5,00,000' },
        { id: 4, name: '₹5,00,000 - ₹10,00,000' },
        { id: 5, name: '₹10,00,000+' },

    ];
    const currentSystems = [
        { id: 1, name: 'Manual/Register' },
        { id: 2, name: 'Excel Sheets' },
        { id: 3, name: 'Other Software' },
        { id: 4, name: 'No System' },
    ];
    const leadStatuses = [
        { id: 1, name: 'Interested' },
        { id: 2, name: 'Not Interested' },
        { id: 3, name: 'Visit Again' },
        { id: 4, name: 'Demo Scheduled' },
        { id: 5, name: 'Sold' },
        { id: 6, name: 'Already Using CRM' },
    ];

    const prospect_rating = [1, 2, 3, 4, 5].map(num => ({
        id: num,
        name: `Rating ${num}`
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

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Shop Information</Text>
                        <InputField icon="business-outline" placeholder="Shop Name *" value={formData.shop_name} onChangeText={text => handleChange('shop_name', text)} />
                        <InputField icon="person-outline" placeholder="Name *" value={formData.contact_person} onChangeText={text => handleChange('contact_person', text)} />
                        <InputField icon="call-outline" placeholder="Mobile Number *" value={formData.mobile_number} onChangeText={text => handleChange('mobile_number', text)} keyboardType="phone-pad" />
                        <InputField icon="call-outline" placeholder="Alternate Number" value={formData.alternate_number ?? ''} onChangeText={text => handleChange('alternate_number', text)} keyboardType="phone-pad" />
                        <InputField icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={text => handleChange('email', text)} keyboardType="email-address" />
                    </View>
                );
            case 2:
                return (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Location Details</Text>
                        <InputField icon="location-outline" placeholder="Area / Locality *" value={formData.area_locality} onChangeText={text => handleChange('area_locality', text)} />
                        <InputField icon="location-outline" placeholder="Pincode *" value={formData.pincode} onChangeText={text => handleChange('pincode', text)} keyboardType="numeric" />
                        <InputField icon="home-outline" placeholder="Address *" value={formData.address} onChangeText={text => handleChange('address', text)} multiline />
                        <View style={[styles.gpsRow, {display: 'none'}]}>
                            <View style={{ flex: 1 }}>
                                <InputField icon="navigate-outline" placeholder="GPS Location *" value={formData.gps_location} onChangeText={text => handleChange('gps_location', text)} />
                            </View>
                            <TouchableOpacity style={styles.gpsButton} onPress={() => handleChange('gps_location', '12.9716,77.5946')}>
                                <Icon name="locate-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* New fields */}
                        <InputField
                            icon="document-text-outline"
                            placeholder="Plan Interest"
                            value={formData.plan_interest}
                            onChangeText={text => handleChange('plan_interest', text)}
                        />

                        <InputField
                            icon="calendar-outline"
                            placeholder="Next Follow Up Date (YYYY-MM-DD)"
                            value={formData.next_follow_up_date}
                            onChangeText={text => handleChange('next_follow_up_date', text)}
                        />

                        <InputField
                            icon="create-outline"
                            placeholder="Meeting Notes"
                            value={formData.meeting_notes}
                            onChangeText={text => handleChange('meeting_notes', text)}
                            multiline
                        />
                    </View>
                );
            case 3:
                return (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Business Details</Text>
                        <Dropdown label="Business Type" selectedValue={formData.business_type} onValueChange={val => handleChange('business_type', val)} options={businessTypes} />
                        <Dropdown label="Monthly Sales Volume" selectedValue={formData.monthly_sales_volume} onValueChange={val => handleChange('monthly_sales_volume', val)} options={monthlySales} />
                        <Dropdown label="Current System" selectedValue={formData.current_system} onValueChange={val => handleChange('current_system', val)} options={currentSystems} />
                        <Dropdown label="Lead Status" selectedValue={formData.lead_status} onValueChange={val => handleChange('lead_status', val)} options={leadStatuses} />
                        <Dropdown label="Prospect Rating" selectedValue={formData.prospect_rating} onValueChange={val => handleChange('prospect_rating', val)} options={prospect_rating} />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
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

            <ScrollView style={{ flex: 1 }}>{renderStepContent()}</ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.buttonRow}>
                {step > 1 && (
                    <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                        <Text style={[styles.buttonText, { color: '#FF7A00' }]}>Previous</Text>
                    </TouchableOpacity>
                )}
                {step < steps.length ? (
                    <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                        <Text style={[styles.buttonText, { color: '#fff' }]}>Next</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.nextButton} onPress={handleSubmit}>
                        <Text style={[styles.buttonText, { color: '#fff' }]}>Submit</Text>
                    </TouchableOpacity>
                )}
            </View>
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
    container: { flex: 1, backgroundColor: '#F7F7F7', padding: 16 },
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

