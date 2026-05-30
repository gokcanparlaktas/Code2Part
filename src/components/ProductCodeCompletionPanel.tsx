import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { completeProductCode } from '@/domain/resolver/completeProductCode';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';
import type {
  ProductCodeCompletionFieldDefinition,
  ProductCodeCompletionFieldKey,
  ProductCodeCompletionOption,
  ProductCodeCompletionRecognizedField,
  ProductCodeCompletionResult,
  ProductCodeCompletionSelections,
} from '@/types/productCodeCompletion';

interface ProductCodeCompletionPanelProps {
  inputCode: string;
  initialCompletion: ProductCodeCompletionResult;
  onSearchWithCode: (code: string) => void;
  onOpenEquivalents: (code: string) => void;
}

function buildInitialSelections(
  missingFields: ProductCodeCompletionFieldDefinition[]
): ProductCodeCompletionSelections {
  const selections: ProductCodeCompletionSelections = {};
  for (const field of missingFields) {
    selections[field.key] = undefined;
  }
  return selections;
}

function allCompletionFieldsAddressed(
  missingFields: ProductCodeCompletionFieldDefinition[],
  selections: ProductCodeCompletionSelections
): boolean {
  return missingFields.every((field) => selections[field.key] !== undefined);
}

function OptionChip({
  option,
  selected,
  onPress,
  styles,
}: {
  option: ProductCodeCompletionOption;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionChip,
        option.isUncertainOption && styles.optionChipUncertain,
        selected && styles.optionChipSelected,
        pressed && styles.optionChipPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionChipText,
          option.isUncertainOption && styles.optionChipTextUncertain,
          selected && styles.optionChipTextSelected,
        ]}
      >
        {option.displayValue}
      </Text>
    </Pressable>
  );
}

function RecognizedFieldsList({
  fields,
  styles,
}: {
  fields: ProductCodeCompletionRecognizedField[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.recognizedBox}>
      {fields.map((field) => (
        <View key={field.key} style={styles.recognizedRow}>
          <Text style={styles.recognizedLabel}>{field.labelTr}</Text>
          <Text style={styles.recognizedValue}>{field.value}</Text>
        </View>
      ))}
    </View>
  );
}

function MissingFieldSelector({
  field,
  selectedToken,
  onSelect,
  styles,
}: {
  field: ProductCodeCompletionFieldDefinition;
  selectedToken: string | null | undefined;
  onSelect: (token: string | null) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const hasSelection = selectedToken !== undefined;

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{field.labelTr}</Text>
      <View style={styles.optionRow}>
        {field.options.map((option) => {
          const isSelected = hasSelection
            ? option.isUncertainOption
              ? selectedToken === null
              : selectedToken === option.token
            : false;

          return (
            <OptionChip
              key={`${field.key}-${option.token ?? 'uncertain'}`}
              option={option}
              selected={Boolean(isSelected)}
              onPress={() => onSelect(option.isUncertainOption ? null : option.token)}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

export function ProductCodeCompletionPanel({
  inputCode,
  initialCompletion,
  onSearchWithCode,
  onOpenEquivalents,
}: ProductCodeCompletionPanelProps) {
  const styles = useHomeStyles(createStyles);
  const [selections, setSelections] = useState<ProductCodeCompletionSelections>(() =>
    buildInitialSelections(initialCompletion.missingFields)
  );

  const fieldsAddressed = allCompletionFieldsAddressed(
    initialCompletion.missingFields,
    selections
  );

  const completion = useMemo(
    () =>
      fieldsAddressed
        ? completeProductCode(inputCode, selections)
        : initialCompletion,
    [fieldsAddressed, inputCode, initialCompletion, selections]
  );

  const updateSelection = (key: ProductCodeCompletionFieldKey, token: string | null) => {
    setSelections((current) => ({ ...current, [key]: token }));
  };

  const hasCompletedPreview =
    fieldsAddressed &&
    (completion.completionStatus === 'completed_full' ||
      completion.completionStatus === 'completed_partial');

  const completedTitle =
    completion.completionStatus === 'completed_full'
      ? 'Tamamlanan ürün kodu'
      : 'Kısmi tamamlanan ürün kodu';

  if (initialCompletion.completionStatus === 'already_complete') {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Kod tam görünüyor</Text>
        <Text style={styles.intro}>
          Girilen kod tam sipariş kodu olarak çözümlendi. Muadil aramasına devam edebilirsiniz.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={() => onOpenEquivalents(completion.completedCode ?? inputCode)}
        >
          <Text style={styles.primaryButtonText}>Muadilleri gör</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Kodu Tamamla</Text>
      <Text style={styles.intro}>
        Tanınan bölümler korunur. Tam sipariş kodu için aşağıdaki eksik alanların her birinden
        bir seçenek belirleyin.
      </Text>

      <RecognizedFieldsList fields={initialCompletion.recognizedFields} styles={styles} />

      {initialCompletion.missingFields.map((field) => (
        <MissingFieldSelector
          key={field.key}
          field={field}
          selectedToken={selections[field.key]}
          onSelect={(token) => updateSelection(field.key, token)}
          styles={styles}
        />
      ))}

      {!fieldsAddressed ? (
        <Text style={styles.pendingHint}>
          {initialCompletion.missingFields.length} alanın tamamı seçilmeden tam kod
          oluşturulmaz.
        </Text>
      ) : null}

      {hasCompletedPreview && completion.completedCode ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{completedTitle}</Text>
          <Text style={styles.resultCode}>{completion.completedCode}</Text>
          <Text style={styles.resultSubtitle}>
            Girilen koddaki tanımlı alanlar ve seçilen opsiyonlarla oluşturuldu.
          </Text>

          {completion.checkNotes.map((note) => (
            <Text key={note} style={styles.checkNote}>
              {note}
            </Text>
          ))}

          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => onSearchWithCode(completion.completedCode!)}
            >
              <Text style={styles.secondaryButtonText}>Bu kodla ara</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => onOpenEquivalents(completion.completedCode!)}
            >
              <Text style={styles.primaryButtonText}>Muadilleri gör</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    panel: {
      gap: 12,
      marginTop: 8,
    },
    title: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    intro: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    pendingHint: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    recognizedBox: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      padding: 12,
    },
    recognizedRow: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
    },
    recognizedLabel: {
      color: c.textMuted,
      fontSize: 13,
    },
    recognizedValue: {
      color: c.textPrimary,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'right',
    },
    fieldBlock: {
      gap: 8,
    },
    fieldLabel: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionChip: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    optionChipUncertain: {
      borderStyle: 'dashed',
    },
    optionChipSelected: {
      backgroundColor: c.checkBlueBg,
      borderColor: c.checkBlueBorder,
    },
    optionChipPressed: {
      opacity: 0.88,
    },
    optionChipText: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: '500',
    },
    optionChipTextUncertain: {
      color: c.textDim,
    },
    optionChipTextSelected: {
      color: c.brandBlue,
      fontWeight: '600',
    },
    resultCard: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      padding: 12,
    },
    resultTitle: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    resultCode: {
      color: c.brandBlue,
      fontSize: 15,
      fontWeight: '700',
    },
    resultSubtitle: {
      color: c.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    checkNote: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      flexGrow: 1,
      minWidth: 140,
      paddingVertical: 12,
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      flexGrow: 1,
      minWidth: 140,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    buttonPressed: {
      opacity: 0.88,
    },
  });
