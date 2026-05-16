import { View, Text, StyleSheet } from "react-native";

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  text: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
