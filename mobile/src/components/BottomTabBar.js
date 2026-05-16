import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const TABS = [
  { name: "Feed",     screen: "Feed",     icon: "home-outline",         iconActive: "home" },
  { name: "Connect",  screen: "Friends",  icon: "people-outline",       iconActive: "people" },
  { name: "Chat",     screen: "Chat",     icon: "chatbubble-outline",   iconActive: "chatbubble" },
  { name: "Groups",   screen: "Groups",   icon: "layers-outline",       iconActive: "layers" },
  { name: "Stats",    screen: "Stats",    icon: "bar-chart-outline",    iconActive: "bar-chart" },
  { name: "Profile",  screen: "Profile",  icon: "person-outline",       iconActive: "person" },
];

export default function BottomTabBar({ active, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = active === tab.screen;
        return (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tab}
            onPress={() => !isActive && navigation.navigate(tab.screen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={22}
              color={isActive ? "#2563eb" : colors.muted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
      // Respect Android nav bar; fall back to 10 on devices without one
      paddingBottom: Math.max(insets.bottom, 10),
    },
    tab: { flex: 1, alignItems: "center", gap: 3 },
    label: { fontSize: 10, color: colors.muted, fontWeight: "500" },
    labelActive: { color: "#2563eb", fontWeight: "700" },
  });
}
