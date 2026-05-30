import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

const SIZE = 64;

interface CompareMatchDonutProps {
  percentage: number;
}

export function CompareMatchDonut({ percentage }: CompareMatchDonutProps) {
  const { homeColors } = useTheme();
  const styles = useHomeStyles(createStyles);
  const strokeWidth = 4;
  const radius = (SIZE - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, percentage));
  const isFullRing = progress >= 100;
  const strokeDashoffset = isFullRing
    ? 0
    : circumference - (progress / 100) * circumference;
  const center = SIZE / 2;

  return (
    <View style={styles.wrapper}>
      <View style={styles.ringBox}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={homeColors.borderSub}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {isFullRing ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={homeColors.accent}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ) : (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={homeColors.accent}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              rotation={-90}
              origin={`${center}, ${center}`}
            />
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text
            style={styles.percentage}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            %{progress}
          </Text>
          <Text
            style={styles.label}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            uyum
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringBox: {
      height: SIZE,
      position: 'relative',
      width: SIZE,
    },
    center: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    percentage: {
      color: c.accent,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 17,
    },
    label: {
      color: c.textMuted,
      fontSize: 10,
      lineHeight: 12,
      marginTop: 2,
    },
  });
