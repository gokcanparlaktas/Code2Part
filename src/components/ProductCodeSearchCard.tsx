import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const EXAMPLES = ['DSBC-50-100-PPVA-N3', 'CP96-50-100'];

export function ProductCodeSearchCard() {
  const [code, setCode] = useState('');

  const handleSearch = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      return;
    }
    router.push({
      pathname: '/result',
      params: { code: trimmed },
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Ürün kodu</Text>
      <Text style={styles.hint}>
        Festo, SMC ve benzeri kodları buraya yazın
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Örn. DSBC-50-100-PPVA-N3"
        placeholderTextColor="#64748B"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        selectionColor="#1E40AF"
        underlineColorAndroid="#1E40AF"
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          !code.trim() && styles.buttonDisabled,
          pressed && code.trim() ? styles.buttonPressed : null,
        ]}
        onPress={handleSearch}
        disabled={!code.trim()}
      >
        <Text style={styles.buttonText}>Tanımla ve karşılaştır</Text>
      </Pressable>

      <Text style={styles.examplesTitle}>Hızlı örnekler</Text>
      <View style={styles.examplesRow}>
        {EXAMPLES.map((example) => (
          <Pressable
            key={example}
            style={styles.exampleChip}
            onPress={() => setCode(example)}
          >
            <Text style={styles.exampleText}>{example}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  label: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1E40AF',
    borderRadius: 12,
    borderWidth: 2,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '600',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    ...Platform.select({
      android: { elevation: 0 },
      default: {},
    }),
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 16,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  examplesTitle: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
});
