import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/i18nProvider';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface NavItem {
  name: string;
  icon: string;
  screen: string;
  labelKey: string;
}

const BottomNavbar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    {
      name: 'Home',
      icon: 'home',
      screen: 'HomeScreen',
      labelKey: 'home'
    },
    {
      name: 'Lessons',
      icon: 'book',
      screen: 'LessonsListScreen',
      labelKey: 'learn'
    },
    {
      name: 'Quiz',
      icon: 'help-circle',
      screen: 'QuizSelectionScreen',
      labelKey: 'quiz'
    },
    {
      name: 'Badges',
      icon: 'trophy',
      screen: 'BadgesScreen',
      labelKey: 'badges'
    },
    {
      name: 'AI Chat',
      icon: 'chatbubbles',
      screen: 'AiChatScreen',
      labelKey: 'aiChat.title'
    },
    {
      name: 'Code Builder',
      icon: 'code-slash',
      screen: 'AiCodeBuilderScreen',
      labelKey: 'codeBuilder.title'
    },
    {
      name: 'Profile',
      icon: 'person',
      screen: 'SettingsScreen',
      labelKey: 'profile'
    }
  ];

  const isActive = (screenName: string) => {
    return state.routes[state.index].name === screenName;
  };

  const handleNavPress = (screenName: string) => {
    const targetIndex = state.routes.findIndex(route => route.name === screenName);
    if (targetIndex !== -1 && targetIndex !== state.index) {
      navigation.navigate(screenName);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary + '10', colors.accent + '10']}
        style={styles.gradient}
      />
      
      <View style={styles.navContainer}>
        {navItems.map((item, index) => {
          const active = isActive(item.screen);
          
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => handleNavPress(item.screen)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={active 
                  ? [colors.primary, colors.accent] 
                  : ['transparent', 'transparent']
                }
                style={[styles.iconContainer, active && styles.activeIconContainer]}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={active ? 'white' : colors.textSecondary} 
                />
              </LinearGradient>
              
              <Text style={[
                styles.label, 
                { 
                  color: active ? colors.primary : colors.textSecondary,
                  fontWeight: active ? '600' : '400'
                }
              ]}>
                {t(item.labelKey)}
              </Text>
              
              {active && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default BottomNavbar; 