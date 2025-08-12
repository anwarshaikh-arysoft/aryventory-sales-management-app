import React from 'react';
import { StatusBar, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

import { AuthProvider } from './src/context/AuthContext';

// import { SafeAreaView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#059669',
    accent: '#10b981',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    placeholder: '#6b7280',
  },
};

export default function App() {

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
    'Poppins-Thin': require('./assets/fonts/Poppins-Thin.ttf'),
  });

  return (
    <SafeAreaProvider>
      
      {/* Transparent StatusBar */}
      <StatusBar/>

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'transparent', // Safe area is transparent
        }}
      >
        <PaperProvider
          theme={{
            ...theme,
            colors: {
              ...theme.colors,
              background: 'transparent', // Paper root background
            },
          }}
        >
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
