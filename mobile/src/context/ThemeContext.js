import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LIGHT = {
  bg: "#f7f7fb",
  card: "#ffffff",
  text: "#111827",
  text2: "#374151",
  subtext: "#6b7280",
  muted: "#9ca3af",
  border: "#e5e7eb",
  border2: "#f3f4f6",
  inputBg: "#f9fafb",
};

export const DARK = {
  bg: "#0f172a",
  card: "#1e293b",
  text: "#f1f5f9",
  text2: "#cbd5e1",
  subtext: "#94a3b8",
  muted: "#64748b",
  border: "#334155",
  border2: "#0f172a",
  inputBg: "#0f172a",
};

const storageKey = (userId) => userId ? `pref_darkMode_${userId}` : "pref_darkMode";

const ThemeContext = createContext({ isDark: false, colors: LIGHT, toggle: () => {}, reloadForUser: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const userIdRef = useRef(null);

  // Load anonymous preference on first launch (before any user logs in)
  useEffect(() => {
    AsyncStorage.getItem(storageKey(null)).then((val) => {
      if (val === "true") setIsDark(true);
    });
  }, []);

  /**
   * Switches the active preference store to this user's key and applies their
   * saved preference. Call this after login, register, or session restore so
   * dark-mode state reflects the signed-in user rather than the anonymous key.
   */
  const reloadForUser = async (userId) => {
    userIdRef.current = userId;
    if (!userId) return;
    const val = await AsyncStorage.getItem(storageKey(userId));
    // val === null means no saved preference yet — keep current state
    if (val !== null) setIsDark(val === "true");
  };

  const toggle = async (val) => {
    setIsDark(val);
    await AsyncStorage.setItem(storageKey(userIdRef.current), String(val));
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK : LIGHT, toggle, reloadForUser }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
