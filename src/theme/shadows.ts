import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

export const shadows = {
  card: Platform.select<ViewStyle>({
    android: { elevation: 3 },
    ios: {
      shadowColor: colors.navy[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    default: {},
  }),
  elevated: Platform.select<ViewStyle>({
    android: { elevation: 5 },
    ios: {
      shadowColor: colors.navy[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
    default: {},
  }),
  subtle: Platform.select<ViewStyle>({
    android: { elevation: 1 },
    ios: {
      shadowColor: colors.navy[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    default: {},
  }),
} as const;
