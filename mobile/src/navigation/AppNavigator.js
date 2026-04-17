import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/authStore';

import SplashScreen from '../screens/customer/SplashScreen';
import CustomerLoginScreen from '../screens/customer/LoginScreen';
import PartnerLoginScreen from '../screens/partner/LoginScreen';
import AdminLoginScreen from '../screens/admin/LoginScreen';
import CustomerNavigator from './CustomerNavigator';
import PartnerNavigator from './PartnerNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { customer, partner, admin, hydrated } = useAuthStore();

  if (!hydrated) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {customer?.token ? (
        <Stack.Screen name="CustomerApp" component={CustomerNavigator} />
      ) : partner?.token ? (
        <Stack.Screen name="PartnerApp" component={PartnerNavigator} />
      ) : admin?.token ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} />
          <Stack.Screen name="PartnerLogin" component={PartnerLoginScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
