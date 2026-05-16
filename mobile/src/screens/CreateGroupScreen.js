import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Switch, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

export default function CreateGroupScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) { setError("Group name is required."); return; }
    setLoading(true);
    try {
      await apiFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim(), isPrivate }),
      });
      if (route.params?.onCreated) route.params.onCreated();
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Group</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Group name *</Text>
      <TextInput style={styles.input} placeholder="e.g. Photography Club" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="What's this group about?" placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Private group</Text>
          <Text style={styles.switchHint}>Members must be approved before joining</Text>
        </View>
        <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ false: colors.border, true: "#2563eb" }} thumbColor="#fff" />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Group</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: SPACING.md, paddingTop: insets.top + HEADER_PADDING_BOTTOM, paddingBottom: 40 },
    backBtn: { marginBottom: SPACING.sm },
    backText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
    title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: SPACING.lg },
    error: { color: "#b91c1c", marginBottom: HEADER_PADDING_BOTTOM, fontSize: 13 },
    label: { fontSize: 13, color: colors.text2, fontWeight: "600", marginBottom: 6, marginTop: SPACING.md },
    input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: HEADER_PADDING_BOTTOM, fontSize: 15, color: colors.text },
    multiline: { height: 90 },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 20, borderWidth: 1, borderColor: colors.border },
    switchLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    switchHint: { fontSize: 12, color: colors.subtext, marginTop: 2 },
    btn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 32 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });
}
