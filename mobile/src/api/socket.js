import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./client";

let socket = null;

export async function connectSocket() {
  if (socket?.connected) return socket;
  const token = await AsyncStorage.getItem("token");
  socket = io(API_BASE, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
