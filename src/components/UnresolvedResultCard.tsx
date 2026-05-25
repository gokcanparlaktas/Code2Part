import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        {hasPartialSuggestions
          ? 'Tam ürün kodu tanınamadı'
          : 'Ürün kodu tanınamadı'}
      </Text>
      <Text style={styles.body}>
        {hasPartialSuggestions
          ? 'Kod tam olarak çözümlenemedi. Olası seriler yukarıda listelenmiştir. İsterseniz bu kodu veri setine eklemek için kaydedebilirsiniz.'
          : 'Kod formatı henüz desteklenmiyor olabilir. Bu kodu daha sonra veri setine eklemek için kaydedebiliriz.'}
      </Text>

      <View style={styles.detailBox}>
        <Text style={styles.detailLabel}>Normalize kod</Text>
        <Text style={styles.detailValue}>{normalizedCode}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Marka</Text>
        <Text style={styles.detailValue}>
          {brand ?? 'Marka bulunamadı'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Seri</Text>
        <Text style={styles.detailValue}>
          {series ?? 'Seri bulunamadı'}
        </Text>
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
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  title: {
    color: '#9A3412',
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: '#7C2D12',
    fontSize: 15,
    lineHeight: 22,
  },
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
  },
  confirmText: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  originalHint: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
