import { ScrollView, StyleSheet } from 'react-native';

import { ProductCodeSearchCard } from '@/components/ProductCodeSearchCard';
import { colors, spacing } from '@/theme';

export default function SearchScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ProductCodeSearchCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  content: {
    padding: spacing.xl,
  },
});
