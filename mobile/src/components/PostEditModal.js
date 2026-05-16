import React from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, ActivityIndicator,
  Platform, StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

const MAX_CHARS = 280;
const WARN_AT = 260;
const URL_RE = /https?:\/\//i;

export default function PostEditModal({
  visible, title, submitLabel,
  onClose, onSubmit, submitting, error,
  content, onChangeContent,
  children,
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const count = content.length;
  const overLimit = count > MAX_CHARS;
  const hasUrl = URL_RE.test(content);
  const submitDisabled = submitting || overLimit || !content.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity
            style={[styles.modalSubmitBtn, submitDisabled && styles.modalSubmitBtnDisabled]}
            onPress={onSubmit}
            disabled={submitDisabled}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.modalSubmitText}>{submitLabel}</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.modalError}>{error}</Text> : null}
          {hasUrl ? (
            <Text style={styles.urlError}>LinkedOut is a link-free zone. Say it with words.</Text>
          ) : null}
          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.muted}
            multiline
            value={content}
            onChangeText={onChangeContent}
            autoFocus
          />
          <Text style={[styles.counter, count >= WARN_AT && styles.counterWarn]}>
            {count} / {MAX_CHARS}
          </Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    modal: { flex: 1, backgroundColor: colors.card },
    modalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: HEADER_PADDING_BOTTOM,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalCancel: { minWidth: 56 },
    modalCancelText: { color: colors.subtext, fontSize: 15 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    modalSubmitBtn: {
      backgroundColor: "#2563eb", borderRadius: 20,
      paddingHorizontal: 18, paddingVertical: 7, minWidth: 56, alignItems: "center",
    },
    modalSubmitBtnDisabled: { opacity: 0.6 },
    modalSubmitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    modalBody: { flex: 1, padding: SPACING.md },
    modalError: { color: "#dc2626", marginBottom: HEADER_PADDING_BOTTOM, fontSize: 13 },
    urlError: { color: "#dc2626", fontSize: 13, marginBottom: 8, fontStyle: "italic" },
    contentInput: {
      fontSize: 16, color: colors.text, minHeight: 100,
      textAlignVertical: "top", marginBottom: 6, lineHeight: 22,
    },
    counter: { fontSize: 12, color: colors.muted, textAlign: "right", marginBottom: 16 },
    counterWarn: { color: "#dc2626", fontWeight: "600" },
  });
}
