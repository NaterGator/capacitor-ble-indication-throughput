import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'zephyr.ble.throughput',
  appName: 'zephyr-ble-throughput',
  webDir: 'dist',
  android: {
    loggingBehavior: 'none',
    webContentsDebuggingEnabled: true,
    
  }
};

export default config;
