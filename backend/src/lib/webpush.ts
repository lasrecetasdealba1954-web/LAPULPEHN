import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@lapulperiahn.shop',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  sound?: string;
}

export const sendPushNotification = async (
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  notification: PushNotification
) => {
  const payload = JSON.stringify({
    ...notification,
    vibrate: notification.vibrate || [200, 100, 200, 100, 200],
    icon: notification.icon || '/icons/icon-192.png',
    badge: notification.badge || '/icons/badge-72.png',
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      payload
    );
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
};

export default webpush;
