import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { SPACING } from "../constants/layout";

/**
 * Shared group card used in GroupsScreen and GroupSearchScreen.
 * @param {{ _id, name, description, isPrivate, members, pendingMembers, admin }} group
 * @param {string} userId - current user's ID
 * @param {() => void} onPress - navigate to GroupDetail
 * @param {(group: object) => void} [onJoin] - join/request handler; omit to hide button
 * @param {string|null} [joining] - group._id currently being joined (shows spinner)
 */
export default function GroupCard({ group, userId, onPress, onJoin, joining }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const isAdmin = (group.admin?._id || group.admin) === userId;
  const member = group.members?.some((m) => (m._id || m) === userId);
  const pending = group.pendingMembers?.some((m) => (m._id || m) === userId);
  const memberCount = group.members?.length ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.groupName}>{group.name}</Text>
        <View style={[styles.badge, group.isPrivate ? styles.badgePrivate : styles.badgePublic]}>
          <Text style={styles.badgeText}>{group.isPrivate ? "Private" : "Public"}</Text>
        </View>
      </View>

      {group.description ? (
        <Text style={styles.description} numberOfLines={2}>{group.description}</Text>
      ) : null}

      <View style={styles.cardBottom}>
        <Text style={styles.memberCount}>
          {memberCount} member{memberCount !== 1 ? "s" : ""}
        </Text>
        {isAdmin ? (
          <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin</Text></View>
        ) : member ? (
          <View style={styles.joinedBadge}><Text style={styles.joinedText}>Joined</Text></View>
        ) : pending ? (
          <View style={styles.pendingBadge}><Text style={styles.pendingText}>Pending</Text></View>
        ) : onJoin ? (
          <TouchableOpacity style={styles.joinBtn} onPress={() => onJoin(group)} disabled={joining === group._id}>
            {joining === group._id
              ? <ActivityIndicator size="small" color="#2563eb" />
              : <Text style={styles.joinBtnText}>{group.isPrivate ? "Request" : "Join"}</Text>}
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card, borderRadius: 12, padding: 14,
      marginBottom: 10, elevation: 1,
      shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    groupName: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1, marginRight: SPACING.sm },
    badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
    badgePublic: { backgroundColor: "#f1f5f9" },
    badgePrivate: { backgroundColor: "#fee2e2" },
    badgeText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
    description: { fontSize: 13, color: colors.subtext, marginBottom: 10 },
    cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: SPACING.sm },
    memberCount: { fontSize: 12, color: colors.muted },
    joinBtn: { borderWidth: 1.5, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
    joinBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
    joinedBadge: { backgroundColor: "#eff6ff", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
    joinedText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
    pendingBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
    pendingText: { color: "#64748b", fontWeight: "600", fontSize: 13 },
    adminBadge: { backgroundColor: "#ede9fe", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
    adminBadgeText: { color: "#7c3aed", fontWeight: "600", fontSize: 13 },
  });
}
