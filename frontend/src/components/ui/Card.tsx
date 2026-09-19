import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  gradient?: string[];
  style?: any;
  padding?: number;
  margin?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  gradient,
  style,
  padding = 16,
  margin = 0,
}) => {
  const { colors } = useTheme();
  
  const cardGradient = gradient || colors.surfaceGradient;

  const CardContent = () => (
    <LinearGradient
      colors={cardGradient}
      style={[
        styles.card,
        { padding, margin },
        style,
      ]}
    >
      <View style={[styles.content, { borderColor: colors.border }]}>
        {children}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}); 