import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  gradient?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  onBack,
  rightAction,
  gradient = true,
}) => {
  const { colors, typography } = useTheme();

  const HeaderContent = () => (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.glass }]} 
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name={icon} size={20} color={colors.textOnPrimary} />
          </View>
        )}
      </View>

      {/* Center Section */}
      <View style={styles.centerSection}>
        <Text style={[styles.title, { color: colors.text }, typography.h2]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }, typography.body]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightAction && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.glass }]} 
            onPress={rightAction.onPress}
          >
            <Ionicons name={rightAction.icon} size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={colors.primaryGradient}
        style={[styles.gradientContainer, { borderBottomColor: colors.border }]}
      >
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <HeaderContent />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    textAlign: 'center',
  },
}); 