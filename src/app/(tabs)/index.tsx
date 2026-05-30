import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCodeSearchCard } from '@/components/ProductCodeSearchCard';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

export default function HomeScreen() {
  const styles = useHomeStyles(createStyles);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProductCodeSearchCard />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Identify.</Text>
        <Text style={styles.footerSep}>·</Text>
        <Text style={[styles.footerText, styles.footerMatch]}>Match.</Text>
        <Text style={styles.footerSep}>·</Text>
        <Text style={[styles.footerText, styles.footerCompare]}>Compare.</Text>
        <Text style={styles.footerSep}>·</Text>
        <Text style={styles.footerText}>© 2026 Code2Part</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    footer: {
      alignItems: 'center',
      backgroundColor: c.footerBg,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    footerText: {
      color: c.footerText,
      fontSize: 11,
    },
    footerMatch: {
      color: c.brandAccentBlue,
    },
    footerCompare: {
      color: c.accent,
    },
    footerSep: {
      color: c.footerSep,
      fontSize: 11,
    },
  });
