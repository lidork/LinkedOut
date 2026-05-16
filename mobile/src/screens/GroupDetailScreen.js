import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import Avatar from "../components/Avatar";
import Toast from "../components/Toast";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";
import useToast from "../hooks/useToast";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [groupData, postsData] = await Promise.all([
        apiFetch(`/api/groups/${groupId}`),
        apiFetch(`/api/posts?group=${groupId}`),
      ]);
      setGroup(groupData.group);
      setPosts(postsData.posts ?? []);
    } catch (err) { setError(err.message); }
  }, [groupId]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  // Disable hardware back button — use the ← Back button instead
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const openEdit = () => { setEditName(group.name); setEditDesc(group.description || ""); setEditPrivate(group.isPrivate); setEditing(true); };

  const handleSave = async () => {
    if (!editName.trim()) { setError("Group name cannot be empty."); return; }
    setSaving(true); setError("");
    try {
      await apiFetch(`/api/groups/${groupId}`, { method: "PUT", body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), isPrivate: editPrivate }) });
      await loadData(); setEditing(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert("Delete Group", `Delete "${group.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await apiFetch(`/api/groups/${groupId}`, { method: "DELETE" }); navigation.goBack(); } catch (err) { setError(err.message); } } },
    ]);
  };

  const handleJoin = async () => {
    setActionLoading("join");
    try { await apiFetch(`/api/groups/${groupId}/join`, { method: "POST" }); await loadData(); }
    catch (err) {
      if (err.message?.toLowerCase().includes("not allowed") || err.message?.toLowerCase().includes("banned")) {
        showToast("You are banned from this group");
      } else {
        setError(err.message);
      }
    } finally { setActionLoading(null); }
  };

  const handleCancelRequest = async () => {
    setActionLoading("cancel");
    try { await apiFetch(`/api/groups/${groupId}/members/${user._id}`, { method: "DELETE" }); await loadData(); }
    catch (err) { setError(err.message); } finally { setActionLoading(null); }
  };

  const handleLeave = () => {
    Alert.alert("Leave Group", `Leave "${group.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => {
        setActionLoading("leave");
        try { await apiFetch(`/api/groups/${groupId}/members/${user._id}`, { method: "DELETE" }); navigation.goBack(); }
        catch (err) { setError(err.message); setActionLoading(null); }
      }},
    ]);
  };

  const handleApprove = async (memberId) => {
    setActionLoading(memberId + "_approve");
    try { await apiFetch(`/api/groups/${groupId}/members/${memberId}/approve`, { method: "PUT" }); await loadData(); }
    catch (err) { setError(err.message); } finally { setActionLoading(null); }
  };

  const handleReject = async (memberId) => {
    setActionLoading(memberId + "_reject");
    try { await apiFetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" }); await loadData(); }
    catch (err) { setError(err.message); } finally { setActionLoading(null); }
  };

  const handleKick = (member) => {
    Alert.alert("Kick Member", `Remove ${member.displayName || member.username} from this group?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Kick", style: "destructive", onPress: async () => {
        setActionLoading(member._id + "_kick");
        try { await apiFetch(`/api/groups/${groupId}/members/${member._id}`, { method: "DELETE" }); await loadData(); }
        catch (err) { setError(err.message); } finally { setActionLoading(null); }
      }},
    ]);
  };

  const handleBlock = (member) => {
    Alert.alert("Block Member", `Block ${member.displayName || member.username}? They won't be able to join this group again.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => {
        setActionLoading(member._id + "_block");
        try { await apiFetch(`/api/groups/${groupId}/members/${member._id}/block`, { method: "POST" }); await loadData(); }
        catch (err) { setError(err.message); } finally { setActionLoading(null); }
      }},
    ]);
  };

  const handleUnblock = (member) => {
    Alert.alert("Unblock", `Unblock ${member.displayName || member.username}? They can request to join again.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unblock", onPress: async () => {
        setActionLoading(member._id + "_unblock");
        try { await apiFetch(`/api/groups/${groupId}/members/${member._id}/block`, { method: "DELETE" }); await loadData(); }
        catch (err) { setError(err.message); } finally { setActionLoading(null); }
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;
  if (!group) return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.errorFull}>{error || "Group not found."}</Text>
    </View>
  );

  const isAdmin = (group.admin?._id || group.admin) === user._id;
  const isMember = group.members?.some((m) => (m._id || m) === user._id);
  const isPending = !isMember && !isAdmin && group.pendingMembers?.some((m) => (m._id || m) === user._id);
  // Restrict posts for any private group non-member (pending or stranger)
  const postsRestricted = group.isPrivate && !isAdmin && !isMember;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.screen}
        data={postsRestricted ? [] : posts}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={2}>{group.name}</Text>
                <View style={[styles.badge, group.isPrivate ? styles.badgePrivate : styles.badgePublic]}>
                  <Text style={styles.badgeText}>{group.isPrivate ? "Private" : "Public"}</Text>
                </View>
              </View>
              {group.description ? <Text style={styles.desc}>{group.description}</Text> : null}
              <Text style={styles.meta}>{group.members?.length ?? 0} member{group.members?.length !== 1 ? "s" : ""}{" · "}Admin: {group.admin?.username ?? "—"}</Text>

              {!isAdmin && !isMember && !isPending && (
                <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={actionLoading === "join"}>
                  {actionLoading === "join"
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.joinBtnText}>{group.isPrivate ? "Request to Join" : "Join Group"}</Text>}
                </TouchableOpacity>
              )}
              {isPending && (
                <TouchableOpacity style={styles.pendingBtn} onPress={handleCancelRequest} disabled={actionLoading === "cancel"}>
                  {actionLoading === "cancel"
                    ? <ActivityIndicator size="small" color="#64748b" />
                    : <Text style={styles.pendingBtnText}>Pending · Tap to Cancel</Text>}
                </TouchableOpacity>
              )}
              {isMember && !isAdmin && (
                <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} disabled={actionLoading === "leave"}>
                  {actionLoading === "leave"
                    ? <ActivityIndicator size="small" color="#dc2626" />
                    : <Text style={styles.leaveBtnText}>Leave Group</Text>}
                </TouchableOpacity>
              )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Members list — always visible */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Members</Text>
              {(group.members ?? []).map((m) => {
                const memberIsAdmin = m._id === (group.admin?._id || group.admin);
                return (
                  <View key={m._id} style={styles.memberRow}>
                    <Avatar person={m} size={34} />
                    <Text style={styles.memberName}>{m.displayName || m.username}</Text>
                    {memberIsAdmin
                      ? <View style={styles.adminTag}><Text style={styles.adminTagText}>Admin</Text></View>
                      : isAdmin && (
                        <View style={styles.memberActions}>
                          <TouchableOpacity style={styles.kickBtn} onPress={() => handleKick(m)} disabled={!!actionLoading}>
                            {actionLoading === m._id + "_kick" ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={styles.kickBtnText}>Kick</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.blockBtn} onPress={() => handleBlock(m)} disabled={!!actionLoading}>
                            {actionLoading === m._id + "_block" ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={styles.blockBtnText}>Block</Text>}
                          </TouchableOpacity>
                        </View>
                      )
                    }
                  </View>
                );
              })}
            </View>

            {isAdmin && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Panel</Text>
                {group.pendingMembers?.length > 0 ? (
                  <View style={styles.pendingBox}>
                    <Text style={styles.pendingTitle}>Pending Requests ({group.pendingMembers.length})</Text>
                    {group.pendingMembers.map((m) => (
                      <View key={m._id} style={styles.pendingRow}>
                        <Avatar person={m} size={34} />
                        <Text style={styles.memberName}>{m.displayName || m.username}</Text>
                        <View style={styles.pendingActions}>
                          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(m._id)} disabled={!!actionLoading}>
                            {actionLoading === m._id + "_approve" ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.approveBtnText}>Approve</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(m._id)} disabled={!!actionLoading}>
                            {actionLoading === m._id + "_reject" ? <ActivityIndicator size="small" color="#b91c1c" /> : <Text style={styles.rejectBtnText}>Reject</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noPending}>No pending requests</Text>
                )}

                {group.blockedMembers?.length > 0 && (
                  <View style={styles.blockedBox}>
                    <Text style={styles.blockedTitle}>Blocked ({group.blockedMembers.length})</Text>
                    {group.blockedMembers.map((m) => (
                      <View key={m._id} style={styles.pendingRow}>
                        <Avatar person={m} size={34} />
                        <Text style={styles.memberName}>{m.displayName || m.username}</Text>
                        <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(m)} disabled={!!actionLoading}>
                          {actionLoading === m._id + "_unblock" ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.unblockBtnText}>Unblock</Text>}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {editing ? (
                  <View style={styles.editBox}>
                    <Text style={styles.editLabel}>Group Name</Text>
                    <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Group name" placeholderTextColor={colors.muted} />
                    <Text style={styles.editLabel}>Description</Text>
                    <TextInput style={[styles.input, styles.inputMulti]} value={editDesc} onChangeText={setEditDesc} placeholder="Description (optional)" placeholderTextColor={colors.muted} multiline />
                    <TouchableOpacity style={[styles.privacyToggle, editPrivate && styles.privacyToggleOn]} onPress={() => setEditPrivate((p) => !p)}>
                      <Text style={[styles.privacyToggleText, editPrivate && styles.privacyToggleTextOn]}>{editPrivate ? "Private" : "Public"}</Text>
                    </TouchableOpacity>
                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)} disabled={saving}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.editGroupBtn} onPress={openEdit}>
                    <Text style={styles.editGroupBtnText}>Edit Group</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>Delete Group</Text>
                </TouchableOpacity>
              </View>
            )}

            {postsRestricted ? (
              <View style={styles.section}>
                <Text style={styles.restrictedMsg}>
                  {isPending
                    ? "Your request is pending. You'll see posts once approved."
                    : "You need approval to see posts in this group."}
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts ({posts.length})</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={postsRestricted ? null : <Text style={styles.empty}>No posts in this group yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}><Text style={styles.avatarText}>{(item.author?.username || "?")[0].toUpperCase()}</Text></View>
              <View>
                <Text style={styles.postAuthor}>{item.author?.displayName || item.author?.username}</Text>
                <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.postContent}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Toast message={toast} />
    </View>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    listContent: { paddingBottom: 40 },
    header: {
      paddingHorizontal: SPACING.md,
      paddingTop: insets.top + HEADER_PADDING_BOTTOM,
      paddingBottom: HEADER_PADDING_BOTTOM,
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { marginBottom: SPACING.sm },
    backText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
    titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: SPACING.sm },
    title: { fontSize: 20, fontWeight: "700", color: colors.text, flex: 1 },
    badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
    badgePublic: { backgroundColor: "#f1f5f9" },
    badgePrivate: { backgroundColor: "#fee2e2" },
    badgeText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
    desc: { fontSize: 14, color: colors.subtext, marginBottom: 6 },
    meta: { fontSize: 12, color: colors.muted },
    error: { color: "#b91c1c", marginHorizontal: SPACING.md, marginTop: SPACING.sm, fontSize: 13 },
    errorFull: { color: "#b91c1c", margin: SPACING.lg, fontSize: 14, textAlign: "center" },
    section: { marginHorizontal: SPACING.md, marginTop: 20 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 10 },
    restrictedMsg: { fontSize: 14, color: colors.muted, fontStyle: "italic", textAlign: "center", paddingVertical: SPACING.md },
    memberRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm, gap: 10 },
    memberActions: { flexDirection: "row", gap: SPACING.sm },
    pendingRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
    postAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
    avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    memberName: { fontSize: 14, color: colors.text2, flex: 1 },
    adminTag: { backgroundColor: "#ede9fe", borderRadius: 6, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
    adminTagText: { color: "#7c3aed", fontSize: 11, fontWeight: "600" },
    kickBtn: { borderWidth: 1.5, borderColor: "#dc2626", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    kickBtnText: { color: "#dc2626", fontWeight: "600", fontSize: 12 },
    blockBtn: { backgroundColor: "#fee2e2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    blockBtnText: { color: "#dc2626", fontWeight: "600", fontSize: 12 },
    pendingBox: { backgroundColor: "#fffbeb", borderRadius: 10, padding: HEADER_PADDING_BOTTOM, marginBottom: HEADER_PADDING_BOTTOM, borderWidth: 1, borderColor: "#fde68a" },
    pendingTitle: { fontSize: 13, fontWeight: "600", color: "#92400e", marginBottom: SPACING.sm },
    blockedBox: { backgroundColor: "#fef2f2", borderRadius: 10, padding: HEADER_PADDING_BOTTOM, marginBottom: HEADER_PADDING_BOTTOM, borderWidth: 1, borderColor: "#fecaca" },
    blockedTitle: { fontSize: 13, fontWeight: "600", color: "#991b1b", marginBottom: SPACING.sm },
    unblockBtn: { borderWidth: 1.5, borderColor: "#2563eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    unblockBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 12 },
    noPending: { fontSize: 13, color: colors.muted, marginBottom: HEADER_PADDING_BOTTOM },
    pendingActions: { flexDirection: "row", gap: SPACING.sm },
    approveBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: HEADER_PADDING_BOTTOM, paddingVertical: 5, minWidth: 72, alignItems: "center" },
    approveBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
    rejectBtn: { borderWidth: 1.5, borderColor: "#dc2626", borderRadius: 10, paddingHorizontal: HEADER_PADDING_BOTTOM, paddingVertical: 5, minWidth: 64, alignItems: "center" },
    rejectBtnText: { color: "#dc2626", fontWeight: "600", fontSize: 12 },
    editGroupBtn: { borderWidth: 1.5, borderColor: "#2563eb", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginBottom: 10 },
    editGroupBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 14 },
    deleteBtn: { backgroundColor: "#fee2e2", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    deleteBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
    editBox: { backgroundColor: colors.inputBg, borderRadius: 12, padding: HEADER_PADDING_BOTTOM, marginBottom: 10 },
    editLabel: { fontSize: 12, fontWeight: "600", color: colors.text2, marginBottom: 4, marginTop: SPACING.sm },
    input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: HEADER_PADDING_BOTTOM, paddingVertical: SPACING.sm, fontSize: 14, color: colors.text },
    inputMulti: { minHeight: 72, textAlignVertical: "top" },
    privacyToggle: { marginTop: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: SPACING.sm, alignItems: "center" },
    privacyToggleOn: { borderColor: "#7c3aed", backgroundColor: "#ede9fe" },
    privacyToggleText: { color: colors.subtext, fontWeight: "600", fontSize: 13 },
    privacyToggleTextOn: { color: "#7c3aed" },
    editActions: { flexDirection: "row", gap: 10, marginTop: HEADER_PADDING_BOTTOM },
    saveBtn: { flex: 1, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 9, alignItems: "center" },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
    cancelBtnText: { color: colors.subtext, fontWeight: "600", fontSize: 14 },
    postCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginHorizontal: SPACING.md, marginTop: 10, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    postHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm, gap: 10 },
    postAuthor: { fontSize: 13, fontWeight: "600", color: colors.text },
    postDate: { fontSize: 11, color: colors.muted },
    postContent: { fontSize: 14, color: colors.text2, lineHeight: 20 },
    empty: { textAlign: "center", color: colors.muted, marginTop: 20, fontSize: 13 },
    joinBtn: { marginTop: 12, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    pendingBtn: { marginTop: 12, backgroundColor: "#f1f5f9", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    pendingBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
    leaveBtn: { marginTop: 12, borderWidth: 1.5, borderColor: "#dc2626", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    leaveBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
  });
}
