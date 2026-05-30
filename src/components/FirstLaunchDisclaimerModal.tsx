import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  APP_DISCLAIMER_ACCEPT_LABEL,
  APP_DISCLAIMER_PARAGRAPHS,
} from '@/services/appDisclaimerContent';
import { colors, radius, spacing, typography, buttons } from '@/theme';

interface FirstLaunchDisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function FirstLaunchDisclaimerModal({
  visible,
  onAccept,
}: FirstLaunchDisclaimerModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.titleBar}>
            <Text style={styles.title}>Önemli bilgilendirme</Text>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {APP_DISCLAIMER_PARAGRAPHS.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onAccept}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{APP_DISCLAIMER_ACCEPT_LABEL}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 22, 40, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxHeight: '85%',
    maxWidth: 520,
    overflow: 'hidden',
    width: '100%',
  },
  titleBar: {
    backgroundColor: colors.navy[900],
    borderBottomColor: colors.border.navy,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.inverse,
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.surface.textSecondary,
  },
  button: {
    ...buttons.primary,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonPressed: buttons.primaryPressed,
  buttonText: buttons.primaryText,
});
