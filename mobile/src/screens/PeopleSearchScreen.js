import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import Avatar from "../components/Avatar";
import ScreenHeader from "../components/ScreenHeader";
import useSearch from "../hooks/useSearch";
import openUrl from "../utils/openUrl";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

function enrichUsers(usersData, friendsData, currentUserId) {
  const friendIds = new Set(friendsData.friends.map((f) => f._id));
  return usersData.users
    .filter((u) => u._id !== currentUserId)
    .map((u) => ({ ...u, _isFriend: friendIds.has(u._id) }));
}

export default function PeopleSearchScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = makeStyles(colors);

  // Tracks IDs we've sent requests to this session (optimistic)
  const [sentIds, setSentIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null);

  const { results, query, onChangeQuery, onSubmit: handleSearch, loading, error } = useSearch({
    load: async () => {
      const [data, friendsData] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch(`/api/users/${user._id}/friends`),
      ]);
      return enrichUsers(data, friendsData, user._id);
    },
    filter: (items, text) => {
      if (!text.trim()) return items;
      const raw = text.trim();
      const q = (raw.startsWith("@") ? raw.slice(1) : raw).toLowerCase();
      return items.filter((u) =>
        u.username.toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.jobTitle || "").toLowerCase().includes(q)
      );
    },
    // Full server search on explicit submit (catches new users added after mount)
    onSubmit: async (q) => {
      if (!q.trim()) return [];
      const [data, friendsData] = await Promise.all([
        apiFetch(`/api/users?search=${encodeURIComponent(q.trim())}`),
        apiFetch(`/api/users/${user._id}/friends`),
      ]);
      return enrichUsers(data, friendsData, user._id);
    },
  });

  // Treats both "request already sent" and "already friends" as success — optimistically
  // marks the button as Sent so the user gets immediate feedback regardless of server error.
  const handleSendRequest = async (targetId) => {
    setActionLoading(targetId);
    try {
      await apiFetch(`/api/users/${targetId}/friend-request`, { method: "POST" });
      setSentIds((prev) => new Set([...prev, targetId]));
    } catch (err) {
      // "Request already sent" or "Already friends" — reflect it silently
      setSentIds((prev) => new Set([...prev, targetId]));
    } finally {
      setActionLoading(null);
    }
  };

  const renderAvatar = (item) => <Avatar person={item} size={42} />;

  const renderAction = (item) => {
    if (item._isFriend) {
      return (
        <View style={styles.friendsBadge}>
          <Text style={styles.friendsBadgeText}>Connected</Text>
        </View>
      );
    }
    if (sentIds.has(item._id)) {
      return (
        <View style={styles.sentBadge}>
          <Text style={styles.sentBadgeText}>Sent</Text>
        </View>
      );
    }
    const busy = actionLoading === item._id;
    return (
      <TouchableOpacity style={styles.addBtn} onPress={() => handleSendRequest(item._id)} disabled={busy}>
        {busy
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.addBtnText}>Add</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Find People" onBack={() => navigation.goBack()} />

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Search by name or username…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={onChangeQuery}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.resultCount}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading
            ? <Text style={styles.empty}>{query.trim() ? `No users found for "${query}"` : "No users found."}</Text>
            : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              {renderAvatar(item)}
              <View style={styles.cardInfo}>
                <Text style={styles.displayName}>{item.displayName || item.username}</Text>
                <Text style={styles.username}>@{item.username}</Text>
                {item.jobTitle ? (
                  item.portfolioUrl ? (
                    <TouchableOpacity style={styles.jobTitleRow} onPress={() => openUrl(item.portfolioUrl)}>
                      <Text style={styles.jobTitleLink}>{item.jobTitle}</Text>
                      <Text style={styles.portfolioIcon}>🔗</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                  )
                ) : null}
                {item.openToWork ? (
                  <View style={styles.openBadge}><Text style={styles.openBadgeText}>Open to Work</Text></View>
                ) : null}
              </View>
            </View>
            {renderAction(item)}
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    form: { padding: SPACING.md },
    input: {
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.text,
    },
    error: { color: "#b91c1c", fontSize: 13, marginTop: 10 },
    resultCount: { fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 4 },
    empty: { textAlign: "center", color: colors.muted, fontSize: 14, paddingHorizontal: SPACING.md },
    list: { paddingBottom: 32 },
    card: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.card, borderRadius: 12, padding: HEADER_PADDING_BOTTOM,
      marginHorizontal: SPACING.md, marginBottom: 10, elevation: 1,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    cardLeft: { flexDirection: "row", alignItems: "center", gap: HEADER_PADDING_BOTTOM, flex: 1 },
    cardInfo: { flex: 1 },
    displayName: { fontSize: 15, fontWeight: "600", color: colors.text },
    username: { fontSize: 12, color: colors.subtext },
    jobTitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
    jobTitleLink: { fontSize: 12, color: "#2563eb" },
    portfolioIcon: { fontSize: 12 },
    jobTitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
    openBadge: { alignSelf: "flex-start", backgroundColor: "#dcfce7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
    openBadgeText: { color: "#16a34a", fontSize: 11, fontWeight: "600" },
    addBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, minWidth: 56, alignItems: "center" },
    addBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
    sentBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
    sentBadgeText: { color: "#64748b", fontWeight: "600", fontSize: 13 },
    friendsBadge: { backgroundColor: "#eff6ff", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
    friendsBadgeText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  });
}
