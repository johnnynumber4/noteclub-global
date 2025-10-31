"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Notifications as NotificationsIcon, NotificationsOff } from '@mui/icons-material';
import { IconButton, Tooltip, Badge } from '@mui/material';

interface NotificationButtonProps {
  variant?: 'mui' | 'lucide';
  showLabel?: boolean;
}

export function NotificationButton({ variant = 'lucide', showLabel = false }: NotificationButtonProps) {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    console.log('🔍 Checking subscription status...');
    try {
      const currentPermission = Notification.permission;
      console.log('📋 Current permission:', currentPermission);
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        console.log('❌ Permission not granted');
        setIsSubscribed(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const hasSubscription = !!subscription;

      console.log('📱 Has browser subscription:', hasSubscription);
      if (subscription) {
        console.log('🔗 Subscription endpoint:', subscription.endpoint);
      }

      setIsSubscribed(hasSubscription);
    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscriptionStatus();
    }
  }, [checkSubscriptionStatus]);

  // Re-check subscription when session changes
  useEffect(() => {
    if (session && isSupported) {
      checkSubscriptionStatus();
    }
  }, [session, isSupported, checkSubscriptionStatus]);

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
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
  };

  const subscribeToPush = async () => {
    console.log('🔔 Starting subscription process...');
    setIsLoading(true);

    try {
      // Check current permission
      let result = Notification.permission;
      console.log('📋 Current permission:', result);

      // Only request if not already granted
      if (result !== 'granted') {
        console.log('🔔 Requesting permission...');
        result = await Notification.requestPermission();
        console.log('📋 Permission result:', result);
      }

      setPermission(result);

      if (result !== 'granted') {
        console.log('❌ Permission denied');
        alert('Please allow notifications to stay updated when new albums are posted!');
        setIsLoading(false);
        return;
      }

      // Get VAPID public key
      console.log('🔑 Fetching VAPID key...');
      const vapidResponse = await fetch('/api/notifications/vapid');
      if (!vapidResponse.ok) {
        throw new Error('Failed to get VAPID key');
      }

      const { publicKey } = await vapidResponse.json();
      console.log('✅ Got VAPID key');
      const applicationServerKey: Uint8Array = urlBase64ToUint8Array(publicKey);

      // Register service worker and subscribe
      console.log('📱 Waiting for service worker...');

      // Use a race condition to timeout the service worker ready check
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, reject) =>
          setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
        )
      ]);

      console.log('✅ Service worker ready');

      // Check if there's already a subscription
      let pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        console.log('♻️ Found existing browser subscription');
      } else {
        console.log('📱 Creating new browser subscription...');
        try {
          // Add timeout to the subscribe operation itself
          pushSubscription = await Promise.race([
            registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey
            }),
            new Promise<PushSubscription>((_, reject) =>
              setTimeout(() => reject(new Error('Push subscription timeout')), 10000)
            )
          ]);
          console.log('✅ Browser subscription created');
        } catch (subError) {
          console.error('❌ Failed to create subscription:', subError);
          throw new Error('Failed to subscribe to push notifications: ' + subError);
        }
      }

      // Send subscription to server
      console.log('📤 Sending subscription to server...');
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
        console.log('✅ Server subscription saved');
        setIsSubscribed(true);
        alert('✅ Notifications enabled! You\'ll be notified when new albums are posted.');
      } else {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error('Failed to subscribe on server: ' + errorText);
      }

    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('timeout')) {
        alert('Service worker took too long to respond. Please refresh the page and try again.');
      } else {
        alert('Failed to enable notifications. Check console for details.');
      }
    } finally {
      setIsLoading(false);
      // Re-check status to ensure UI is in sync
      await checkSubscriptionStatus();
    }
  };

  const unsubscribeFromPush = async () => {
    console.log('🔕 Starting unsubscribe process...');
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('📱 Found subscription:', subscription.endpoint);

        // Remove subscription from server first
        console.log('📤 Removing from server...');
        const deleteResponse = await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });

        if (deleteResponse.ok) {
          console.log('✅ Server subscription removed');
        } else {
          console.warn('⚠️ Server delete failed, continuing anyway');
        }

        // Unsubscribe from push manager
        console.log('📱 Unsubscribing from browser...');
        const unsubResult = await subscription.unsubscribe();
        console.log('✅ Browser unsubscribe result:', unsubResult);

        setIsSubscribed(false);
        alert('🔕 Notifications disabled. Click the bell icon anytime to re-enable!');
      } else {
        console.log('⚠️ No subscription found');
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('❌ Failed to unsubscribe from push notifications:', error);
      alert('Failed to disable notifications. Check console for details.');
    } finally {
      setIsLoading(false);
      // Re-check status to ensure UI is in sync
      await checkSubscriptionStatus();
    }
  };

  const handleClick = () => {
    if (isSubscribed) {
      unsubscribeFromPush();
    } else {
      subscribeToPush();
    }
  };

  // Don't render if not logged in or not supported
  if (!session || !isSupported) {
    return null;
  }

  // Material-UI variant
  if (variant === 'mui') {
    return (
      <Tooltip
        title={isSubscribed ? 'Notifications enabled (click to disable)' : 'Enable notifications for new albums'}
      >
        <span>
          <IconButton
            onClick={handleClick}
            disabled={isLoading}
            sx={{
              color: isSubscribed ? '#4CAF50' : 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {isSubscribed ? (
              <Badge variant="dot" color="success">
                <NotificationsIcon />
              </Badge>
            ) : (
              <NotificationsOff />
            )}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  // Lucide variant for Tailwind navbar
  return (
    <Tooltip title={isSubscribed ? 'Notifications enabled' : 'Enable notifications'}>
      <span>
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            isSubscribed
              ? 'text-green-400 hover:bg-green-400/10'
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSubscribed ? 'Notifications enabled (click to disable)' : 'Enable notifications for new albums'}
        >
          {isSubscribed ? (
            <div className="relative">
              <BellRing className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
            </div>
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </button>
      </span>
    </Tooltip>
  );
}
