import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCodeCreatorForm } from '@/components/ProductCodeCreatorForm';
import { useTheme } from '@/theme/ThemeProvider';

export default function CodeCreatorTabScreen() {
  const { homeColors } = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: homeColors.bg }}
      edges={['top', 'left', 'right']}
    >
      <ProductCodeCreatorForm />
    </SafeAreaView>
  );
}
