import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Building2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const AddNewLeadScreen = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    shopName: '',
    name: '',
    mobileNumber: '',
    alternativeNumber: '',
    email: ''
  });

  const steps = [
    { id: 1, title: 'Shop Information', active: true, completed: true },
    { id: 2, title: 'Location Details', active: false, completed: false },
    { id: 3, title: 'Business Details', active: false, completed: false },
    { id: 4, title: 'Meeting Details', active: false, completed: false },
    { id: 5, title: 'Media & Documentation', active: false, completed: false }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const StepIndicator = ({ step, index, totalSteps }) => {
    const isCompleted = step.completed;
    const isActive = step.active;
    const isLast = index === totalSteps - 1;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepRow}>
          <View
            style={[
              styles.stepCircle,
              (isCompleted || isActive) && { backgroundColor: '#22c55e' }
            ]}
          >
            <Text style={{ color: (isCompleted || isActive) ? '#fff' : '#9ca3af' }}>
              {step.id}
            </Text>
          </View>
          {!isLast && (
            <View
              style={[
                styles.stepLine,
                isCompleted && { backgroundColor: '#22c55e' }
              ]}
            />
          )}
        </View>
        <Text style={styles.stepLabel}>{step.title}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Steps */}
      <View style={styles.stepsWrapper}>
        <View style={styles.stepsRow}>
          {steps.map((step, index) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={index}
              totalSteps={steps.length}
            />
          ))}
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Shop Details</Text>

        {[
          { label: 'Shop Name', field: 'shopName', required: true },
          { label: 'Name', field: 'name', required: true },
          { label: 'Mobile Number', field: 'mobileNumber', required: true },
          { label: 'Alternative Number', field: 'alternativeNumber', required: false },
          { label: 'Email', field: 'email', required: true }
        ].map((item, idx) => (
          <View key={idx} style={styles.inputGroup}>
            <Text style={styles.label}>
              {item.label} {item.required && <Text style={{ color: 'red' }}>*</Text>}
            </Text>
            <View style={styles.inputWrapper}>
              <Building2 size={20} color="#9ca3af" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                value={formData[item.field]}
                onChangeText={(text) => handleInputChange(item.field, text)}
                placeholder={`Enter ${item.label.toLowerCase()}`}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        ))}

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  stepsWrapper: { paddingHorizontal: 20, paddingVertical: 24 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepContainer: {alignItems: 'center', justifyContent: 'center', flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%'},
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center'
  },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  stepLabel: { fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 4 },
  form: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  input: { flex: 1, fontSize: 16, color: '#374151' },
  nextButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24
  },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' }
});

export default AddNewLeadScreen;