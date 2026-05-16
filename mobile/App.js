import { enableScreens } from "react-native-screens";
enableScreens();

import React, { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import FeedScreen from "./src/screens/FeedScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import FriendsScreen from "./src/screens/FriendsScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import CreateGroupScreen from "./src/screens/CreateGroupScreen";
import GroupDetailScreen from "./src/screens/GroupDetailScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PostSearchScreen from "./src/screens/PostSearchScreen";
import GroupSearchScreen from "./src/screens/GroupSearchScreen";
import PeopleSearchScreen from "./src/screens/PeopleSearchScreen";
import ChatListScreen from "./src/screens/ChatListScreen";
import ChatScreen from "./src/screens/ChatScreen";
import NewChatScreen from "./src/screens/NewChatScreen";
import StatsScreen from "./src/screens/StatsScreen";
import AboutScreen from "./src/screens/AboutScreen";

const Stack = createNativeStackNavigator();

// Syncs user identity into ThemeContext so dark mode is keyed per user
function ThemeUserBridge() {
  const { user } = useAuth();
  const { reloadForUser } = useTheme();
  useEffect(() => { reloadForUser(user?._id ?? null); }, [user?._id]);
  return null;
}

function RootNavigator({ bgColor }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bgColor } }}>
      {user ? (
        <>
          <Stack.Screen name="Feed" component={FeedScreen} options={{ animation: "none" }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: "none" }} />
          <Stack.Screen name="Friends" component={FriendsScreen} options={{ animation: "none" }} />
          <Stack.Screen name="Groups" component={GroupsScreen} options={{ animation: "none" }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "none" }} />
          <Stack.Screen name="PostSearch" component={PostSearchScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="GroupSearch" component={GroupSearchScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="PeopleSearch" component={PeopleSearchScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Chat" component={ChatListScreen} options={{ animation: "none" }} />
          <Stack.Screen name="ChatConversation" component={ChatScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="NewChat" component={NewChatScreen} options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="Stats" component={StatsScreen} options={{ animation: "none" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function ThemedApp() {
  const { isDark, colors } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };
  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthProvider>
        <ThemeUserBridge />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
        <NavigationContainer theme={navTheme}>
          <RootNavigator bgColor={colors.bg} />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
