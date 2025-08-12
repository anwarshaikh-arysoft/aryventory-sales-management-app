import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const PasswordChangedScreen = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white p-6 justify-center items-center">
      <Text className="text-3xl font-bold mb-4">Password Changed!</Text>
      <Text className="text-gray-600 text-center mb-6">
        Your password has been updated successfully. You can now log in with your new password.
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        className="bg-blue-600 py-4 px-6 rounded-lg"
        activeOpacity={0.7}
      >
        <Text className="text-white font-semibold">Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PasswordChangedScreen;
