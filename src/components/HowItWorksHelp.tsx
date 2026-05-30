import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface HowItWorksHelpProps {
  /** Icon-only trigger for compact headers (e.g. home screen). */
  compact?: boolean;
}

export function HowItWorksHelp({ compact = false }: HowItWorksHelpProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);

  const steps = useMemo(
    () =>
      [
        {
          title: 'Kodu gir',
          description: 'Ürün kodunu yukarıdaki alana girin',
          icon: 'keypad-outline' as const,
          iconColor: homeColors.accent,
          iconBorder: 'rgba(249, 115, 22, 0.35)',
          iconBg: 'rgba(249, 115, 22, 0.12)',
        },
        {
          title: 'Tanımla',
          description: 'Uygulama kodu düzenler ve ürünü tanır',
          icon: 'scan-outline' as const,
          iconColor: homeColors.brandBlue,
          iconBorder: isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(10, 22, 40, 0.2)',
          iconBg: homeColors.checkBlueBg,
        },
        {
          title: 'Karşılaştır',
          description: 'Muadil serileri ve uyumluluğu görün',
          icon: 'swap-horizontal-outline' as const,
          iconColor: homeColors.green,
          iconBorder: homeColors.greenBorder,
          iconBg: homeColors.greenBg,
        },
      ] as const,
    [homeColors, isDark]
  );

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          compact ? styles.triggerCompact : styles.trigger,
          pressed && styles.triggerPressed,
        ]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Nasıl çalışır"
      >
        <View style={compact ? styles.iconCircleCompact : styles.iconCircle}>
          <Text style={compact ? styles.iconTextCompact : styles.iconText}>?</Text>
        </View>
        {compact ? null : <Text style={styles.label}>Nasıl çalışır</Text>}
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropPressable}
            onPress={() => setVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          />
          <View style={styles.card}>
            <Text style={styles.title}>Nasıl çalışır?</Text>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.steps}>
                {steps.map((step) => (
                  <View key={step.title} style={styles.stepCard}>
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: step.iconBg,
                          borderColor: step.iconBorder,
                        },
                      ]}
                    >
                      <Ionicons name={step.icon} size={22} color={step.iconColor} />
                    </View>
                    <View style={styles.stepCopy}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={styles.footnote}>
                Veri kontrolü için: Son Aramalar → Veri Kontrolü
              </Text>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
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

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    trigger: {
      alignItems: 'center',
      gap: 4,
      minWidth: 64,
      paddingTop: 2,
    },
    triggerPressed: {
      opacity: 0.85,
    },
    triggerCompact: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircleCompact: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderColor: c.border,
      borderRadius: 10,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    iconTextCompact: {
      color: c.brandBlue,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 22,
    },
    iconCircle: {
      alignItems: 'center',
      borderColor: c.brandBlue,
      borderRadius: 999,
      borderWidth: 1.5,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    iconText: {
      color: c.brandBlue,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 20,
    },
    label: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    backdrop: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    backdropPressable: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(6, 13, 24, 0.78)',
    },
    card: {
      backgroundColor: c.bg,
      borderColor: c.border,
      borderRadius: 12,
      borderWidth: 1,
      maxHeight: '88%',
      maxWidth: 420,
      overflow: 'hidden',
      paddingBottom: 16,
      width: '100%',
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      paddingBottom: 4,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    scroll: {
      maxHeight: 420,
    },
    scrollContent: {
      gap: 12,
      paddingBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    steps: {
      gap: 10,
    },
    stepCard: {
      alignItems: 'center',
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    iconBox: {
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    stepCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    stepTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    stepDescription: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    footnote: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },
    button: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 8,
      paddingVertical: 14,
    },
    buttonPressed: {
      opacity: 0.88,
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
  });
