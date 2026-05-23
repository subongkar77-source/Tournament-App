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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [method, setMethod] = useState<"phone" | "gmail">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ffId, setFfId] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim()) return Alert.alert("Required", "Enter your name.");
    if (!ffId.trim()) return Alert.alert("Required", "Enter your Free Fire UID.");
    if (!password.trim()) return Alert.alert("Required", "Create a password.");
    if (method === "phone" && !phone.trim()) return Alert.alert("Required", "Enter phone number.");
    if (method === "gmail" && !email.trim()) return Alert.alert("Required", "Enter Gmail address.");

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: method === "phone" ? phone.trim() : "",
        email: method === "gmail" ? email.trim() : "",
        password,
        ffId: ffId.trim(),
        loginMethod: method,
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <Image source={require("@/assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.appName, { color: colors.primary }]}>Create Account</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Join the battle. Win prizes.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

            {[
              { icon: "user" as const, placeholder: "Full Name", value: name, onChange: setName, keyboard: "default" as const },
              { icon: "cpu" as const, placeholder: "Free Fire UID", value: ffId, onChange: setFfId, keyboard: "numeric" as const },
            ].map((field) => (
              <View key={field.placeholder} style={[styles.inputWrap, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name={field.icon} size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType={field.keyboard}
                />
              </View>
            ))}

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
                placeholder="Create Password"
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
              style={[styles.registerBtn, { backgroundColor: loading ? colors.mutedForeground : colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.registerBtnText, { color: colors.primaryForeground }]}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.mutedForeground }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 20 },
  logoArea: { alignItems: "center", gap: 4 },
  logo: { width: 70, height: 70, borderRadius: 18 },
  appName: { fontSize: 24, fontWeight: "800" },
  tagline: { fontSize: 13 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  toggle: { flexDirection: "row", borderRadius: 10, overflow: "hidden", padding: 3 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 8 },
  toggleText: { fontSize: 13, fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  registerBtn: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  registerBtnText: { fontSize: 16, fontWeight: "700" },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "700" },
});
