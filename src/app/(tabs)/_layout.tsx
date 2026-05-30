import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.orange,
        tabBarInactiveTintColor: colors.text.inverseMuted,
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          marginBottom: spacing.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.navy[900],
          borderTopColor: colors.border.subtle,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tanımla',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: 'Karşılaştır',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-compare-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
