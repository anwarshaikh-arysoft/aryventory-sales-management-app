import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
const Login = require('../../../assets/login.png');
import ActionButton from '../../components/ActionButton';
import Icon from 'react-native-vector-icons/Feather';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const { colors, typography } = useTheme();

  useEffect(() => {
    setIsActive(email.trim().length > 0 && password.trim().length > 0);
  }, [email, password]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff', flexDirection: 'column', justifyContent: 'center'}}
      behavior='padding'
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            justifyContent: 'center'
          }}          
          keyboardShouldPersistTaps="handled">
          <View style={{alignItems: 'center' }}>
            <Image
              source={require('../../../assets/logo.png')} // Replace with your logo path
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={styles.title}>Sign In To Earn</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="mail" size={18} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={18} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={secureText}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Icon
                  name={secureText ? 'eye-off' : 'eye'}
                  size={18}
                  color="#777"
                />
              </TouchableOpacity>
            </View>
          </View>

          <ActionButton
            active={isActive}
            action={() => navigation.navigate('Home')}
            text="Login"
          />

          <Text style={styles.footerText} onPress={() => navigation.navigate('Register')}>
            Don’t have an account? <Text style={styles.link}>Sign Up.</Text>
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen')}>
            <Text style={styles.forgotLink}>Forgot Password</Text>
          </TouchableOpacity>

          
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 15,
    borderColor: '#CBCBCB',
    color: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF7A00',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
  },
  signInText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  signInIcon: {
    marginLeft: 10,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#444',
  },
  link: {
    color: '#FF7A00',
    fontWeight: '500',
  },
  forgotLink: {
    color: '#FF7A00',
    textAlign: 'center',
    marginTop: 8,
  },
});
