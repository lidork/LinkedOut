import { Linking } from "react-native";

export default function openUrl(url) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  Linking.openURL(normalized);
}
