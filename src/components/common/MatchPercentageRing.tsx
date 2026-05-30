import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { MatchPercentageResult } from '@/domain/scoring/calculateMatchPercentage';
import { getMatchPercentageLabel } from '@/domain/scoring/calculateMatchPercentage';
import { colors, typography } from '@/theme';

export const MATCH_PERCENTAGE_RING_SIZE = 52;

interface MatchPercentageRingProps {
  match: MatchPercentageResult;
  size?: number;
  showLabel?: boolean;
}

export function MatchPercentageRing({
  match,
  size = MATCH_PERCENTAGE_RING_SIZE,
  showLabel = true,
}: MatchPercentageRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, match.percentage));
  const isFullRing = progress >= 100;
  const strokeDashoffset = isFullRing
    ? 0
    : circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ringBox, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.match.track}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {isFullRing ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={match.color}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ) : (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={match.color}
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
        <View style={styles.percentageOverlay} pointerEvents="none">
          <Text
            style={[styles.percentageText, { color: match.color }]}
            numberOfLines={1}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            %{progress}
          </Text>
        </View>
      </View>
      {showLabel ? (
        <Text
          style={[styles.levelBelow, { color: match.color }]}
          numberOfLines={1}
          {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
        >
          {getMatchPercentageLabel(match.level)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ringBox: {
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentageOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  levelBelow: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
