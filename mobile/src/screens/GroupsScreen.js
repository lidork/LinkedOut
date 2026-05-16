import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import BottomTabBar from "../components/BottomTabBar";
import ScreenHeader from "../components/ScreenHeader";
import GroupCard from "../components/GroupCard";
import Toast from "../components/Toast";
import { SPACING } from "../constants/layout";

import useToast from "../hooks/useToast";

export default function GroupsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(null);
  const { toast, showToast } = useToast();

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiFetch("/api/groups");
      // This screen shows only the user's groups (admin/member/pending) — not a full directory
      const myGroups = data.groups.filter((g) => {
        const adminId = g.admin?._id || g.admin;
        if (adminId === user._id) return true;
        if (g.members?.some((m) => (m._id || m) === user._id)) return true;
        if (g.pendingMembers?.some((m) => (m._id || m) === user._id)) return true;
        return false;
      });
      setGroups(myGroups);
    } catch (err) {
      showToast(err.message);
    }
  }, [user._id]);

  useEffect(() => { loadGroups().finally(() => setLoading(false)); }, [loadGroups]);
  useFocusEffect(useCallback(() => { loadGroups(); }, [loadGroups]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleJoin = async (group) => {
    setJoining(group._id);
    try {
      await apiFetch(`/api/groups/${group._id}/join`, { method: "POST" });
      await loadGroups();
    } catch (err) {
      showToast(err.message);
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563eb" />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Groups"
        right={
          <>
            <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate("GroupSearch")}>
              <Text style={styles.searchBtnText}>⌕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate("CreateGroup", { onCreated: loadGroups })}>
              <Text style={styles.createBtnText}>+ New</Text>
            </TouchableOpacity>
          </>
        }
      />

      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No groups yet. Create one!</Text>}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            userId={user._id}
            onPress={() => navigation.navigate("GroupDetail", { groupId: item._id })}
            onJoin={handleJoin}
            joining={joining}
          />
        )}
      />
      <Toast message={toast} />
      <BottomTabBar active="Groups" navigation={navigation} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    searchBtn: { paddingHorizontal: 10, paddingVertical: 7 },
    searchBtnText: { fontSize: 22, color: "#2563eb" },
    createBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    list: { padding: SPACING.md, paddingBottom: 32 },
    empty: { textAlign: "center", color: colors.subtext, marginTop: 40, fontSize: 14 },
  });
}
