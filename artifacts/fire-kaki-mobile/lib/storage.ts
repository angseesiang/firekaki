import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "firekaki.session_token";

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  get: () => getItem(KEY),
  set: (token: string) => setItem(KEY, token),
  clear: () => deleteItem(KEY),
};
