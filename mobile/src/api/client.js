import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "http://10.0.2.2:4000";

export async function apiFetch(path, options = {}) {
  const token = await AsyncStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
