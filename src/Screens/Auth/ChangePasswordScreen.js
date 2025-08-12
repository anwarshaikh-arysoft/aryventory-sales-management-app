import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    if (password === confirmPassword) {
      // Call API to change password
      navigation.navigate('PasswordChanged');
    } else {
      alert("Passwords don't match");
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-4">Set New Password</Text>
      <Text className="text-gray-600 mb-6">
        Enter a strong password you haven't used before
      </Text>

      <Text className="text-sm mb-1">New Password</Text>
      <TextInput
        placeholder="Enter new password"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        value={password}
        onChangeText={setPassword}
      />

      <Text className="text-sm mb-1">Confirm Password</Text>
      <TextInput
        placeholder="Confirm new password"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        onPress={handleChangePassword}
        className="bg-blue-600 py-4 rounded-lg items-center"
        activeOpacity={0.7}
      >
        <Text className="text-white font-semibold">Change Password</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangePasswordScreen;
