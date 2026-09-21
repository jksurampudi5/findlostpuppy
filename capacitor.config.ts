import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'om.findlostpuppy.app',
  appName: 'findlostpuppy',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com'],
      skipNativeAuth: true,
    },
    SplashScreen: {
      launchShowDuration: 250,
      launchAutoHide: true,
      backgroundColor: '#FFF8F0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
