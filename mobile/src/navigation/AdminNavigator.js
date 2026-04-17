import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import KitchenScreen from '../screens/admin/KitchenScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import AdminCustomersScreen from '../screens/admin/CustomersScreen';
import AdminPartnersScreen from '../screens/admin/PartnersScreen';
import SupportScreen from '../screens/admin/SupportScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
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
          const icons = {
            Dashboard: 'grid-outline',
            Kitchen: 'fast-food-outline',
            Orders: 'receipt-outline',
            More: 'ellipsis-horizontal-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Kitchen" component={KitchenScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="More" component={AdminCustomersScreen} />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="Customers" component={AdminCustomersScreen} />
      <Stack.Screen name="Partners" component={AdminPartnersScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
