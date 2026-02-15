import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useUser } from '../context/UserContext';
import { COLORS } from '../utils/constants';

// Auth Screens
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';

// Main Screens
import FeedScreen from '../screens/Home/FeedScreen';
import SearchScreen from '../screens/Home/SearchScreen';
import NotificationsScreen from '../screens/Home/NotificationsScreen';
import MessagesScreen from '../screens/Home/MessagesScreen';
import CreateTweetScreen from '../screens/Home/CreateTweetScreen';
import UserProfileScreen from '../screens/Profile/UserProfileScreen';
import TweetDetailScreen from '../screens/Home/TweetDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Stack - Welcome, Login, Signup
 */
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.black },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Custom Tab Bar Icon Component
const TabBarIcon = ({ focused, icon }: { focused: boolean; icon: string }) => {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
    </View>
  );
};

/**
 * Main Bottom Tabs - Feed, Search, Notifications, Messages
 */
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white, // White background
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.text, // Black when active
        tabBarInactiveTintColor: COLORS.textSecondary, // Gray when inactive
        tabBarShowLabel: false, // Hide labels for cleaner look
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="🏠" />,
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="🔍" />,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="🔔" />,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
            color: COLORS.white,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon="✉️" />,
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Main Stack - Tabs + Profile + Create Tweet
 */
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.white }, // White background
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="CreateTweet" 
        component={CreateTweetScreen}
        options={{
          presentation: 'modal', // Modal presentation for create tweet
        }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="TweetDetail" component={TweetDetailScreen} />
    </Stack.Navigator>
  );
};

/**
 * App Navigator - Switches between Auth and Main based on user
 */
const AppNavigator = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    // TODO: Add a proper splash screen
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
});

export default AppNavigator;
