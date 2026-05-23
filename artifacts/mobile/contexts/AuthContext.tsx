import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  ffId: string;
  avatar: string;
  balance: number;
  totalMatches: number;
  wins: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { phone?: string; email?: string; password: string }) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
  ffId: string;
  loginMethod: "phone" | "gmail";
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS_KEY = "ff_users";
const CURRENT_USER_KEY = "ff_current_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }

  async function register(data: RegisterData) {
    const usersRaw = await AsyncStorage.getItem(MOCK_USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];

    const existing = users.find(
      (u) => u.phone === data.phone || u.email === data.email
    );
    if (existing) throw new Error("Account already exists with this phone/email");

    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      name: data.name,
      phone: data.phone,
      email: data.email,
      ffId: data.ffId,
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${data.name}`,
      balance: 0,
      totalMatches: 0,
      wins: 0,
    };

    users.push(newUser);
    await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }

  async function login(credentials: { phone?: string; email?: string; password: string }) {
    const usersRaw = await AsyncStorage.getItem(MOCK_USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];

    const found = users.find(
      (u) =>
        (credentials.phone && u.phone === credentials.phone) ||
        (credentials.email && u.email === credentials.email)
    );

    if (!found) throw new Error("No account found. Please register first.");
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
    setUser(found);
  }

  async function logout() {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...data };
    const usersRaw = await AsyncStorage.getItem(MOCK_USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = updated;
    await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
