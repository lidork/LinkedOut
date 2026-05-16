import React from "react";
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import BottomTabBar from "../components/BottomTabBar";
import ScreenHeader from "../components/ScreenHeader";
import { SPACING } from "../constants/layout";

export default function SettingsScreen({ navigation }) {
  const { isDark, colors, toggle } = useTheme();
  const { logout } = useAuth();
  const styles = makeStyles(colors);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Settings" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Dark mode</Text>
              <Text style={styles.sub}>Switch to a dark color theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: "#2563eb" }}
              thumbColor="#fff"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar active="Settings" navigation={navigation} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: SPACING.md, paddingBottom: 40 },
    section: {
      backgroundColor: colors.card, borderRadius: 12, marginBottom: SPACING.md,
      overflow: "hidden", borderWidth: 1, borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 12, fontWeight: "600", color: colors.subtext,
      textTransform: "uppercase", letterSpacing: 0.8,
      paddingHorizontal: SPACING.md, paddingTop: 14, paddingBottom: 6,
    },
    row: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: SPACING.md, paddingVertical: 14,
      borderTopWidth: 1, borderTopColor: colors.border2,
    },
    label: { fontSize: 15, color: colors.text, fontWeight: "500" },
    sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    logoutBtn: {
      backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 15, alignItems: "center", marginTop: SPACING.sm,
    },
    logoutText: { fontSize: 15, fontWeight: "600", color: "#b91c1c" },
  });
}
