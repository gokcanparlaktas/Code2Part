import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_DISCLAIMER_STORAGE_KEY } from './appDisclaimerContent';

let memoryAccepted = false;

export async function hasAcceptedAppDisclaimer(): Promise<boolean> {
  if (memoryAccepted) {
    return true;
  }

  try {
    const value = await AsyncStorage.getItem(APP_DISCLAIMER_STORAGE_KEY);
    if (value === 'true') {
      memoryAccepted = true;
      return true;
    }
    return false;
  } catch {
    return memoryAccepted;
  }
}

export async function acceptAppDisclaimer(): Promise<void> {
  memoryAccepted = true;
  try {
    await AsyncStorage.setItem(APP_DISCLAIMER_STORAGE_KEY, 'true');
  } catch {
    // Do not block the app if persistence fails.
  }
}

export function resetAppDisclaimerAcceptanceForTests(): void {
  memoryAccepted = false;
}
