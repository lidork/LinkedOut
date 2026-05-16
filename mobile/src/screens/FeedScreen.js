import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import BottomTabBar from "../components/BottomTabBar";
import PostCard from "../components/PostCard";
import ScreenHeader from "../components/ScreenHeader";
import PostEditModal from "../components/PostEditModal";
import Toast from "../components/Toast";
import { SPACING } from "../constants/layout";
import useToast from "../hooks/useToast";
import useClap from "../hooks/useClap";

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { toast, showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [content, setContent] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadFeed = useCallback(async () => {
    try {
      const data = await apiFetch("/api/posts/feed");
      setPosts(data.posts);
    } catch (err) {
      showToast(err.message);
    }
  }, []);

  useEffect(() => { loadFeed().finally(() => setLoading(false)); }, [loadFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const openCompose = async () => {
    setEditingPost(null);
    setContent("");
    setSelectedGroup(null);
    setModalError("");
    try {
      const data = await apiFetch("/api/groups");
      // Only show groups the user has already joined — can't post to a group you're not in
      const joined = (data.groups || []).filter((g) =>
        g.members?.some((m) => (m._id || m) === user._id)
      );
      setMyGroups(joined);
    } catch {
      setMyGroups([]);
    }
    setModalVisible(true);
  };

  const openEdit = (post) => {
    setMenuPostId(null);
    setEditingPost(post);
    setContent(post.content);
    setSelectedGroup(post.group?._id || post.group || null);
    setModalError("");
    setMyGroups([]);
    setModalVisible(true);
  };

  const handleClap = useClap(user._id, setPosts);

  const closeModal = () => { setModalVisible(false); setEditingPost(null); };

  const handleSubmit = async () => {
    if (!content.trim()) { setModalError("Post content is required."); return; }
    setSubmitting(true);
    setModalError("");
    try {
      if (editingPost) {
        const data = await apiFetch(`/api/posts/${editingPost._id}`, {
          method: "PUT",
          body: JSON.stringify({ content: content.trim() }),
        });
        setPosts((prev) => prev.map((p) => p._id === editingPost._id ? { ...p, content: data.post.content, edited: true } : p));
      } else {
        const data = await apiFetch("/api/posts", {
          method: "POST",
          body: JSON.stringify({ content: content.trim(), group: selectedGroup || undefined }),
        });
        const enriched = {
          ...data.post,
          author: { _id: user._id, username: user.username, displayName: user.displayName },
          group: selectedGroup ? myGroups.find((g) => g._id === selectedGroup) || null : null,
        };
        setPosts((prev) => [enriched, ...prev]);
      }
      closeModal();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (post) => {
    setMenuPostId(null);
    Alert.alert("Delete post", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/posts/${post._id}`, { method: "DELETE" });
            setPosts((prev) => prev.filter((p) => p._id !== post._id));
          } catch (err) { showToast(err.message); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Feed"
        right={
          <>
            <TouchableOpacity onPress={() => navigation.navigate("PostSearch")} style={styles.searchBtn}>
              <Ionicons name="search-outline" size={22} color={colors.subtext} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.composeBtn} onPress={openCompose}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </>
        }
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScrollBeginDrag={() => setMenuPostId(null)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="newspaper-outline" size={40} color={colors.border} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySub}>Add friends or join groups to see posts, or tap + to create one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            item={item}
            currentUserId={user._id}
            menuPostId={menuPostId}
            setMenuPostId={setMenuPostId}
            onEdit={openEdit}
            onDelete={handleDelete}
            onClap={handleClap}
          />
        )}
      />

      <BottomTabBar active="Feed" navigation={navigation} />

      <Toast message={toast} />

      <PostEditModal
        visible={modalVisible}
        title={editingPost ? "Edit post" : "New post"}
        submitLabel={editingPost ? "Save" : "Post"}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={modalError}
        content={content}
        onChangeContent={setContent}
      >
        {!editingPost && myGroups.length > 0 && (
          <View>
            <Text style={styles.fieldLabel}>Post to group (optional)</Text>
            <TouchableOpacity style={styles.groupOption} onPress={() => setSelectedGroup(null)}>
              <View style={[styles.groupRadio, !selectedGroup && styles.groupRadioActive]} />
              <Text style={styles.groupOptionText}>No group (personal post)</Text>
            </TouchableOpacity>
            {myGroups.map((g) => (
              <TouchableOpacity key={g._id} style={styles.groupOption} onPress={() => setSelectedGroup(g._id)}>
                <View style={[styles.groupRadio, selectedGroup === g._id && styles.groupRadioActive]} />
                <Text style={styles.groupOptionText}>{g.name}</Text>
                <Text style={styles.groupOptionPrivacy}>{g.isPrivate ? "Private" : "Public"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </PostEditModal>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    searchBtn: { padding: 4 },
    composeBtn: {
      backgroundColor: "#2563eb", width: 36, height: 36,
      borderRadius: 18, justifyContent: "center", alignItems: "center",
    },
    list: { paddingVertical: SPACING.sm, paddingBottom: SPACING.md },
    emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 32, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.text2 },
    emptySub: { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 18 },
    fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.subtext, marginBottom: 6, marginTop: SPACING.sm },
    groupOption: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
    groupRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
    groupRadioActive: { borderColor: "#2563eb", backgroundColor: "#2563eb" },
    groupOptionText: { fontSize: 14, color: colors.text, flex: 1 },
    groupOptionPrivacy: { fontSize: 11, color: colors.muted },
  });
}
