import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography, buttons } from '@/theme';
import { formatNotFoundSearchTips } from '@/utils/notFoundSearchTips';

interface UnresolvedResultCardProps {
  originalInput: string;
  normalizedCode: string;
  brand?: string | null;
  series?: string | null;
  initiallySaved?: boolean;
  hasPartialSuggestions?: boolean;
  onSave: () => Promise<void>;
}

export function UnresolvedResultCard({
  originalInput,
  normalizedCode,
  brand,
  series,
  initiallySaved = false,
  hasPartialSuggestions = false,
  onSave,
}: UnresolvedResultCardProps) {
  const [saved, setSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saved || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {hasPartialSuggestions ? 'Tam ürün kodu tanınamadı' : 'Ürün kodu tanınamadı'}
      </Text>
      <Text style={styles.body}>
        {hasPartialSuggestions
          ? 'Kod tam olarak çözümlenemedi. Olası seriler yukarıda listelenmiştir. İsterseniz bu kodu veri setine eklemek için kaydedebilirsiniz.'
          : 'Bu kodla eşleşen ürün bulunamadı. Aşağıdaki önerileri deneyebilir veya kodu kaydedebilirsiniz.'}
      </Text>

      {!hasPartialSuggestions ? (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Ne deneyebilirsiniz?</Text>
          <Text style={styles.tipsText}>{formatNotFoundSearchTips()}</Text>
        </View>
      ) : null}

      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Normalize kod</Text>
        <Text style={styles.detailValue}>{normalizedCode}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Marka</Text>
        <Text style={styles.detailValue}>{brand ?? 'Marka bulunamadı'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Seri</Text>
        <Text style={styles.detailValue}>{series ?? 'Seri bulunamadı'}</Text>
      </View>

      {saved ? (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>Kod kaydedildi</Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && !saving ? styles.saveButtonPressed : null,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Kaydediliyor…' : 'Bu kodu kaydet'}
          </Text>
        </Pressable>
      )}

      {originalInput !== normalizedCode ? (
        <Text style={styles.originalHint}>Girilen kod: {originalInput}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderLeftColor: colors.accent.orange,
    borderLeftWidth: 3,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.surface.text,
  },
  body: {
    ...typography.body,
    color: colors.surface.textSecondary,
  },
  detailBox: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.sectionTitle,
    color: colors.surface.textMuted,
    fontSize: 11,
  },
  detailValue: {
    ...typography.body,
    color: colors.surface.text,
    fontWeight: '600',
  },
  saveButton: {
    ...buttons.primary,
    marginTop: spacing.xs,
  },
  saveButtonDisabled: buttons.primaryDisabled,
  saveButtonPressed: buttons.primaryPressed,
  saveButtonText: buttons.primaryText,
  confirmBox: {
    backgroundColor: colors.status.success.bg,
    borderColor: colors.status.success.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  confirmText: {
    ...typography.bodySm,
    color: colors.status.success.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  originalHint: {
    ...typography.caption,
    color: colors.surface.textMuted,
  },
  tipsBox: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  tipsTitle: {
    ...typography.label,
    color: colors.surface.text,
  },
  tipsText: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
  },
});
