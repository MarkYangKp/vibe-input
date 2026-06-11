import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibeinput.app',
  appName: 'Vibe Input',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  },
  android: {
    backgroundColor: '#f8f6f3',
    navigationBarColor: '#f8f6f3',
    statusBarColor: '#f8f6f3',
    statusBarStyle: 'DARK',
    navigationBarVisibility: 'visible'
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    },
    CapacitorAssets: {
      iconBackgroundColor: '#0ea5a0',
      iconBackgroundColorDark: '#0a0f1e',
      splashBackgroundColor: '#0ea5a0',
      splashBackgroundColorDark: '#0a0f1e'
    }
  }
};

export default config;