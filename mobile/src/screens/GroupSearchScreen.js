import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Switch,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import ScreenHeader from "../components/ScreenHeader";
import GroupCard from "../components/GroupCard";
import Toast from "../components/Toast";
import useSearch from "../hooks/useSearch";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";
import useToast from "../hooks/useToast";

export default function GroupSearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = makeStyles(colors);

  const [nameQ, setNameQ] = useState("");
  const [privateOnly, setPrivateOnly] = useState(false);
  const [minMembers, setMinMembers] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [searched, setSearched] = useState(false);
  const [joining, setJoining] = useState(null);
  const { toast, showToast } = useToast();

  const { results, onSubmit: _submitSearch, loading, error } = useSearch({
    load: () => apiFetch("/api/groups").then((d) => d.groups),
    onSubmit: () => {
      const params = new URLSearchParams();
      if (nameQ.trim()) params.set("search", nameQ.trim());
      if (privateOnly) params.set("isPrivate", "true");
      if (minMembers.trim()) params.set("minMembers", minMembers.trim());
      if (maxMembers.trim()) params.set("maxMembers", maxMembers.trim());
      return apiFetch(`/api/groups?${params.toString()}`).then((d) => d.groups);
    },
  });

  const handleSearch = async () => {
    setSearched(false);
    await _submitSearch();
    setSearched(true);
  };

  const handleJoin = async (group) => {
    setJoining(group._id);
    try {
      await apiFetch(`/api/groups/${group._id}/join`, { method: "POST" });
      await _submitSearch();
    } catch (err) {
      if (err.message?.toLowerCase().includes("not allowed") || err.message?.toLowerCase().includes("banned")) {
        showToast("You are banned from this group");
      }
    } finally {
      setJoining(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Search Groups" onBack={() => navigation.goBack()} />

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.label}>Group name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Photography Club"
              placeholderTextColor={colors.muted}
              value={nameQ}
              onChangeText={setNameQ}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.label}>Private groups only</Text>
              <Switch
                value={privateOnly}
                onValueChange={setPrivateOnly}
                trackColor={{ false: colors.border, true: "#2563eb" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <Text style={styles.label}>Min members</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={minMembers}
                  onChangeText={setMinMembers}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.rangeField}>
                <Text style={styles.label}>Max members</Text>
                <TextInput
                  style={styles.input}
                  placeholder="∞"
                  placeholderTextColor={colors.muted}
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={handleSearch} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Search</Text>}
            </TouchableOpacity>

            {searched && (
              <Text style={styles.resultCount}>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading
            ? <Text style={styles.empty}>{searched ? "No groups match your filters." : "No groups found."}</Text>
            : null
        }
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            userId={user._id}
            onPress={() => navigation.navigate("GroupDetail", { groupId: item._id })}
            onJoin={handleJoin}
            joining={joining}
          />
        )}
      />

      <Toast message={toast} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    form: { padding: SPACING.md },
    label: { fontSize: 12, fontWeight: "600", color: colors.subtext, marginBottom: 6, marginTop: HEADER_PADDING_BOTTOM },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.text,
    },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: HEADER_PADDING_BOTTOM },
    rangeRow: { flexDirection: "row", gap: HEADER_PADDING_BOTTOM },
    rangeField: { flex: 1 },
    error: { color: "#b91c1c", fontSize: 13, marginTop: 10 },
    btn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 20 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    resultCount: { fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 4 },
    empty: { textAlign: "center", color: colors.muted, marginTop: SPACING.sm, fontSize: 14, paddingHorizontal: SPACING.md },
  });
}
