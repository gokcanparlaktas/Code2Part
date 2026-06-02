import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { homeColors } = useTheme();
  const tabBarHeight = 52 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: homeColors.accent,
        tabBarInactiveTintColor: homeColors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: homeColors.footerBg,
          borderTopColor: homeColors.borderDark,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tanımla',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="code-creator"
        options={{
          title: 'Kod yarat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="construct-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: 'Karşılaştır',
          tabBarIcon: ({ color }) => (
            <Ionicons name="git-compare-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
