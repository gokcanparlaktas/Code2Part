import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography, buttons } from '@/theme';

const STEPS = [
  'Ürün kodunu yukarıdaki alana girin',
  'Uygulama kodu düzenler ve ürünü tanır',
  'Muadil serileri ve uyumluluğu görün',
] as const;

export function HowItWorksHelp() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Nasıl çalışır"
      >
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>?</Text>
        </View>
        <Text style={styles.label}>Nasıl çalışır</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.titleBar}>
              <Text style={styles.title}>Nasıl çalışır?</Text>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.steps}>
                {STEPS.map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNum}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.footnote}>
                Veri kontrolü için: Son Aramalar → Veri Kontrolü
              </Text>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && buttons.primaryPressed]}
              onPress={() => setVisible(false)}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Tamam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 64,
    paddingTop: 2,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: colors.accent.blueLight,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconText: {
    color: colors.accent.blueLight,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  label: {
    ...typography.caption,
    color: colors.text.inverseMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 22, 40, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.accent.blueLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 420,
    overflow: 'hidden',
    width: '100%',
  },
  titleBar: {
    backgroundColor: colors.background.elevated,
    borderBottomColor: colors.border.default,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.surface.text,
  },
  scroll: {
    maxHeight: 320,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.sm,
  },
  steps: {
    gap: spacing.sm,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumCircle: {
    alignItems: 'center',
    borderColor: colors.accent.orange,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNum: {
    color: colors.accent.orange,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stepText: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
    flex: 1,
  },
  footnote: {
    ...typography.caption,
    color: colors.surface.textMuted,
    marginTop: spacing.xs,
  },
  button: {
    ...buttons.primary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: buttons.primaryText,
});
