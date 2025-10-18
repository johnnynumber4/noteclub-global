import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noteclub.app',
  appName: 'Note Club',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: ['https://clarayoung.com', 'https://*.clarayoung.com'],
  },
  android: {
    backgroundColor: '#0f0f0f',
    allowMixedContent: true, // May be needed if your API is HTTP (not recommended for production)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f0f',
      showSpinner: false,
      androidSpinnerStyle: 'small',
    },
  },
};

export default config;
