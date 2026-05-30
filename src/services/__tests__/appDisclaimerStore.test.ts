import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_DISCLAIMER_STORAGE_KEY } from '@/services/appDisclaimerContent';
import {
  acceptAppDisclaimer,
  hasAcceptedAppDisclaimer,
  resetAppDisclaimerAcceptanceForTests,
} from '@/services/appDisclaimerStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('appDisclaimerStore', () => {
  beforeEach(() => {
    resetAppDisclaimerAcceptanceForTests();
    jest.clearAllMocks();
  });

  it('returns false before acceptance', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    expect(await hasAcceptedAppDisclaimer()).toBe(false);
  });

  it('persists acceptance', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    await acceptAppDisclaimer();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(APP_DISCLAIMER_STORAGE_KEY, 'true');
    expect(await hasAcceptedAppDisclaimer()).toBe(true);
  });

  it('does not block acceptance when storage write fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('storage fail'));
    await acceptAppDisclaimer();
    expect(await hasAcceptedAppDisclaimer()).toBe(true);
  });
});
