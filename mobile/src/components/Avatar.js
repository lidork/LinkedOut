import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

/**
 * Renders a circular avatar. Shows the user's photo if available, otherwise
 * a blue circle with the first letter of displayName or username.
 * Pass openToWork=true to show a green "Open to Work" badge on the bottom edge.
 */
export default function Avatar({ person = {}, size = 42, openToWork = false }) {
  const initial = (person.displayName || person.username || "?")[0].toUpperCase();
  const radius = size / 2;
  const styles = makeStyles(size, radius);

  const inner = person.avatar
    ? <Image source={{ uri: person.avatar }} style={styles.image} />
    : (
      <View style={styles.fallback}>
        <Text style={styles.initial}>{initial}</Text>
      </View>
    );

  if (!openToWork) return inner;

  return (
    <View style={styles.wrap}>
      {inner}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#Open</Text>
      </View>
    </View>
  );
}

function makeStyles(size, radius) {
  const badgeH = Math.max(12, size * 0.28);
  return StyleSheet.create({
    wrap: { width: size, height: size + badgeH / 2, alignItems: "center" },
    image: { width: size, height: size, borderRadius: radius },
    fallback: {
      width: size, height: size, borderRadius: radius,
      backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center",
    },
    initial: { color: "#fff", fontWeight: "700", fontSize: size * 0.4 },
    badge: {
      position: "absolute", bottom: 0,
      backgroundColor: "#16a34a", borderRadius: 6,
      paddingHorizontal: 4, paddingVertical: 1,
      borderWidth: 1.5, borderColor: "#fff",
    },
    badgeText: { color: "#fff", fontSize: Math.max(7, size * 0.16), fontWeight: "700" },
  });
}
