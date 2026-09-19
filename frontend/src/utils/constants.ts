// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  LANGUAGE: 'language',
  THEME: 'theme',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'CodeLearn',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  SUPPORT_EMAIL: 'support@codelearn.app',
} as const;

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  SPLASH: 4000,
} as const;

// Screen Names
export const SCREENS = {
  SPLASH: 'Splash',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  HOME: 'Home',
  SETTINGS: 'Settings',
} as const;

// Learning Progress
export const LEARNING_CONFIG = {
  MIN_LESSON_DURATION: 5, // minutes
  MAX_LESSON_DURATION: 30, // minutes
  DAILY_GOAL: 20, // minutes
  WEEKLY_GOAL: 120, // minutes
} as const;

// Code Examples
export const CODE_EXAMPLES = {
  HELLO_WORLD: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  
  VARIABLES: `#include <iostream>

int main() {
    int number = 42;
    std::string message = "Learning C++";
    double pi = 3.14159;
    
    std::cout << "Number: " << number << std::endl;
    std::cout << "Message: " << message << std::endl;
    std::cout << "Pi: " << pi << std::endl;
    
    return 0;
}`,
  
  FUNCTIONS: `#include <iostream>

int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(5, 3);
    std::cout << "5 + 3 = " << result << std::endl;
    return 0;
}`,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please check your credentials.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const; 