import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function LinkedOutLogo({ size = 28, showTagline = false }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.wordmark}>
        <Text style={[styles.linked, { fontSize: size }]}>Linked</Text>
        <Text style={[styles.out, { fontSize: size }]}>Out</Text>
      </View>
      {showTagline && <Text style={styles.tagline}>Professional. Brief. No BS.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  wordmark: { flexDirection: "row", alignItems: "baseline" },
  linked: { fontWeight: "700", color: "#2563eb" },
  out: { fontWeight: "300", color: "#94a3b8" },
  tagline: { fontSize: 13, color: "#94a3b8", marginTop: 6, letterSpacing: 0.3 },
});
