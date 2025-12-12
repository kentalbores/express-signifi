import { useAuth } from '@/contexts/AuthContext'; // Adjust path as needed
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    addNotificationListeners,
    registerForPushNotificationsAsync,
    savePushTokenToServer,
} from '../utils/pushNotifications'; // Adjust path if needed

export function usePushNotifications() {
    // Optional: Only run if user is logged in
    const { user } = useAuth(); // Ensure this context exists in your frontend
    const router = useRouter();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        let isMounted = true;

        const setup = async () => {
            // Register for push notifications
            const token = await registerForPushNotificationsAsync();
            if (token && isMounted) {
                setExpoPushToken(token);
                // Save token to backend if user is logged in
                // If you handle saving in registerForPushNotificationsAsync, you can skip this
                // But typically we want to associate it with the USER ID, so saving here after login is good.
                if (user?.user_id) {
                    await savePushTokenToServer(token);
                }
            }

            // Set up notification listeners
            notificationListener.current = addNotificationListeners(
                // On notification received (foreground)
                (notification) => {
                    if (isMounted) setNotification(notification);
                },
                // On notification tapped (background/killed response)
                (response) => {
                    const data = response.notification.request.content.data;
                    handleNotificationNavigation(data);
                }
            );
        };

        if (user?.user_id) {
            setup();
        }

        return () => {
            isMounted = false;
            // Cleanup listeners
            if (notificationListener.current) {
                notificationListener.current();
            }
        };
    }, [user?.user_id]);

    const handleNotificationNavigation = (data: Record<string, any>) => {
        console.log('Handling notification navigation:', data);
        // Handle navigation based on notification data
        if (data?.type === 'institution_approved') {
            router.push(`/(screens)/institutionDetails?institutionId=${data.institution_id}`);
        } else if (data?.type === 'course_update') {
            router.push(`/(course)/courseDetails?courseId=${data.course_id}`);
        } else if (data?.type === 'lesson_reminder') {
            router.push(`/(course)/lessonPlayer?lessonId=${data.lesson_id}`);
        } else if (data?.link) {
            router.push(data.link); // Direct link
        }
    };

    return {
        expoPushToken,
        notification,
    };
}
