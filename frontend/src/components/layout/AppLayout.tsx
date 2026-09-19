import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  showBottomNav?: boolean;
  bottomNavContent?: React.ReactNode;
  backgroundGradient?: string[];
  padding?: number;
  safeArea?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showHeader = false,
  headerContent,
  showBottomNav = false,
  bottomNavContent,
  backgroundGradient,
  padding = 16,
  safeArea = true,
}) => {
  const { colors } = useTheme();
  
  const gradientColors = backgroundGradient || colors.backgroundGradient;

  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={colors.text === '#F8FAFC' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={gradientColors}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      {showHeader && (
        <View style={[styles.header, { 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border 
        }]}>
          {headerContent}
        </View>
      )}
      
      {/* Main Content */}
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
      
      {/* Bottom Navigation */}
      {showBottomNav && (
        <View style={styles.bottomNav}>
          {bottomNavContent}
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
}); 