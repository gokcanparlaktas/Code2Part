import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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

export interface HomeSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface HomeSelectFieldProps<T extends string> {
  label: string;
  hint?: string;
  value?: T;
  placeholder?: string;
  options: HomeSelectOption<T>[];
  onChange: (value: T) => void;
  testID?: string;
}

export function HomeSelectField<T extends string>({
  label,
  hint,
  value,
  placeholder = 'Seçin',
  options,
  onChange,
  testID,
}: HomeSelectFieldProps<T>) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = value ? options.find((option) => option.value === value) : undefined;

  return (
    <View style={styles.root}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <Pressable
        testID={testID}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text
          style={[styles.triggerText, !selected && styles.triggerPlaceholder]}
          numberOfLines={2}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={homeColors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
              {options.map((option, index) => {
                const isSelected =
                  value !== undefined && value !== '' && option.value === value;
                return (
                  <Pressable
                    key={`${option.value}::${index}`}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {option.label}
                      </Text>
                      {option.description ? (
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={20} color={homeColors.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    root: {
      gap: 0,
    },
    fieldHeader: {
      marginBottom: 12,
    },
    label: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    hint: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    trigger: {
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    triggerPressed: {
      opacity: 0.9,
    },
    triggerText: {
      color: c.textPrimary,
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      paddingRight: 8,
    },
    triggerPlaceholder: {
      color: c.textDim,
      fontWeight: '400',
    },
    backdrop: {
      backgroundColor: 'rgba(0,0,0,0.45)',
      flex: 1,
      justifyContent: 'flex-end',
      padding: 16,
    },
    sheet: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: '70%',
      padding: 12,
    },
    sheetTitle: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.8,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    sheetScroll: {
      maxHeight: 320,
    },
    optionRow: {
      alignItems: 'center',
      borderRadius: 8,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    optionRowSelected: {
      backgroundColor: c.inputBg,
    },
    optionRowPressed: {
      opacity: 0.88,
    },
    optionTextWrap: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: c.textPrimary,
      fontSize: 15,
    },
    optionLabelSelected: {
      color: c.accent,
      fontWeight: '600',
    },
    optionDescription: {
      color: c.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    closeButton: {
      alignItems: 'center',
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 8,
      paddingVertical: 12,
    },
    closeButtonPressed: {
      opacity: 0.88,
    },
    closeButtonText: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
  });
