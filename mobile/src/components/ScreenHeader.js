import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";
import LinkedOutLogo from "./LinkedOutLogo";

/**
 * App-wide screen header with two layouts:
 * - Column (stack screens): back button above title. Pass `onBack` to activate.
 * - Row (tab screens): LinkedOut logo on left, optional right actions. Default when no `onBack`.
 *
 * @param {string} title - used only in stack (back-button) layout
 * @param {() => void} [onBack] - enables column layout with a "← Back" button
 * @param {React.ReactNode} [right] - right-side action(s) for row layout
 */
export default function ScreenHeader({ title, onBack, right }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <LinkedOutLogo size={20} />
        )}
        <View style={styles.center}>
          {onBack ? <Text style={styles.title}>{title}</Text> : null}
        </View>
        <View style={styles.rightSlot}>
          {right || null}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: SPACING.md,
      paddingTop: insets.top,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      height: 48,
    },
    center: { flex: 1, alignItems: "center" },
    title: { fontSize: 16, fontWeight: "700", color: colors.text },
    backBtn: { minWidth: 70 },
    backText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
    rightSlot: { minWidth: 70, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: SPACING.sm },
  });
}
