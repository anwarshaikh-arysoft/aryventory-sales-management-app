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
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
const Register = require('../../../assets/register.png');
import ActionButton from '../../components/ActionButton';
import { Ionicons } from '@expo/vector-icons'; // for back arrow icon

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(false);

  const { colors, typography } = useTheme();

  useEffect(() => {
    setIsActive(
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0
    );
  }, [name, email, password]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Curved Top Section */}
          <View style={styles.topContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Sign up</Text>
          </View>

          {/* Main Content with Rounded Top */}
          <View style={styles.contentContainer}>
            <View style={{ marginBottom: 24 }}>
              <Text style={[typography.title1, { color: colors.primary }]}>
                Lets start!
              </Text>
              <Text style={typography.caption2}>Create New account</Text>
            </View>

            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Image source={Register} style={{ width: 213, height: 165 }} />
            </View>

            <TextInput
              placeholder="Name"
              value={name}
              onChangeText={setName}
              style={[styles.input, typography.body3]}
              placeholderTextColor={colors.neutralLight}
            />

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, typography.body3]}
              placeholderTextColor={colors.neutralLight}
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.input, typography.body3]}
              placeholderTextColor={colors.neutralLight}
            />

            <View style={styles.termsContainer}>
              <View style={styles.checkbox} />
              <Text style={[typography.caption2]}>
                By creating an account you agree to our{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Term and Conditions
                </Text>
              </Text>
            </View>

            <ActionButton
              active={isActive}
              action={() => navigation.navigate('Home')}
              text="Sign up"
            />

            <Text
              style={[typography.caption2, { marginTop: 24, textAlign: 'center' }]}
              onPress={() => navigation.navigate('Login')}
            >
              Have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Sign In
              </Text>
            </Text>
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
    justifyContent: 'left',
    gap: 20,
    alignItems: 'center'
  },
  backButton: {
    // position: 'inline',
    // top: 60,
    // left: 20,
    // zIndex: 2,
  },
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBCBCB',
    marginRight: 8,
  },
});
