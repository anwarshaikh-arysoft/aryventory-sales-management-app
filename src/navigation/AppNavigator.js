import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../context/ThemeContext';

import LoginScreen from '../Screens/Auth/LoginScreen';
import RegisterScreen from '../Screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../Screens/Auth/ForgotPasswordScreen';
import OtpVerificationScreen from '../Screens/Auth/OtpVerificationScreen';
import ChangePasswordScreen from '../Screens/Auth/ChangePasswordScreen';
import PasswordChangedScreen from '../Screens/Auth/PasswordChangedScreen';


import HomeScreen from '../Screens/Home/HomeScreen';
import VisitsScreen from '../Screens/Visits/VisitsScreen';
import OrdersScreen from '../Screens/Orders/OrdersScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <ThemeProvider>
    <NavigationContainer>
      
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
        <Stack.Screen options={{ headerShown: false }} name="Register" component={RegisterScreen} />
        <Stack.Screen options={{ headerShown: false }} name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        {/* <Stack.Screen options={{ headerShown: false }} name="OtpVerification" component={OtpVerificationScreen} /> */}
        <Stack.Screen options={{ headerShown: false }} name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen options={{ headerShown: false }} name="PasswordChanged" component={PasswordChangedScreen} />

        <Stack.Screen options={{ headerShown: false }} name="Home" component={HomeScreen} />
        <Stack.Screen name="Visits" component={VisitsScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
      </Stack.Navigator>

    </NavigationContainer>
    </ThemeProvider>
  );
}
