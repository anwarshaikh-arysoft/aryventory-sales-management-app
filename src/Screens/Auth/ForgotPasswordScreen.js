// ForgotPasswordScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '../../components/ActionButton';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(false);
  const { colors, typography } = useTheme();

  useEffect(() => {
    setIsActive(email.trim().length > 0);
  }, [email]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.topContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Forgot Password</Text>
          </View>

          <View style={styles.contentContainer}>
            <Text style={[typography.title1, { color: colors.primary, marginBottom: 12 }]}>Reset Password</Text>
            <Text style={[typography.caption2, { marginBottom: 24 }]}>Enter your registered email to receive a reset link/code.</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, typography.body3]}
              placeholderTextColor={colors.neutralLight}
              keyboardType="email-address"
            />

            <ActionButton
              active={isActive}
              action={() => navigation.navigate('OtpVerification')}
              text="Send Code"
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    backgroundColor: '#4B32E5',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    position: 'relative',
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  backButton: {},
  topTitle: {
    textAlign: 'left',
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#fff',
    flexGrow: 1,
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 15,
    borderColor: '#CBCBCB',
    color: '#000',
  },
});