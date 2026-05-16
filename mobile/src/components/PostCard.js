import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";
import openUrl from "../utils/openUrl";

export default function PostCard({ item, currentUserId, menuPostId, setMenuPostId, onEdit, onDelete, onClap }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const isOwn = (item.author?._id || item.author) === currentUserId;

  const clapped = Array.isArray(item.claps) && item.claps.includes(currentUserId);
  const clapCount = Array.isArray(item.claps) ? item.claps.length : 0;

  const btnRef = useRef(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const open = menuPostId === item._id;

  const openMenu = () => {
    btnRef.current.measureInWindow((pageX, pageY, width, height) => {
      const screenWidth = Dimensions.get("window").width;
      setDropPos({ top: pageY + height + 4, right: screenWidth - pageX - width });
      setMenuPostId(item._id);
    });
  };

  const close = () => setMenuPostId(null);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatarWrap}>
          <Avatar person={item.author} size={38} openToWork={item.author?.openToWork} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardMeta}>
            <Text style={styles.authorName}>{item.author?.displayName || item.author?.username}</Text>
            <Text style={styles.authorHandle}>@{item.author?.username}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            {item.edited && <Text style={styles.editedTag}>· edited</Text>}
          </View>
          {item.author?.jobTitle ? (
            item.author?.portfolioUrl ? (
              <TouchableOpacity
                style={styles.authorJobTitleRow}
                onPress={() => openUrl(item.author.portfolioUrl)}
              >
                <Text style={styles.authorJobTitle}>{item.author.jobTitle}</Text>
                <Text style={styles.portfolioChip}>🔗</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.authorJobTitle}>{item.author.jobTitle}</Text>
            )
          ) : null}
          {item.group ? <Text style={styles.groupTag}>#{item.group?.name || "group"}</Text> : null}
          <Text style={styles.body}>{item.content}</Text>
        </View>

        {isOwn && (
          <TouchableOpacity ref={btnRef} onPress={openMenu} style={styles.menuBtn}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.clapBtn} onPress={() => onClap && onClap(item)}>
          <Text style={[styles.clapIcon, clapped && styles.clapIconActive]}>👏</Text>
          {clapCount > 0 && (
            <Text style={[styles.clapCount, clapped && styles.clapCountActive]}>{clapCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Transparent modal so tapping anywhere outside dismisses the dropdown */}
      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[styles.dropdown, { top: dropPos.top, right: dropPos.right }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { close(); onEdit(item); }}>
              <Ionicons name="pencil-outline" size={15} color={colors.text2} />
              <Text style={styles.dropdownText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { close(); onDelete(item); }}>
              <Ionicons name="trash-outline" size={15} color="#dc2626" />
              <Text style={styles.dropdownTextDanger}>Delete</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border2,
    },
    cardRow: { flexDirection: "row", gap: 12 },
    avatarWrap: { flexShrink: 0 },
    cardBody: { flex: 1 },
    cardMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 4 },
    authorName: { fontSize: 13, fontWeight: "700", color: colors.text },
    authorHandle: { fontSize: 12, color: colors.muted },
    dot: { fontSize: 12, color: colors.muted },
    date: { fontSize: 12, color: colors.muted },
    editedTag: { fontSize: 11, color: colors.muted, fontStyle: "italic" },
    authorJobTitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
    authorJobTitle: { fontSize: 11, color: "#2563eb" },
    portfolioChip: { fontSize: 11 },
    groupTag: { fontSize: 11, color: "#7c3aed", fontWeight: "600", marginBottom: 4 },
    body: { fontSize: 14, color: colors.text2, lineHeight: 20 },
    menuBtn: { padding: 4, alignSelf: "center" },
    footer: { flexDirection: "row", alignItems: "center", marginTop: 10, paddingLeft: 50 },
    clapBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2, paddingHorizontal: 4 },
    clapIcon: { fontSize: 16, opacity: 0.4 },
    clapIconActive: { opacity: 1 },
    clapCount: { fontSize: 13, color: colors.muted, fontWeight: "500" },
    clapCountActive: { color: "#2563eb", fontWeight: "600" },
    backdrop: { flex: 1 },
    dropdown: {
      position: "absolute",
      backgroundColor: colors.card, borderRadius: 10, width: 150,
      shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 8, borderWidth: 1, borderColor: colors.border2,
    },
    dropdownItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
    dropdownDivider: { height: 1, backgroundColor: colors.border2 },
    dropdownText: { fontSize: 14, color: colors.text2, fontWeight: "500" },
    dropdownTextDanger: { fontSize: 14, color: "#dc2626", fontWeight: "500" },
  });
}
