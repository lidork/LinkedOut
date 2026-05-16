import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import { connectSocket, getSocket } from "../api/socket";
import Avatar from "../components/Avatar";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

export default function ChatScreen({ route, navigation }) {
  const { partner } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  /**
   * Fetches message history then subscribes to socket "new_message" events.
   * Uses a `mounted` flag to drop state updates after unmount, and deduplicates
   * incoming socket messages because the server echoes sent messages back to
   * the sender as well as delivering them to the recipient.
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const data = await apiFetch(`/api/messages?with=${partner._id}`);
        if (mounted) setMessages(data.messages);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }

      const socket = await connectSocket();
      if (!mounted) return;

      socket.on("new_message", (msg) => {
        const fromId = msg.from?._id ?? msg.from;
        const toId   = msg.to?._id   ?? msg.to;
        // Only add messages that belong to this conversation
        const belongs =
          (fromId === partner._id && toId === user._id) ||
          (fromId === user._id   && toId === partner._id);
        if (belongs) {
          setMessages((prev) => {
            // Deduplicate — socket echoes back to sender too
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      });
    };

    init();
    return () => {
      mounted = false;
      getSocket()?.off("new_message");
    };
  }, [partner._id, user._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      const socket = await connectSocket();
      socket.emit("send_message", { to: partner._id, content: trimmed });
    } catch (err) {
      setError(err.message);
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  }, [text, sending, partner._id]);

  const renderAvatar = (author) => <Avatar person={author} size={30} />;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerPerson}>
          {renderAvatar(partner)}
          <Text style={styles.headerName}>{partner.displayName || partner.username}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Message list */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
        renderItem={({ item }) => {
          const fromId = item.from?._id ?? item.from;
          const isOwn = fromId === user._id;
          return (
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
              {!isOwn && renderAvatar(item.from)}
              <View style={[styles.bubbleBody, isOwn ? styles.bubbleBodyOwn : styles.bubbleBodyOther]}>
                <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{item.content}</Text>
                <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !text.trim()}>
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.sendText}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: SPACING.md,
      paddingTop: insets.top + HEADER_PADDING_BOTTOM,
      paddingBottom: HEADER_PADDING_BOTTOM,
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { marginBottom: 6 },
    backText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
    headerPerson: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
    headerName: { fontSize: 17, fontWeight: "700", color: colors.text },
    error: { color: "#b91c1c", margin: SPACING.md, fontSize: 13 },
    messageList: { padding: SPACING.md, paddingBottom: SPACING.md },
    empty: { textAlign: "center", color: colors.subtext, marginTop: 40, fontSize: 14 },
    bubble: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
    bubbleOwn: { flexDirection: "row-reverse" },
    bubbleOther: {},
    msgAvatar: { marginHorizontal: 6 },
    bubbleBody: { maxWidth: "72%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
    bubbleBodyOther: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
    bubbleBodyOwn: { backgroundColor: "#2563eb", borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 15, color: colors.text, lineHeight: 21 },
    bubbleTextOwn: { color: "#fff" },
    bubbleTime: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: "right" },
    bubbleTimeOwn: { color: "rgba(255,255,255,0.7)" },
    inputBar: {
      flexDirection: "row", alignItems: "flex-end",
      paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
      backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
      gap: SPACING.sm,
    },
    input: {
      flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 15, color: colors.text, maxHeight: 120,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: "#2563eb",
      justifyContent: "center", alignItems: "center",
    },
    sendText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 24 },
  });
}
