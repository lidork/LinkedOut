import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, Switch,
  StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import BottomTabBar from "../components/BottomTabBar";
import PostCard from "../components/PostCard";
import PostEditModal from "../components/PostEditModal";
import ScreenHeader from "../components/ScreenHeader";
import openUrl from "../utils/openUrl";
import useClap from "../hooks/useClap";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [openToWork, setOpenToWork] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/posts?author=${user._id}`);
      setPosts(data.posts);
    } catch (err) {
      setPostsError(err.message);
    } finally {
      setPostsLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    apiFetch(`/api/users/${user._id}`)
      .then((data) => {
        setProfile(data.user);
        setDisplayName(data.user.displayName || "");
        setAvatarUri(data.user.avatar || "");
        setJobTitle(data.user.jobTitle || "");
        setPortfolioUrl(data.user.portfolioUrl || "");
        setOpenToWork(data.user.openToWork || false);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    loadPosts();
  }, [user._id, loadPosts]);

  const handleSave = async () => {
    if (!displayName.trim()) { setError("Display name cannot be empty."); return; }
    setSaving(true); setError("");
    try {
      const data = await apiFetch(`/api/users/${user._id}`, {
        method: "PUT",
        body: JSON.stringify({ displayName: displayName.trim(), avatar: avatarUri, jobTitle: jobTitle.trim(), portfolioUrl: portfolioUrl.trim(), openToWork }),
      });
      setProfile(data.user);
      setAvatarUri(data.user.avatar || "");
      setEditing(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library to change your avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setAvatarUri(dataUri);
      setSaving(true);
      try {
        const data = await apiFetch(`/api/users/${user._id}`, {
          method: "PUT",
          body: JSON.stringify({ displayName: profile.displayName, avatar: dataUri }),
        });
        setProfile(data.user);
        loadPosts();
      } catch (err) {
        setError(err.message);
        setAvatarUri(profile.avatar || "");
      } finally { setSaving(false); }
    }
  };

  const handleDeleteAccount = () => {
    setMenuOpen(false);
    Alert.alert("Delete account", "This will permanently delete your account. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/api/users/${user._id}`, { method: "DELETE" });
            logout();
          } catch (err) { setError(err.message); }
        },
      },
    ]);
  };

  const openEdit = (post) => {
    setMenuPostId(null);
    setEditingPost(post);
    setContent(post.content);
    setModalError("");
    setModalVisible(true);
  };

  const handleClap = useClap(user._id, setPosts);

  const handleEditSubmit = async () => {
    if (!content.trim()) { setModalError("Post content is required."); return; }
    setSubmitting(true); setModalError("");
    try {
      const data = await apiFetch(`/api/posts/${editingPost._id}`, {
        method: "PUT",
        body: JSON.stringify({ content: content.trim() }),
      });
      setPosts((prev) => prev.map((p) =>
        p._id === editingPost._id ? { ...p, content: data.post.content, edited: true } : p
      ));
      setModalVisible(false);
      setEditingPost(null);
    } catch (err) { setModalError(err.message); } finally { setSubmitting(false); }
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
          } catch (err) { setPostsError(err.message); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;

  const initial = (profile?.displayName || profile?.username || "?")[0].toUpperCase();

  const header = (
    <View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.heroRow}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          {saving && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.heroInfo}>
          <Text style={styles.heroDisplayName}>{profile?.displayName || profile?.username}</Text>
          {jobTitle ? <Text style={styles.heroJobTitle}>{jobTitle}</Text> : null}
          <Text style={styles.heroHandle}>@{profile?.username}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{profile?.role === "admin" ? "Admin" : "Member"}</Text>
            </View>
            {openToWork && (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Open to Work</Text>
              </View>
            )}
          </View>
          {portfolioUrl ? (
            <TouchableOpacity onPress={() => openUrl(portfolioUrl)}>
              <Text style={styles.portfolioLink}>🔗 Portfolio</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.menuWrap}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => { setMenuPostId(null); setMenuOpen((v) => !v); }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.subtext} />
          </TouchableOpacity>
          {menuOpen && (
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMenuOpen(false); setEditing(true); }}>
                <Ionicons name="pencil-outline" size={15} color={colors.text2} />
                <Text style={styles.dropdownText}>Edit profile</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMenuOpen(false); setTimeout(handlePickAvatar, 50); }}>
                <Ionicons name="camera-outline" size={15} color={colors.text2} />
                <Text style={styles.dropdownText}>Change photo</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
                <Text style={styles.dropdownTextDanger}>Delete account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.friendCount}>{profile?.friends?.length ?? 0} connections</Text>

      {editing && (
        <View style={styles.editBox}>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.fieldLabel}>Job title</Text>
          <TextInput
            style={styles.input}
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder="e.g. Thought Leader"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.fieldLabel}>Portfolio URL</Text>
          <TextInput
            style={styles.input}
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            placeholder="https://yourportfolio.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="url"
          />
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Open to Work</Text>
            <Switch
              value={openToWork}
              onValueChange={setOpenToWork}
              trackColor={{ false: colors.border, true: "#16a34a" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => { setEditing(false); setError(""); }}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Posts</Text>
        <Text style={styles.sectionCount}>{posts.length}</Text>
      </View>
      {postsError ? <Text style={styles.error}>{postsError}</Text> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        right={
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings-outline" size={22} color={colors.muted} />
          </TouchableOpacity>
        }
      />
      {/* ScrollView intentional — FlatList breaks dropdown zIndex on Android */}
      <ScrollView
        contentContainerStyle={styles.content}
        onScrollBeginDrag={() => { setMenuPostId(null); setMenuOpen(false); }}
        refreshControl={<RefreshControl refreshing={postsLoading} onRefresh={loadPosts} />}
      >
        {header}
        {!postsLoading && posts.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={36} color={colors.border} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        )}
        {posts.map((item) => (
          <PostCard
            key={item._id}
            item={item}
            currentUserId={user._id}
            menuPostId={menuPostId}
            setMenuPostId={(id) => { setMenuOpen(false); setMenuPostId(id); }}
            onEdit={openEdit}
            onDelete={handleDelete}
            onClap={handleClap}
          />
        ))}
      </ScrollView>

      <BottomTabBar active="Profile" navigation={navigation} />

      <PostEditModal
        visible={modalVisible}
        title="Edit post"
        submitLabel="Save"
        onClose={() => { setModalVisible(false); setEditingPost(null); }}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        error={modalError}
        content={content}
        onChangeContent={setContent}
      />
    </View>
  );
}

function makeStyles(colors, insets) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    error: { color: "#b91c1c", marginBottom: HEADER_PADDING_BOTTOM, fontSize: 13, paddingHorizontal: SPACING.md },
    heroRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
    avatarWrap: { position: "relative" },
    avatarImage: { width: 72, height: 72, borderRadius: 36 },
    avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
    avatarInitial: { fontSize: 28, color: "#fff", fontWeight: "700" },
    avatarOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 36, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
    heroInfo: { flex: 1 },
    heroDisplayName: { fontSize: 17, fontWeight: "700", color: colors.text },
    heroJobTitle: { fontSize: 13, color: colors.subtext, marginBottom: 2 },
    heroHandle: { fontSize: 13, color: colors.muted, marginBottom: 6 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
    badge: { alignSelf: "flex-start", backgroundColor: "#ede9fe", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 2 },
    badgeText: { color: "#7c3aed", fontSize: 11, fontWeight: "600" },
    openBadge: { alignSelf: "flex-start", backgroundColor: "#dcfce7", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 2 },
    openBadgeText: { color: "#16a34a", fontSize: 11, fontWeight: "600" },
    portfolioLink: { fontSize: 13, color: "#2563eb", fontWeight: "600", marginTop: 4 },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: HEADER_PADDING_BOTTOM },
    menuWrap: { position: "relative" },
    menuBtn: { padding: 6 },
    dropdown: {
      position: "absolute", right: 0, top: 32, zIndex: 20,
      backgroundColor: colors.card, borderRadius: 10, width: 180,
      shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 999, borderWidth: 1, borderColor: colors.border2,
    },
    dropdownItem: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: 14, paddingVertical: HEADER_PADDING_BOTTOM },
    dropdownDivider: { height: 1, backgroundColor: colors.border2 },
    dropdownText: { fontSize: 14, color: colors.text2, fontWeight: "500" },
    dropdownTextDanger: { fontSize: 14, color: "#ef4444", fontWeight: "500" },
    friendCount: { fontSize: 13, color: colors.subtext, paddingHorizontal: SPACING.md, marginBottom: 20 },
    editBox: { marginHorizontal: SPACING.md, marginBottom: 20, backgroundColor: colors.card, borderRadius: 12, padding: SPACING.md, borderWidth: 1, borderColor: colors.border },
    fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.subtext, marginBottom: 6 },
    input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: HEADER_PADDING_BOTTOM, paddingVertical: 10, fontSize: 15, color: colors.text, marginBottom: HEADER_PADDING_BOTTOM },
    row: { flexDirection: "row", gap: 10 },
    btn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 11, alignItems: "center", flex: 1 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    btnSecondary: { backgroundColor: colors.inputBg },
    btnSecondaryText: { color: colors.text2, fontWeight: "600", fontSize: 14 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: HEADER_PADDING_BOTTOM, borderTopWidth: 1, borderTopColor: colors.border },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    sectionCount: { fontSize: 13, color: colors.muted, fontWeight: "500" },
    emptyWrap: { alignItems: "center", marginTop: 40, gap: SPACING.sm },
    emptyText: { fontSize: 14, color: colors.muted },
  });
}
