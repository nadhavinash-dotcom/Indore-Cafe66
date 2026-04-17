import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getItem(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function getJSON(key) {
  const val = await getItem(key);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

export async function setJSON(key, value) {
  await setItem(key, JSON.stringify(value));
}
