import React from 'react';
import { View, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  elevation?: number;
  gradient?: boolean;
  gradientColors?: string[];
  animated?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 20,
  margin = 0,
  elevation = 8,
  gradient = false,
  gradientColors,
  animated = false,
  onPress,
  disabled = false,
}) => {
  const { colors } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding,
    margin,
    shadowColor: colors.shadowColored,
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 0.2,
    shadowRadius: elevation,
    elevation,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  };

  const content = (
    <>
      {gradient && (
        <LinearGradient
          colors={gradientColors || colors.primaryGradient}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      {children}
    </>
  );

  if (animated) {
    return (
      <Animated.View style={[cardStyle, style]}>
        {content}
      </Animated.View>
    );
  }

  return <View style={[cardStyle, style]}>{content}</View>;
};

export default Card; 