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
import ShowLead from '../Screens/Leads/ShowLead';
import MeetingScreen from '../Screens/Leads/Meeting';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
        <Stack.Navigator
          screenOptions={{
            headerShown: true,            
            headerStyle: { backgroundColor: '#F6F6F6' },
            headerShadowVisible: false, // iOS
            shadowOpacity: 0, // iOS
            elevation: 0, // Android
            shadowOpacity: 0, // Android
            headerTintColor: '#000',
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: 'medium', fontSize: 18 },
            headerBackTitleVisible: false,
            headerLeft: ({ tintColor }) => {
              const navigation = useNavigation();
              return (
                <Ionicons
                  name="chevron-back-outline"
                  size={25}
                  color={tintColor || '#000'}
                  // style={{ marginLeft: 10 }}
                  onPress={() => navigation.goBack()}
                />
              );
            },
          }}
        >
          {user ? (
            <>
              <Stack.Screen options={{ headerShown: false }} name="Home" component={HomeScreen} />
              <Stack.Screen options={{ title: 'Lead' }} name="ShowLead" component={ShowLead} />
              <Stack.Screen name="Meeting" component={MeetingScreen} />

              <Stack.Screen name="Visits" component={VisitsScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
            </>
          ) : (
            <>
              <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
              <Stack.Screen options={{ headerShown: false }} name="Register" component={RegisterScreen} />
              <Stack.Screen options={{ headerShown: false }} name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
              <Stack.Screen options={{ headerShown: false }} name="ChangePassword" component={ChangePasswordScreen} />
              <Stack.Screen options={{ headerShown: false }} name="PasswordChanged" component={PasswordChangedScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
