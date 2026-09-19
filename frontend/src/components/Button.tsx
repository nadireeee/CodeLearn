import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, TextStyle, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'glass' | 'google' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large' | 'xl';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  gradient?: boolean;
  animated?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  iconRight,
  gradient = false,
  animated = false,
  loading = false,
}) => {
  const { colors, typography } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animated]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      opacity: disabled ? 0.6 : 1,
      overflow: 'hidden',
    };

    const sizeStyles = {
      small: { paddingVertical: 10, paddingHorizontal: 20, height: 44, minWidth: 100 },
      medium: { paddingVertical: 14, paddingHorizontal: 28, height: 56, minWidth: 120 },
      large: { paddingVertical: 18, paddingHorizontal: 36, height: 64, minWidth: 140 },
      xl: { paddingVertical: 22, paddingHorizontal: 44, height: 72, minWidth: 160 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
      secondary: {
        backgroundColor: colors.secondary,
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
      accent: {
        backgroundColor: colors.accent,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
      glass: {
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.border,
        backdropFilter: 'blur(10px)',
      },
      google: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
      success: {
        backgroundColor: colors.success,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
      warning: {
        backgroundColor: colors.warning,
        shadowColor: colors.warning,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
      error: {
        backgroundColor: colors.error,
        shadowColor: colors.error,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.5,
    };

    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
      xl: { fontSize: 20 },
    };

    const variantTextStyles = {
      primary: { color: colors.textOnPrimary },
      secondary: { color: colors.textOnSecondary },
      accent: { color: colors.textOnAccent },
      outline: { color: colors.primary },
      glass: { color: colors.text },
      google: { color: '#334155' },
      success: { color: colors.textOnPrimary },
      warning: { color: colors.textOnPrimary },
      error: { color: colors.textOnPrimary },
    };

    return {
      ...baseTextStyle,
      ...typography.button,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...textStyle,
    };
  };

  const getIconColor = () => {
    if (variant === 'google') return '#DB4437';
    if (variant === 'outline') return colors.primary;
    if (variant === 'glass') return colors.text;
    return colors.textOnPrimary;
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'primary': return colors.primaryGradient;
      case 'secondary': return colors.secondaryGradient;
      case 'accent': return colors.accentGradient;
      case 'success': return colors.successGradient;
      case 'warning': return colors.warningGradient;
      case 'error': return colors.errorGradient;
      default: return colors.primaryGradient;
    }
  };

  const buttonContent = (
    <>
      {gradient && (
        <LinearGradient
          colors={getGradientColors()}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      {icon && !loading && (
        <Ionicons 
          name={icon} 
          size={size === 'xl' ? 28 : size === 'large' ? 24 : 20} 
          color={getIconColor()} 
          style={{ marginRight: 8 }}
        />
      )}
      {loading ? (
        <Animated.View style={{ marginRight: 8 }}>
          <Ionicons name="refresh" size={20} color={getIconColor()} />
        </Animated.View>
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
      {iconRight && !loading && (
        <Ionicons 
          name={iconRight} 
          size={size === 'xl' ? 28 : size === 'large' ? 24 : 20} 
          color={getIconColor()} 
          style={{ marginLeft: 8 }}
        />
      )}
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button; 