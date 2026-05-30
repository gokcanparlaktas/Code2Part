import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

const DISMISS_DRAG_THRESHOLD = 72;
const DISMISS_VELOCITY_THRESHOLD = 0.75;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  dismissOnBackdropPress?: boolean;
  swipeToDismiss?: boolean;
}

export function BottomSheetModal({
  visible,
  onClose,
  children,
  sheetStyle,
  dismissOnBackdropPress = true,
  swipeToDismiss = true,
}: BottomSheetModalProps) {
  const styles = useHomeStyles(createStyles);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        swipeToDismiss &&
        gesture.dy > 6 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          gesture.dy > DISMISS_DRAG_THRESHOLD ||
          gesture.vy > DISMISS_VELOCITY_THRESHOLD
        ) {
          Animated.timing(translateY, {
            duration: 180,
            toValue: 320,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) {
              onClose();
            }
          });
          return;
        }

        Animated.spring(translateY, {
          damping: 22,
          stiffness: 280,
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          damping: 22,
          stiffness: 280,
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <Animated.View
          style={[styles.sheet, sheetStyle, { transform: [{ translateY }] }]}
        >
          {swipeToDismiss ? (
            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(6, 13, 24, 0.78)',
    },
    sheet: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderWidth: 1,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    handleArea: {
      alignItems: 'center',
      paddingBottom: 4,
      paddingTop: 10,
    },
    handle: {
      backgroundColor: c.borderSub,
      borderRadius: 3,
      height: 4,
      width: 36,
    },
  });
