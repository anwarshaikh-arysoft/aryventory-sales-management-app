// AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../Screens/Auth/LoginScreen';
import RegisterScreen from '../Screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../Screens/Auth/ForgotPasswordScreen';
import ChangePasswordScreen from '../Screens/Auth/ChangePasswordScreen';
import PasswordChangedScreen from '../Screens/Auth/PasswordChangedScreen';

import HomeScreen from '../Screens/Home/HomeScreen';
import VisitsScreen from '../Screens/Visits/VisitsScreen';
import OrdersScreen from '../Screens/Orders/OrdersScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Visits" component={VisitsScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
              <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              <Stack.Screen name="PasswordChanged" component={PasswordChangedScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
