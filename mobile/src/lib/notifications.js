import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(role) {
  if (!Device.isDevice) {
    console.log('[Push] Not a physical device — skipping push token registration');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    await api.put(`/${role}/push-token`, { pushToken });
    console.log(`[Push] Token registered for ${role}: ${pushToken}`);
    return pushToken;
  } catch (err) {
    console.log('[Push] Failed to register token:', err.message);
    return null;
  }
}

export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseReceivedListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function removeNotificationSubscription(subscription) {
  Notifications.removeNotificationSubscription(subscription);
}
