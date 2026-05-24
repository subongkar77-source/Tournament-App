import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTournaments } from "@/contexts/TournamentContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { joinedMatches } = useTournaments();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  const myMatches = joinedMatches.filter((m) => m.userId === user?.id);
  const verifiedMatches = myMatches.filter((m) => m.paymentStatus === "verified");
  const pendingMatches = myMatches.filter((m) => m.paymentStatus === "pending");

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  }

  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? "P";

  const stats = [
    { label: "Matches Joined", value: myMatches.length.toString(), icon: "target" as const, color: colors.primary },
    { label: "Confirmed", value: verifiedMatches.length.toString(), icon: "check-circle" as const, color: colors.success },
    { label: "Pending", value: pendingMatches.length.toString(), icon: "clock" as const, color: colors.accent },
  ];

  const infoItems = [
    { icon: "user" as const, label: "Full Name", value: user?.name ?? "—" },
    { icon: "cpu" as const, label: "Free Fire UID", value: user?.ffId ?? "—" },
    { icon: "phone" as const, label: "Phone Number", value: user?.phone || "—" },
    { icon: "mail" as const, label: "Email", value: user?.email || "—" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 12, paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

        <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarLetter, { color: colors.primaryForeground }]}>{avatarLetter}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarName, { color: colors.foreground }]}>{user?.name}</Text>
            <View style={[styles.idBadge, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="cpu" size={12} color={colors.primary} />
              <Text style={[styles.idBadgeText, { color: colors.primary }]}>UID: {user?.ffId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={stat.icon} size={18} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Account Info</Text>
          {infoItems.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon} size={14} color={colors.mutedForeground} />
                </View>
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.howTitle, { color: colors.foreground }]}>How to Join a Tournament</Text>
          {[
            "Browse tournaments on the home screen",
            "Tap any tournament to view details",
            "Click 'Join Tournament' and follow payment steps",
            "Send entry fee via UPI and upload screenshot",
            "Your slot will be confirmed within 2 hours",
            "Room ID & Password shared before match time",
          ].map((step, i) => (
            <View key={i} style={styles.howRow}>
              <View style={[styles.howNum, { backgroundColor: colors.primary }]}>
                <Text style={[styles.howNumText, { color: colors.primaryForeground }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.howText, { color: colors.mutedForeground }]}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.adminBtn, { backgroundColor: "#ff6b0018", borderColor: "#ff6b0044" }]}
          onPress={() => router.push("/admin")}
          activeOpacity={0.8}
        >
          <Feather name="shield" size={16} color="#ff6b00" />
          <Text style={[styles.logoutText, { color: "#ff6b00" }]}>Admin Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  avatarCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "800" },
  avatarInfo: { gap: 6, flex: 1 },
  avatarName: { fontSize: 20, fontWeight: "700" },
  idBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  idBadgeText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  infoTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  divider: { height: 1, marginVertical: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  howCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  howTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  howNumText: { fontSize: 11, fontWeight: "700" },
  howText: { fontSize: 13, flex: 1, lineHeight: 18 },
  adminBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: "700" },
});
