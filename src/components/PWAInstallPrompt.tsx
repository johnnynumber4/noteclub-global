"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Slide,
} from "@mui/material";
import {
  Close,
  GetApp,
  PhoneIphone,
  MusicNote,
} from "@mui/icons-material";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show prompt after a delay, but only if user hasn't dismissed it before
      const hasSeenPrompt = localStorage.getItem('pwa-install-dismissed');
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowPrompt(false);
      setIsInstallable(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    setIsInstallable(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isInstallable || !showPrompt) {
    return null;
  }

  return (
    <Slide direction="up" in={showPrompt}>
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1300,
          maxWidth: 400,
          mx: "auto",
        }}
      >
        <Card
          sx={{
            background: "linear-gradient(135deg, #f44336, #2196f3)",
            color: "white",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MusicNote sx={{ fontSize: 28 }} />
                  </Box>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={700}>
                      Install Note Club
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Get the app for a better experience
                    </Typography>
                  </Stack>
                </Stack>

                <IconButton
                  size="small"
                  onClick={handleDismiss}
                  sx={{ color: "white", opacity: 0.8 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={handleInstallClick}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  fullWidth
                >
                  Install App
                </Button>
                <Button
                  variant="text"
                  onClick={handleDismiss}
                  sx={{ color: "white", opacity: 0.8 }}
                >
                  Later
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <PhoneIphone sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Quick access • Offline support • Push notifications
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Slide>
  );
}