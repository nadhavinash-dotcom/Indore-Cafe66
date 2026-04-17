import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import PartnerDashboardScreen from '../screens/partner/DashboardScreen';
import PartnerProfileScreen from '../screens/partner/ProfileScreen';
import OrderDetailScreen from '../screens/partner/OrderDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PartnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.blackSoft,
          borderTopColor: COLORS.blackBorder,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.whiteMuted,
        tabBarIcon: ({ color, size }) => {
          const icons = { Dashboard: 'bicycle-outline', Profile: 'person-outline' };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PartnerDashboardScreen} />
      <Tab.Screen name="Profile" component={PartnerProfileScreen} />
    </Tab.Navigator>
  );
}

export default function PartnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PartnerTabs" component={PartnerTabs} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}
