import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface FuturisticNavbarProps {
  title: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
}

const FuturisticNavbar: React.FC<FuturisticNavbarProps> = ({ title, onBack, rightIcon, onRightPress }) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 0, useNativeDriver: true, speed: 2 }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.container,
      { backgroundColor: colors.surface, transform: [{ translateY: anim }] }
    ]}>
      <LinearGradient
        colors={[colors.primary, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={styles.inner}>
        {onBack && (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text, textShadowColor: colors.accent, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } }]}>{title}</Text>
        {rightIcon && (
          <TouchableOpacity style={styles.iconBtn} onPress={onRightPress}>
            <Ionicons name={rightIcon as any} size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <LinearGradient
        colors={['transparent', colors.accent]}
        style={styles.bottomGlow}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 90,
    justifyContent: 'flex-end',
    elevation: 10,
    shadowColor: '#00f0ff',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    flex: 1,
    textAlign: 'center',
  },
  bottomGlow: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 6,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  }
});

export default FuturisticNavbar; 