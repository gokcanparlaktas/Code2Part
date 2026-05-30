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
          <Text style={styles.title}>Önemli bilgilendirme</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    maxHeight: '85%',
    maxWidth: 520,
    padding: 20,
    width: '100%',
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 420,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 8,
  },
  paragraph: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 23,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
