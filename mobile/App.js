import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/authStore';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
} from './src/lib/notifications';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const notifReceivedRef = useRef(null);
  const notifResponseRef = useRef(null);

  useEffect(() => {
    hydrate();

    // notifReceivedRef.current = addNotificationReceivedListener((notification) => {
    //   console.log('[Push] Received:', notification);
    // });

    // notifResponseRef.current = addNotificationResponseReceivedListener((response) => {
    //   console.log('[Push] Tapped:', response);
    // });

    // return () => {
    //   if (notifReceivedRef.current) removeNotificationSubscription(notifReceivedRef.current);
    //   if (notifResponseRef.current) removeNotificationSubscription(notifResponseRef.current);
    // };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
