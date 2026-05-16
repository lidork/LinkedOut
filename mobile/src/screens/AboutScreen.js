import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import LinkedOutLogo from "../components/LinkedOutLogo";

export default function AboutScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <LinkedOutLogo size={40} showTagline />

      <View style={styles.section}>
        <Text style={styles.body}>
          LinkedOut is the social network for professionals who are done pretending.
        </Text>
        <Text style={styles.body}>
          Post your thoughts in 280 characters or fewer. No links allowed — if you can't say it with words, it probably wasn't worth saying.
        </Text>
        <Text style={styles.body}>
          Connect with people, join groups, and chat — minus the corporate jargon.
        </Text>
      </View>

      <View style={styles.rules}>
        <Text style={styles.ruleTitle}>The rules</Text>
        <Text style={styles.rule}>✦  Posts max 280 characters</Text>
        <Text style={styles.rule}>✦  No URLs in posts</Text>
        <Text style={styles.rule}>✦  Portfolio links live on your profile</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Log back in to your account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.registerWrap}>
        <Text style={styles.link}>Ready to join? Register a new account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 48, backgroundColor: "#f7f7fb" },
  section: { marginTop: 32, gap: 14 },
  body: { fontSize: 15, color: "#374151", lineHeight: 23 },
  rules: { marginTop: 32, backgroundColor: "#eff6ff", borderRadius: 12, padding: 20, gap: 10 },
  ruleTitle: { fontSize: 13, fontWeight: "700", color: "#2563eb", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  rule: { fontSize: 14, color: "#1e40af" },
  link: { textAlign: "center", color: "#2563eb", fontSize: 14, fontWeight: "600", marginTop: 28 },
  registerWrap: { marginTop: 4 },
});
