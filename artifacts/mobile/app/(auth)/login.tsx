import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [method, setMethod] = useState<"phone" | "gmail">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!password.trim()) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }
    if (method === "phone" && !phone.trim()) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    if (method === "gmail" && !email.trim()) {
      Alert.alert("Required", "Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      await login({
        phone: method === "phone" ? phone.trim() : undefined,
        email: method === "gmail" ? email.trim() : undefined,
        password,
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: colors.primary }]}>FF Tournament</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Compete. Win. Dominate.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.heading, { color: colors.foreground }]}>Welcome Back</Text>

            <View style={[styles.toggle, { backgroundColor: colors.secondary }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, method === "phone" && { backgroundColor: colors.primary }]}
                onPress={() => setMethod("phone")}
              >
                <Feather name="phone" size={14} color={method === "phone" ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.toggleText, { color: method === "phone" ? colors.primaryForeground : colors.mutedForeground }]}>
                  Phone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, method === "gmail" && { backgroundColor: colors.primary }]}
                onPress={() => setMethod("gmail")}
              >
                <Feather name="mail" size={14} color={method === "gmail" ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.toggleText, { color: method === "gmail" ? colors.primaryForeground : colors.mutedForeground }]}>
                  Gmail
                </Text>
              </TouchableOpacity>
            </View>

            {method === "phone" ? (
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="phone" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="+91 Phone Number"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <View style={[styles.inputWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="mail" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Gmail Address"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={[styles.inputWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: loading ? colors.mutedForeground : colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>
                {loading ? "Logging In..." : "Login"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 24 },
  logoArea: { alignItems: "center", gap: 6 },
  logo: { width: 80, height: 80, borderRadius: 20 },
  appName: { fontSize: 28, fontWeight: "800", letterSpacing: 1 },
  tagline: { fontSize: 13 },
  card: { borderRadius: 20, borderWidth: 1, padding: 22, gap: 14 },
  heading: { fontSize: 22, fontWeight: "700" },
  toggle: { flexDirection: "row", borderRadius: 10, overflow: "hidden", padding: 3 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 8 },
  toggleText: { fontSize: 13, fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  loginBtn: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  loginBtnText: { fontSize: 16, fontWeight: "700" },
  registerRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: "700" },
});
