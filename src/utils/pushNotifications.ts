import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../services/api'; // Adjust import based on your frontend structure

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ||
                Constants?.easConfig?.projectId;

            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log('Push Token:', token);
        } catch (e) {
            console.error('Error getting push token:', e);
        }
    } else {
        // console.log('Must use physical device for Push Notifications'); 
        // Allowing it to return something for simulator testing if needed, or null
    }

    return token;
}

export function addNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
    const receivedListener = Notifications.addNotificationReceivedListener(onNotificationReceived);
    const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    return () => {
        Notifications.removeNotificationSubscription(receivedListener);
        Notifications.removeNotificationSubscription(responseListener);
    };
}

export async function savePushTokenToServer(token: string): Promise<boolean> {
    try {
        // Adjust endpoint to match the backend route implemented
        await api.post('/learner/push-token', {
            token,
            platform: Platform.OS,
        });
        console.log('Push token saved to server');
        return true;
    } catch (error) {
        console.error('Failed to save push token to server:', error);
        return false;
    }
}
