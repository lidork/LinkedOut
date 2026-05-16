import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import PostCard from "../components/PostCard";
import ScreenHeader from "../components/ScreenHeader";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

export default function PostSearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = makeStyles(colors);

  const [authorQ, setAuthorQ] = useState("");
  const [groupQ, setGroupQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuPostId, setMenuPostId] = useState(null);

  // Resolves author/group text inputs to IDs before querying — the posts API filters by ID, not name
  const handleSearch = async () => {
    setError(""); setLoading(true); setSearched(false);
    try {
      const params = new URLSearchParams();
      if (authorQ.trim()) {
        const userData = await apiFetch(`/api/users?search=${encodeURIComponent(authorQ.trim())}`);
        const match = userData.users?.[0];
        if (!match) { setError(`No user found for "${authorQ.trim()}"`); setLoading(false); return; }
        params.set("author", match._id);
      }
      if (groupQ.trim()) {
        const groupData = await apiFetch(`/api/groups?search=${encodeURIComponent(groupQ.trim())}`);
        const match = groupData.groups?.[0];
        if (!match) { setError(`No group found for "${groupQ.trim()}"`); setLoading(false); return; }
        params.set("group", match._id);
      }
      if (from.trim()) params.set("from", from.trim());
      if (to.trim()) params.set("to", to.trim());
      if ([...params].length === 0) { setError("Enter at least one search filter."); setLoading(false); return; }
      const data = await apiFetch(`/api/posts?${params.toString()}`);
      setResults(data.posts);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Search Posts" onBack={() => navigation.goBack()} />

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.label}>Author username</Text>
            <TextInput style={styles.input} placeholder="e.g. johndoe" placeholderTextColor={colors.muted} value={authorQ} onChangeText={setAuthorQ} autoCapitalize="none" />

            <Text style={styles.label}>Group name</Text>
            <TextInput style={styles.input} placeholder="e.g. Photography Club" placeholderTextColor={colors.muted} value={groupQ} onChangeText={setGroupQ} />

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>From</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} value={from} onChangeText={setFrom} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>To</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} value={to} onChangeText={setTo} keyboardType="numbers-and-punctuation" />
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={handleSearch} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Search</Text>}
            </TouchableOpacity>

            {searched && <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? "s" : ""}</Text>}
          </View>
        }
        ListEmptyComponent={searched && !loading ? <Text style={styles.empty}>No posts match your filters.</Text> : null}
        renderItem={({ item }) => (
          <PostCard item={item} currentUserId={user._id} menuPostId={menuPostId} setMenuPostId={setMenuPostId} onEdit={() => {}} onDelete={() => {}} />
        )}
      />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    form: { padding: SPACING.md },
    label: { fontSize: 12, fontWeight: "600", color: colors.subtext, marginBottom: 6, marginTop: HEADER_PADDING_BOTTOM },
    input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.text },
    dateRow: { flexDirection: "row", gap: HEADER_PADDING_BOTTOM },
    dateField: { flex: 1 },
    error: { color: "#b91c1c", fontSize: 13, marginTop: 10 },
    btn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 20 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    resultCount: { fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 4 },
    empty: { textAlign: "center", color: colors.muted, marginTop: SPACING.sm, fontSize: 14, paddingHorizontal: SPACING.md },
  });
}
