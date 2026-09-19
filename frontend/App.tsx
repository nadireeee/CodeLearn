import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGlobalLogout } from './src/services/api';

import { ThemeProvider } from './src/theme/ThemeProvider';
import { I18nProvider } from './src/i18n/i18nProvider';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import LessonsListScreen from './src/screens/LessonsListScreen';
import LessonScreen from './src/screens/LessonScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import { AiChatScreen } from './src/screens/AiChatScreen';
import AiCodeBuilderScreen from './src/screens/AiCodeBuilderScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import DuolingoQuizScreen from './src/screens/DuolingoQuizScreen';
import CodeAnalysisScreen from './src/screens/CodeAnalysisScreen';
import RandomQuestionScreen from './src/screens/RandomQuestionScreen';
import QuizSelectionScreen from './src/screens/QuizSelectionScreen';
import QuizStatsScreen from './src/screens/QuizStatsScreen';

// Forum Screens
import { ForumListScreen } from './src/screens/ForumListScreen';
import { ForumDetailScreen } from './src/screens/ForumDetailScreen';
import { CreateQuestionScreen } from './src/screens/CreateQuestionScreen';

// Components
import BottomNavbar from './src/components/BottomNavbar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomNavbar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="LessonsListScreen" component={LessonsListScreen} />
      <Tab.Screen name="QuizSelectionScreen" component={QuizSelectionScreen} />
      <Tab.Screen name="ForumListScreen" component={ForumListScreen} />
      <Tab.Screen name="AiChatScreen" component={AiChatScreen} />
      <Tab.Screen name="AiCodeBuilderScreen" component={AiCodeBuilderScreen} />
      <Tab.Screen name="SettingsScreen" component={SettingsScreen} />
      <Tab.Screen name="DuolingoQuizScreen" component={DuolingoQuizScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="QuizStatsScreen" component={QuizStatsScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Check onboarding completion status for the current user
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        if (user && isAuthenticated) {
          // User is logged in, check their onboarding status
          const completed = await AsyncStorage.getItem(`onboarding_${user.id}`);
          console.log('[Onboarding] User status check:', { userId: user.id, completed });
          setHasCompletedOnboarding(completed === 'true');
        } else {
          // No user logged in or not authenticated, don't check onboarding
          setHasCompletedOnboarding(null);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCompletedOnboarding(false);
      }
    };

    if (!isLoading) {
      checkOnboardingStatus();
    }
  }, [isLoading, user, isAuthenticated]);

  const handleOnboardingComplete = async () => {
    try {
      if (user) {
        await AsyncStorage.setItem(`onboarding_${user.id}`, 'true');
        console.log('[Onboarding] Marked as completed for user:', user.id);
      }
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  // Onboarding wrapper component
  const OnboardingWrapper = () => (
    <OnboardingScreen onComplete={handleOnboardingComplete} />
  );

  // Show loading only when checking auth state
  if (isLoading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  console.log('[Navigation] Status:', { isAuthenticated, hasCompletedOnboarding, userId: user?.id });

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // User not authenticated - show auth screens (login/signup)
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          // User is authenticated
          <>
            {hasCompletedOnboarding === false ? (
              // Show onboarding after login if not completed
              <Stack.Screen name="Onboarding" component={OnboardingWrapper} />
            ) : (
              // Show main app after onboarding completion or if already completed
              <>
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="LessonScreen" component={LessonScreen} />
                <Stack.Screen name="RandomQuestionScreen" component={RandomQuestionScreen} />
                <Stack.Screen name="DuolingoQuiz" component={DuolingoQuizScreen} />
                <Stack.Screen name="QuizStats" component={QuizStatsScreen} />
                <Stack.Screen name="CodeAnalysis" component={CodeAnalysisScreen} />
                <Stack.Screen name="ForumDetail" component={ForumDetailScreen} />
                <Stack.Screen name="CreateQuestion" component={CreateQuestionScreen} />
                <Stack.Screen name="BadgesScreen" component={BadgesScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => {
  const { forceLogout } = useAuth();
  
  // Global logout fonksiyonunu set et
  React.useEffect(() => {
    setGlobalLogout(forceLogout);
  }, [forceLogout]);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
