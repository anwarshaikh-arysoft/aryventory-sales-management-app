// AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '../../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

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

import ActivityTimeline from '../ActivityTimeline';
import AddNewLead from '../AddNewLead';
import MeetingTimer from '../MeetingTimer';
import MyLeads from '../MyLeads';
import Notifications from '../Notifications';
import Reports from '../Screens/Home/Reports';
import AddLead from '../Screens/Leads/AddLead';
import ProfileScreen from '../Screens/Home/ProfileScreen';
import ShiftHistoryScreen from '../ShiftHistoryScreen';
import LeadsList from '../Screens/Leads/LeadsList';



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
            // Keep Android status bar non-translucent so the header calculates height correctly
            statusBarTranslucent: false,
            statusBarStyle: 'dark',
            statusBarColor: '#F6F6F6',
            contentStyle: { backgroundColor: '#F6F6F6' },
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
              <Stack.Screen options={{ headerShown: false, headerTransparent: true, statusBarTranslucent: true, statusBarStyle: 'light', }} name="Home" component={HomeScreen} />
              <Stack.Screen options={{ title: 'Profile', statusBarColor: '#111214', statusBarStyle: 'light', headerStyle: { backgroundColor: '#111214' }, headerTintColor: '#fff', }} name="profile-screen" component={ProfileScreen} />
              <Stack.Screen options={{ title: 'Lead List' }} name="leadlist" component={LeadsList} />
              <Stack.Screen options={{ title: 'Lead' }} name="showlead" component={ShowLead} />
              <Stack.Screen options={{ title: 'Add Lead' }} name="addlead" component={AddLead} />
              <Stack.Screen name="Meeting" component={MeetingScreen} />

              <Stack.Screen name="Visits" component={VisitsScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
              <Stack.Screen name="ActivityTimeline" component={ActivityTimeline} />
              <Stack.Screen name="AddNewLead" component={AddNewLead} />
              <Stack.Screen name="MeetingTimer" component={MeetingTimer} />
              <Stack.Screen name="MyLeads" component={MyLeads} />
              <Stack.Screen name="Notifications" component={Notifications} />
              <Stack.Screen name="Reports" component={Reports} />
              <Stack.Screen name="ShiftHistory" options={{ title: 'Shift History' }} component={ShiftHistoryScreen} />
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
        <Toast />
      </NavigationContainer>
  );
}