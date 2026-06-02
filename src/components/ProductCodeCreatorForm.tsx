import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBrandHeader } from '@/components/AppBrandHeader';
import { HomeSelectField } from '@/components/HomeSelectField';
import {
  CODE_CREATOR_CATEGORIES,
  getCodeCreatorCategory,
  getCodeCreatorFields,
} from '@/domain/codeCreator/getCodeCreatorSchema';
import { generateProductCodes } from '@/domain/codeCreator/generateProductCodes';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import type {
  CodeCreatorBrandKey,
  CodeCreatorCategoryKey,
  CodeCreatorFieldDefinition,
  CodeCreatorFieldOption,
  CodeCreatorSelections,
  GeneratedProductCode,
  HydraulicValveMountingGroupKey,
} from '@/types/productCodeCreator';
import { productCodeResultHref } from '@/utils/productCodeRouteParam';

function SectionLabel({ children, styles }: { children: string; styles: CardStyles }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function OptionChip({
  option,
  selected,
  onPress,
  styles,
}: {
  option: CodeCreatorFieldOption;
  selected: boolean;
  onPress: () => void;
  styles: CardStyles;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionChip,
        option.isUncertain && styles.optionChipUncertain,
        selected && styles.optionChipSelected,
        pressed && styles.optionChipPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionChipText,
          option.isUncertain && styles.optionChipTextUncertain,
          selected && styles.optionChipTextSelected,
        ]}
      >
        {option.labelTr}
      </Text>
    </Pressable>
  );
}

function FieldSelector({
  field,
  value,
  onChange,
  styles,
}: {
  field: CodeCreatorFieldDefinition;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  styles: CardStyles;
}) {
  if (field.control === 'select') {
    const selectOptions = field.options.map((option) => ({
      value: option.value,
      label: option.labelTr,
    }));
    const selectedValue =
      value && !optionIsUncertain(value) ? (value as string) : undefined;

    return (
      <HomeSelectField
        label={field.labelTr + (field.required ? ' *' : '')}
        hint={field.hintTr}
        value={selectedValue}
        placeholder={`${field.labelTr} seçin`}
        options={selectOptions}
        onChange={(next) => onChange(next)}
      />
    );
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {field.labelTr}
        {field.required ? ' *' : ''}
      </Text>
      {field.hintTr ? <Text style={styles.fieldHint}>{field.hintTr}</Text> : null}
      <View style={styles.optionRow}>
        {field.options.map((option) => (
          <OptionChip
            key={option.value}
            option={option}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}

function optionIsUncertain(value: string): boolean {
  return value === '__uncertain__';
}

function GeneratedCodeCard({
  entry,
  styles,
  onOpen,
}: {
  entry: GeneratedProductCode;
  styles: CardStyles;
  onOpen: (code: string) => void;
}) {
  const { homeColors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
      onPress={() => onOpen(entry.code)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultBrand}>{entry.brand}</Text>
        <Text style={styles.resultSeries}>{entry.series}</Text>
      </View>
      <Text style={styles.resultCode}>{entry.code}</Text>
      {entry.status === 'generated_partial' ? (
        <Text style={styles.resultHint}>Kısmi — katalog kontrolü önerilir</Text>
      ) : null}
      {entry.notes.map((note) => (
        <Text key={note} style={styles.resultNote}>
          {note}
        </Text>
      ))}
      <View style={styles.resultAction}>
        <Text style={styles.resultActionText}>Tanımla</Text>
        <Ionicons name="chevron-forward" size={16} color={homeColors.textMuted} />
      </View>
    </Pressable>
  );
}

type CardStyles = ReturnType<typeof createStyles>;

export function ProductCodeCreatorForm() {
  const styles = useHomeStyles(createStyles);
  const [category, setCategory] = useState<CodeCreatorCategoryKey>('hydraulic_valve');
  const [mountingGroup, setMountingGroup] =
    useState<HydraulicValveMountingGroupKey>('cetop_03_ng6');
  const [brandFilter, setBrandFilter] = useState<CodeCreatorBrandKey | null>(null);
  const [selections, setSelections] = useState<CodeCreatorSelections>({});
  const [submitted, setSubmitted] = useState(false);

  const categoryDef = getCodeCreatorCategory(category);
  const fields = useMemo(
    () =>
      getCodeCreatorFields({
        category,
        brandFilter,
        mountingGroup: category === 'hydraulic_valve' ? mountingGroup : undefined,
      }),
    [category, brandFilter, mountingGroup]
  );

  const categoryOptions = useMemo(
    () =>
      CODE_CREATOR_CATEGORIES.map((item) => ({
        value: item.key,
        label: item.labelTr,
        description: item.descriptionTr,
      })),
    []
  );

  const result = useMemo(() => {
    if (!submitted) {
      return null;
    }
    return generateProductCodes({
      category,
      mountingGroup: category === 'hydraulic_valve' ? mountingGroup : undefined,
      brandFilter,
      selections,
    });
  }, [submitted, category, mountingGroup, brandFilter, selections]);

  const setField = (key: string, value: string | null) => {
    setSubmitted(false);
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (next: CodeCreatorCategoryKey) => {
    setCategory(next);
    setBrandFilter(null);
    setSelections({});
    setSubmitted(false);
  };

  const handleBrandChange = (next: CodeCreatorBrandKey | null) => {
    setBrandFilter(next);
    setSelections({});
    setSubmitted(false);
  };

  const canGenerate = fields
    .filter((field) => field.required)
    .every((field) => selections[field.key] && selections[field.key] !== '__uncertain__');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppBrandHeader howItWorksVariant="code-creator" />

      <View style={styles.introBlock}>
        <Text style={styles.title}>Kod yaratıcı</Text>
        <Text style={styles.subtitle}>
          Ürün tipini ve teknik seçimleri yapın; marka seçerseniz o markanın kodu, seçmezseniz
          tüm desteklenen marka kodları listelenir.
        </Text>
      </View>

      <HomeSelectField
        label="Ürün tipi"
        hint="Oluşturmak istediğiniz ürün ailesini seçin."
        value={category}
        options={categoryOptions}
        onChange={handleCategoryChange}
      />

      <View style={styles.card}>
        {category === 'hydraulic_valve' && categoryDef?.mountingGroups ? (
          <>
            <SectionLabel styles={styles}>Montaj ölçüsü</SectionLabel>
            <View style={styles.optionRow}>
              {categoryDef.mountingGroups.map((group) => (
                <OptionChip
                  key={group.key}
                  option={{ value: group.key, labelTr: group.labelTr }}
                  selected={mountingGroup === group.key}
                  onPress={() => {
                    setMountingGroup(group.key);
                    setSelections({});
                    setSubmitted(false);
                  }}
                  styles={styles}
                />
              ))}
            </View>
          </>
        ) : null}

        <SectionLabel styles={styles}>Marka (isteğe bağlı)</SectionLabel>
        <View style={styles.optionRow}>
          {categoryDef?.brands.map((brand) => (
            <OptionChip
              key={brand.key ?? 'all'}
              option={{ value: brand.key ?? 'all', labelTr: brand.labelTr }}
              selected={brandFilter === brand.key}
              onPress={() => handleBrandChange(brand.key)}
              styles={styles}
            />
          ))}
        </View>

        <View style={styles.cardDivider} />

        <Text style={styles.cardTitle}>Teknik seçimler</Text>
        {fields.map((field) => (
          <FieldSelector
            key={field.key}
            field={field}
            value={selections[field.key]}
            onChange={(value) => setField(field.key, value)}
            styles={styles}
          />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.generateButton,
          !canGenerate && styles.generateButtonDisabled,
          pressed && canGenerate && styles.generateButtonPressed,
        ]}
        disabled={!canGenerate}
        onPress={() => setSubmitted(true)}
      >
        <Text style={styles.generateButtonText}>Kodu oluştur</Text>
      </Pressable>

      {result && result.codes.length === 0 ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            Seçimlere uygun kod üretilemedi. Zorunlu alanları doldurun veya farklı kombinasyon
            deneyin.
          </Text>
        </View>
      ) : null}

      {result && result.checkNotes.length > 0 ? (
        <View style={styles.notesBox}>
          {result.checkNotes.map((note) => (
            <Text key={note} style={styles.noteText}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}

      {result && result.codes.length > 0 ? (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Oluşturulan kodlar</Text>
          {result.codes.map((entry) => (
            <GeneratedCodeCard
              key={entry.seriesId}
              entry={entry}
              styles={styles}
              onOpen={(code) => router.push(productCodeResultHref(code))}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: 16,
      paddingBottom: 24,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    introBlock: {
      gap: 6,
    },
    title: {
      color: c.headerTitle,
      fontSize: 20,
      fontWeight: '600',
    },
    subtitle: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    card: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 12,
      padding: 14,
    },
    cardTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    cardDivider: {
      backgroundColor: c.border,
      height: 1,
      marginVertical: 4,
    },
    sectionLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    fieldBlock: {
      gap: 8,
    },
    fieldLabel: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },
    fieldHint: {
      color: c.textDim,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 4,
    },
    optionChip: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    optionChipUncertain: {
      borderStyle: 'dashed',
    },
    optionChipSelected: {
      borderColor: c.accent,
    },
    optionChipPressed: {
      opacity: 0.85,
    },
    optionChipText: {
      color: c.textDim,
      fontSize: 12,
      fontWeight: '500',
    },
    optionChipTextUncertain: {
      color: c.textMuted,
    },
    optionChipTextSelected: {
      color: c.accent,
    },
    generateButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      paddingVertical: 14,
    },
    generateButtonDisabled: {
      opacity: 0.45,
    },
    generateButtonPressed: {
      opacity: 0.88,
    },
    generateButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
    alertBox: {
      backgroundColor: c.amberBg,
      borderColor: c.amberBorder,
      borderLeftWidth: 3,
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
    },
    alertText: {
      color: c.amber,
      fontSize: 12,
      lineHeight: 17,
    },
    notesBox: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
      padding: 12,
    },
    noteText: {
      color: c.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    resultsSection: {
      gap: 10,
    },
    resultsTitle: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    resultCard: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
      padding: 14,
    },
    resultCardPressed: {
      opacity: 0.92,
    },
    resultHeader: {
      flexDirection: 'row',
      gap: 8,
    },
    resultBrand: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    resultSeries: {
      color: c.textMuted,
      fontSize: 14,
    },
    resultCode: {
      color: c.brandBlue,
      fontFamily: homeMonoFont,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    resultHint: {
      color: c.textDim,
      fontSize: 12,
    },
    resultNote: {
      color: c.textDim,
      fontSize: 12,
    },
    resultAction: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    resultActionText: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
  });
