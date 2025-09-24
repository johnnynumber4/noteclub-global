"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function NotificationManager() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (session && isSupported && permission === 'granted') {
      initializePushNotifications();
    }
  }, [session, isSupported, permission]);

  const initializePushNotifications = async () => {
    try {
      // Get VAPID public key
      const vapidResponse = await fetch('/api/notifications/vapid');
      if (!vapidResponse.ok) {
        console.error('Failed to get VAPID key');
        return;
      }
      
      const { publicKey } = await vapidResponse.json();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let pushSubscription = await registration.pushManager.getSubscription();

      if (!pushSubscription) {
        // Create new subscription
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      setSubscription(pushSubscription);

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: pushSubscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!)))
            }
          }
        })
      });

      if (response.ok) {
        console.log('Push notification subscription successful');
      } else {
        console.error('Failed to subscribe to push notifications');
      }

    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await initializePushNotifications();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  // Convert VAPID key from base64 to Uint8Array
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Auto-request permission for logged-in users (non-intrusive)
  useEffect(() => {
    if (session && isSupported && permission === 'default') {
      // Wait a bit before requesting to avoid overwhelming new users
      const timer = setTimeout(() => {
        requestPermission();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [session, isSupported, permission]);

  // Handle incoming push notifications
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        // Handle push notification received
        console.log('Push notification received:', event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported]);

  // This component doesn't render anything visible
  // It just manages push notification subscriptions in the background
  return null;
}