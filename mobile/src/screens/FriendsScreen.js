import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import BottomTabBar from "../components/BottomTabBar";
import Avatar from "../components/Avatar";
import ScreenHeader from "../components/ScreenHeader";
import Toast from "../components/Toast";
import openUrl from "../utils/openUrl";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";
import useToast from "../hooks/useToast";

export default function FriendsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiFetch(`/api/users/${user._id}/friends`),
        apiFetch(`/api/users/${user._id}/friend-requests`),
      ]);
      setFriends(friendsData.friends);
      setRequests(requestsData.friendRequests);
    } catch (err) {
      showToast(err.message);
    }
  }, [user._id]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]));

  const handleUnfriend = (friend) => {
    Alert.alert("Disconnect", `Remove ${friend.displayName || friend.username} from your connections?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect", style: "destructive", onPress: async () => {
          setActionLoading(friend._id);
          try {
            await apiFetch(`/api/users/${user._id}/friends/${friend._id}`, { method: "DELETE" });
            setFriends((prev) => prev.filter((f) => f._id !== friend._id));
          } catch (err) { showToast(err.message); }
          finally { setActionLoading(null); }
        },
      },
    ]);
  };

  const handleAccept = async (requester) => {
    setActionLoading(requester._id);
    try {
      await apiFetch(`/api/users/${requester._id}/friend-request/accept`, { method: "POST" });
      setRequests((prev) => prev.filter((r) => r._id !== requester._id));
      setFriends((prev) => [...prev, requester]);
    } catch (err) { showToast(err.message); }
    finally { setActionLoading(null); }
  };

  const handleDecline = async (requester) => {
    setActionLoading(requester._id);
    try {
      await apiFetch(`/api/users/${requester._id}/friend-request`, { method: "DELETE" });
      setRequests((prev) => prev.filter((r) => r._id !== requester._id));
    } catch (err) { showToast(err.message); }
    finally { setActionLoading(null); }
  };

  const renderAvatar = (person) => <Avatar person={person} size={42} openToWork={person.openToWork} />;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;

  const listData = [
    ...(requests.length > 0 ? [{ _type: "requestsHeader" }, ...requests.map((r) => ({ ...r, _type: "request" }))] : []),
    { _type: "friendsHeader", count: friends.length },
    ...friends.map((f) => ({ ...f, _type: "friend" })),
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Connections"
        right={
          <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate("PeopleSearch")}>
            <Text style={styles.searchBtnText}>⌕</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={listData}
        keyExtractor={(item, i) => item._id ? `${item._type}-${item._id}` : `${item._type}-${i}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No connections yet — tap ⌕ to find people.</Text>}
        renderItem={({ item }) => {
          if (item._type === "requestsHeader") {
            return <Text style={styles.sectionLabel}>Connection Requests</Text>;
          }
          if (item._type === "friendsHeader") {
            return (
              <Text style={styles.sectionLabel}>
                Your Connections{item.count > 0 ? ` (${item.count})` : ""}
              </Text>
            );
          }
          if (item._type === "request") {
            const busy = actionLoading === item._id;
            return (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  {renderAvatar(item)}
                  <View style={styles.cardInfo}>
                    <Text style={styles.displayName}>{item.displayName || item.username}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                    {item.jobTitle ? <Text style={styles.jobTitle}>{item.jobTitle}</Text> : null}
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)} disabled={busy}>
                    {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.acceptText}>Accept</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(item)} disabled={busy}>
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          // friend
          const busy = actionLoading === item._id;
          return (
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
              <TouchableOpacity style={styles.unfriendBtn} onPress={() => handleUnfriend(item)} disabled={busy}>
                {busy ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={styles.unfriendText}>Disconnect</Text>}
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <Toast message={toast} />
      <BottomTabBar active="Friends" navigation={navigation} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    searchBtn: { paddingHorizontal: 10, paddingVertical: 7 },
    searchBtnText: { fontSize: 22, color: "#2563eb" },
    list: { padding: SPACING.md, paddingBottom: 32 },
    empty: { textAlign: "center", color: colors.subtext, marginTop: 40, fontSize: 14 },
    sectionLabel: {
      fontSize: 12, fontWeight: "600", color: colors.subtext,
      textTransform: "uppercase", letterSpacing: 0.8,
      marginBottom: SPACING.sm, marginTop: SPACING.sm,
    },
    card: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: colors.card, borderRadius: 12, padding: HEADER_PADDING_BOTTOM,
      marginBottom: 10, elevation: 1,
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
    requestActions: { flexDirection: "row", gap: 8 },
    acceptBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, minWidth: 64, alignItems: "center" },
    acceptText: { color: "#fff", fontWeight: "600", fontSize: 13 },
    declineBtn: { borderWidth: 1.5, borderColor: "#dc2626", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    declineText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
    unfriendBtn: { borderWidth: 1.5, borderColor: "#dc2626", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    unfriendText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  });
}
