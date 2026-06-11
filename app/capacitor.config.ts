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
    }
  }
};

export default config;