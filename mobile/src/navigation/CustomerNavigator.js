import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import DashboardScreen from '../screens/customer/DashboardScreen';
import BookMealScreen from '../screens/customer/BookMealScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import PlansScreen from '../screens/customer/PlansScreen';
import AddressScreen from '../screens/customer/AddressScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import PaymentSuccessScreen from '../screens/customer/PaymentSuccessScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.blackSoft,
          borderTopColor: COLORS.blackBorder,
          paddingBottom: 4,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.whiteMuted,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'home-outline',
            BookMeal: 'restaurant-outline',
            Orders: 'list-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="BookMeal" component={BookMealScreen} options={{ tabBarLabel: 'Book' }} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
