import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import { connectSocket } from "../api/socket";
import BottomTabBar from "../components/BottomTabBar";
import Avatar from "../components/Avatar";
import ScreenHeader from "../components/ScreenHeader";
import { SPACING } from "../constants/layout";

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch("/api/messages/conversations");
      setConversations(data.conversations);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    // Connect socket when entering chat area so new_message events refresh the list
    connectSocket().catch(() => {});
    load().finally(() => setLoading(false));
  }, [load]));

  const renderAvatar = (partner) => <Avatar person={partner} size={48} />;

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Messages" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.partner?._id ?? Math.random().toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet.{"\n"}Start one from your friends list.</Text>}
        renderItem={({ item }) => {
          const { partner, lastMessage } = item;
          const isOwn = lastMessage?.from?._id === user._id || lastMessage?.from === user._id;
          const preview = `${isOwn ? "You: " : ""}${lastMessage?.content ?? ""}`;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ChatConversation", { partner })}
              activeOpacity={0.85}
            >
              {renderAvatar(partner)}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{partner?.displayName || partner?.username}</Text>
                  {lastMessage?.createdAt
                    ? <Text style={styles.time}>{formatTime(lastMessage.createdAt)}</Text>
                    : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* New conversation FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("NewChat")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <BottomTabBar active="Chat" navigation={navigation} />
    </View>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    error: { color: "#b91c1c", margin: SPACING.md, fontSize: 13 },
    list: { padding: SPACING.md, paddingBottom: 32 },
    empty: { textAlign: "center", color: colors.subtext, marginTop: 40, fontSize: 14, lineHeight: 22 },
    card: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.card, borderRadius: 12, padding: 14,
      marginBottom: 10, elevation: 1,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    cardBody: { flex: 1 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    name: { fontSize: 15, fontWeight: "700", color: colors.text },
    time: { fontSize: 12, color: colors.muted },
    preview: { fontSize: 13, color: colors.subtext },
    fab: {
      position: "absolute", right: SPACING.md, bottom: 80 + insets.bottom,
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center",
      elevation: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    },
    fabText: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  });
}
