import React from 'react';
import { Text, View, StatusBar, Platform } from 'react-native';

console.log('=== BASIC IMPORTS TEST ===');
console.log('React:', React);
console.log('React.version:', React.version);
console.log('Platform:', Platform.OS);

export default function TestApp() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar translucent={false} backgroundColor="#F6F6F6" barStyle="dark-content" />
      <Text>React Version: {React.version}</Text>
      <Text>Platform: {Platform.OS}</Text>
      <Text>Basic imports working</Text>
    </View>
  );
}

