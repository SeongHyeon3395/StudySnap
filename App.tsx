import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AppAlertProvider } from './src/components/AppAlertProvider';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

export default function App() {
  return (
    <AppAlertProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AppAlertProvider>
  );
}
