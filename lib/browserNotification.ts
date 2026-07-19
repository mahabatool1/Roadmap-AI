'use client';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'default';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

export function sendBrowserNotification(title: string, body: string, options?: NotificationOptions) {
  if (!isNotificationSupported()) return null;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        silent: false,
        ...options
      });
      
      // Auto-close after 5 seconds to prevent desktop clutter
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      return notification;
    } catch (error) {
      console.error('Error sending browser notification:', error);
    }
  } else {
    console.log('[Browser Notification Ignored] Permission not granted.');
  }
  return null;
}
