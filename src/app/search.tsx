import { ScrollView, StyleSheet } from 'react-native';

import { ProductCodeSearchCard } from '@/components/ProductCodeSearchCard';

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
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 20,
  },
});
