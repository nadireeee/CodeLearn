import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ForumListScreen } from '../screens/ForumListScreen';
import { ForumDetailScreen } from '../screens/ForumDetailScreen';
import { CreateQuestionScreen } from '../screens/CreateQuestionScreen';

const Stack = createStackNavigator();

export const ForumStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ForumList" component={ForumListScreen} />
      <Stack.Screen name="ForumDetail" component={ForumDetailScreen} />
      <Stack.Screen name="CreateQuestion" component={CreateQuestionScreen} />
    </Stack.Navigator>
  );
}; 