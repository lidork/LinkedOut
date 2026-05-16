import React from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import Avatar from "../components/Avatar";
import ScreenHeader from "../components/ScreenHeader";
import useSearch from "../hooks/useSearch";
import { SPACING } from "../constants/layout";

export default function NewChatScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { results: filtered, query, onChangeQuery, loading, error } = useSearch({
    load: () => apiFetch(`/api/users/${user._id}/friends`).then((d) => d.friends),
    filter: (items, text) => {
      if (!text.trim()) return items;
      const q = text.trim().toLowerCase();
      return items.filter((f) =>
        f.username.toLowerCase().includes(q) ||
        (f.displayName || "").toLowerCase().includes(q)
      );
    },
  });

  const renderAvatar = (f) => <Avatar person={f} size={44} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="New Message" onBack={() => navigation.goBack()} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Search connections…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={onChangeQuery}
              autoCapitalize="none"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" /> :
          !query.trim()
            ? <Text style={styles.empty}>{"Add some connections first."}</Text>
            : <Text style={styles.empty}>No connections match "{query}".</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => {
              navigation.goBack();
              navigation.navigate("ChatConversation", { partner: item });
            }}
          >
            {renderAvatar(item)}
            <View style={styles.cardBody}>
              <Text style={styles.name}>{item.displayName || item.username}</Text>
              <Text style={styles.handle}>@{item.username}</Text>
            </View>
            <View style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>Chat</Text>
            </View>
          </TouchableOpacity>
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
    list: { paddingBottom: 32 },
    empty: { textAlign: "center", color: colors.subtext, marginTop: 40, fontSize: 14, paddingHorizontal: SPACING.md },
    card: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.card, borderRadius: 12, padding: 14,
      marginHorizontal: SPACING.md, marginBottom: 10, elevation: 1,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    cardBody: { flex: 1 },
    name: { fontSize: 15, fontWeight: "700", color: colors.text },
    handle: { fontSize: 12, color: colors.subtext, marginTop: 2 },
    chatBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
    chatBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  });
}
