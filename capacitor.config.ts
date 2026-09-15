import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'om.findlostpuppy.app',
  appName: 'findlostpuppy',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
