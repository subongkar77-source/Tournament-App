import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTournaments, Tournament } from "@/contexts/TournamentContext";

const ADMIN_PASSWORD = "admin@FF2024";
const COLORS = {
  bg: "#0a0a0f",
  card: "#12121a",
  cardBorder: "#1e1e2e",
  primary: "#ff6b00",
  primaryDark: "#cc5500",
  accent: "#ffd700",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  text: "#e8e8f0",
  muted: "#6b6b8a",
  input: "#1a1a28",
  inputBorder: "#2a2a3e",
};

type Tab = "tournaments" | "payments" | "room";
type TournamentForm = {
  title: string;
  type: "Solo" | "Duo" | "Squad";
  entryFee: string;
  prizePool: string;
  totalSlots: string;
  date: string;
  time: string;
  map: string;
  status: "upcoming" | "live" | "completed";
  roomId: string;
  roomPassword: string;
};

const DEFAULT_FORM: TournamentForm = {
  title: "",
  type: "Solo",
  entryFee: "",
  prizePool: "",
  totalSlots: "100",
  date: "",
  time: "",
  map: "Bermuda",
  status: "upcoming",
  roomId: "",
  roomPassword: "",
};

export default function AdminScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("tournaments");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<TournamentForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [roomTargetId, setRoomTargetId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomPass, setRoomPass] = useState("");

  const { tournaments, payments, joinedMatches, addTournament, deleteTournament, updateTournament, verifyPayment, rejectPayment } = useTournaments();

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      Alert.alert("Access Denied", "Incorrect admin password.");
    }
  }

  function handleField(key: keyof TournamentForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    if (!form.title.trim()) return Alert.alert("Error", "Tournament name is required.");
    if (!form.entryFee || isNaN(Number(form.entryFee))) return Alert.alert("Error", "Enter a valid entry fee.");
    if (!form.prizePool || isNaN(Number(form.prizePool))) return Alert.alert("Error", "Enter a valid prize pool.");
    if (!form.date.trim()) return Alert.alert("Error", "Match date is required (e.g. 2026-06-01).");
    if (!form.time.trim()) return Alert.alert("Error", "Match time is required (e.g. 8:00 PM).");

    setSaving(true);
    try {
      await addTournament({
        title: form.title.trim(),
        type: form.type,
        entryFee: Number(form.entryFee),
        prizePool: Number(form.prizePool),
        totalSlots: Number(form.totalSlots) || 100,
        filledSlots: 0,
        date: form.date.trim(),
        time: form.time.trim(),
        map: form.map || "Bermuda",
        status: form.status,
        roomId: form.roomId.trim() || undefined,
        roomPassword: form.roomPassword.trim() || undefined,
      });
      setForm(DEFAULT_FORM);
      setShowCreateForm(false);
      Alert.alert("Success", "Tournament created! It will appear on the home screen.");
    } catch {
      Alert.alert("Error", "Failed to create tournament.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    Alert.alert("Delete Tournament", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTournament(id);
        },
      },
    ]);
  }

  async function handleVerify(paymentId: string, matchId: string, title: string) {
    Alert.alert("Verify Payment", `Verify payment for "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Verify",
        onPress: async () => {
          await verifyPayment(paymentId, matchId);
          Alert.alert("Done", "Payment verified. Player's match is confirmed.");
        },
      },
    ]);
  }

  async function handleReject(paymentId: string, matchId: string, title: string) {
    Alert.alert("Reject Payment", `Reject payment for "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          await rejectPayment(paymentId, matchId);
        },
      },
    ]);
  }

  async function handleSetRoom() {
    if (!roomTargetId) return Alert.alert("Error", "Select a tournament first.");
    if (!roomId.trim()) return Alert.alert("Error", "Room ID is required.");
    if (!roomPass.trim()) return Alert.alert("Error", "Room Password is required.");
    await updateTournament(roomTargetId, { roomId: roomId.trim(), roomPassword: roomPass.trim(), status: "live" });
    setRoomTargetId("");
    setRoomId("");
    setRoomPass("");
    Alert.alert("Done", "Room ID & Password set. Match status set to LIVE.");
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const customTournaments = tournaments.filter((t) => t.isCustom);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.loginContainer}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color={COLORS.muted} />
            </Pressable>

            <View style={styles.loginContent}>
              <View style={styles.shieldIcon}>
                <Feather name="shield" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.loginTitle}>Admin Access</Text>
              <Text style={styles.loginSubtitle}>Enter password to manage tournaments</Text>

              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={COLORS.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.loginInput}
                  placeholder="Admin Password"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={COLORS.muted} />
                </Pressable>
              </View>

              <Pressable style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Enter Dashboard</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.muted} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name="shield" size={18} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <Pressable onPress={() => setIsAuthenticated(false)} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color={COLORS.danger} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["tournaments", "payments", "room"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "tournaments" ? "🏆 Tournaments" : tab === "payments" ? `💳 Payments${pendingPayments.length > 0 ? ` (${pendingPayments.length})` : ""}` : "🚪 Room ID"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "tournaments" && (
          <View>
            {!showCreateForm ? (
              <Pressable style={styles.createBtn} onPress={() => setShowCreateForm(true)}>
                <Feather name="plus-circle" size={20} color="#000" />
                <Text style={styles.createBtnText}>Create New Tournament</Text>
              </Pressable>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>New Tournament</Text>

                <Text style={styles.label}>Tournament Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Night Warriors Cup" placeholderTextColor={COLORS.muted} value={form.title} onChangeText={(v) => handleField("title", v)} />

                <Text style={styles.label}>Mode *</Text>
                <View style={styles.pillRow}>
                  {(["Solo", "Duo", "Squad"] as const).map((t) => (
                    <Pressable key={t} onPress={() => handleField("type", t)} style={[styles.pill, form.type === t && styles.pillActive]}>
                      <Text style={[styles.pillText, form.type === t && styles.pillTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Entry Fee (₹) *</Text>
                    <TextInput style={styles.input} placeholder="50" placeholderTextColor={COLORS.muted} keyboardType="numeric" value={form.entryFee} onChangeText={(v) => handleField("entryFee", v)} />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Prize Pool (₹) *</Text>
                    <TextInput style={styles.input} placeholder="5000" placeholderTextColor={COLORS.muted} keyboardType="numeric" value={form.prizePool} onChangeText={(v) => handleField("prizePool", v)} />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Total Slots</Text>
                    <TextInput style={styles.input} placeholder="100" placeholderTextColor={COLORS.muted} keyboardType="numeric" value={form.totalSlots} onChangeText={(v) => handleField("totalSlots", v)} />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Map</Text>
                    <TextInput style={styles.input} placeholder="Bermuda" placeholderTextColor={COLORS.muted} value={form.map} onChangeText={(v) => handleField("map", v)} />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
                    <TextInput style={styles.input} placeholder="2026-06-01" placeholderTextColor={COLORS.muted} value={form.date} onChangeText={(v) => handleField("date", v)} />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Time *</Text>
                    <TextInput style={styles.input} placeholder="8:00 PM" placeholderTextColor={COLORS.muted} value={form.time} onChangeText={(v) => handleField("time", v)} />
                  </View>
                </View>

                <Text style={styles.label}>Status</Text>
                <View style={styles.pillRow}>
                  {(["upcoming", "live", "completed"] as const).map((s) => (
                    <Pressable key={s} onPress={() => handleField("status", s)} style={[styles.pill, form.status === s && styles.pillActive]}>
                      <Text style={[styles.pillText, form.status === s && styles.pillTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Room ID (optional)</Text>
                <TextInput style={styles.input} placeholder="Leave blank for upcoming" placeholderTextColor={COLORS.muted} value={form.roomId} onChangeText={(v) => handleField("roomId", v)} />

                <Text style={styles.label}>Room Password (optional)</Text>
                <TextInput style={styles.input} placeholder="Leave blank for upcoming" placeholderTextColor={COLORS.muted} value={form.roomPassword} onChangeText={(v) => handleField("roomPassword", v)} />

                <View style={styles.formActions}>
                  <Pressable style={styles.cancelBtn} onPress={() => { setShowCreateForm(false); setForm(DEFAULT_FORM); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleCreate} disabled={saving}>
                    <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create"}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Your Tournaments ({customTournaments.length})</Text>
            {customTournaments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="inbox" size={32} color={COLORS.muted} />
                <Text style={styles.emptyText}>No custom tournaments yet.</Text>
                <Text style={styles.emptySubText}>Create one above to see it here and on the home screen.</Text>
              </View>
            ) : (
              customTournaments.map((t) => (
                <View key={t.id} style={styles.tournamentRow}>
                  <View style={styles.tournamentInfo}>
                    <Text style={styles.tournamentName}>{t.title}</Text>
                    <Text style={styles.tournamentMeta}>{t.type} · ₹{t.entryFee} entry · Prize ₹{t.prizePool.toLocaleString()}</Text>
                    <Text style={styles.tournamentMeta}>{t.date} · {t.time}</Text>
                    <View style={[styles.statusBadge, t.status === "live" ? styles.statusLive : t.status === "completed" ? styles.statusDone : styles.statusUp]}>
                      <Text style={styles.statusText}>{t.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Pressable style={styles.deleteBtn} onPress={() => handleDelete(t.id, t.title)}>
                    <Feather name="trash-2" size={18} color={COLORS.danger} />
                  </Pressable>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>Default Tournaments ({tournaments.filter(t => !t.isCustom).length})</Text>
            {tournaments.filter(t => !t.isCustom).map((t) => (
              <View key={t.id} style={[styles.tournamentRow, styles.defaultRow]}>
                <View style={styles.tournamentInfo}>
                  <Text style={styles.tournamentName}>{t.title}</Text>
                  <Text style={styles.tournamentMeta}>{t.type} · ₹{t.entryFee} entry · Prize ₹{t.prizePool.toLocaleString()}</Text>
                  <View style={[styles.statusBadge, t.status === "live" ? styles.statusLive : t.status === "completed" ? styles.statusDone : styles.statusUp]}>
                    <Text style={styles.statusText}>{t.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.lockBadge}>
                  <Feather name="lock" size={14} color={COLORS.muted} />
                </View>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </View>
        )}

        {activeTab === "payments" && (
          <View>
            <Text style={styles.sectionTitle}>Pending Payments ({pendingPayments.length})</Text>
            {pendingPayments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="check-circle" size={32} color={COLORS.success} />
                <Text style={styles.emptyText}>All payments verified!</Text>
                <Text style={styles.emptySubText}>No pending payments at the moment.</Text>
              </View>
            ) : (
              pendingPayments.map((p) => {
                const match = joinedMatches.find((m) => m.tournamentId === p.tournamentId && m.paymentStatus === "pending");
                return (
                  <View key={p.id} style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <Text style={styles.paymentTitle}>{p.tournamentTitle || tournaments.find(t => t.id === p.tournamentId)?.title || "Tournament"}</Text>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>PENDING</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentMeta}>Amount: ₹{p.amount}</Text>
                    <Text style={styles.paymentMeta}>UPI: {p.upiId}</Text>
                    <Text style={styles.paymentMeta}>Time: {new Date(p.createdAt).toLocaleString()}</Text>
                    {p.screenshot ? (
                      <Image source={{ uri: p.screenshot }} style={styles.screenshot} resizeMode="cover" />
                    ) : (
                      <View style={styles.noScreenshot}>
                        <Feather name="image" size={20} color={COLORS.muted} />
                        <Text style={styles.noScreenshotText}>No screenshot uploaded</Text>
                      </View>
                    )}
                    <View style={styles.paymentActions}>
                      <Pressable
                        style={styles.rejectBtn}
                        onPress={() => handleReject(p.id, match?.id ?? "", p.tournamentTitle || "Tournament")}
                      >
                        <Feather name="x-circle" size={16} color={COLORS.danger} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </Pressable>
                      <Pressable
                        style={styles.verifyBtn}
                        onPress={() => handleVerify(p.id, match?.id ?? "", p.tournamentTitle || "Tournament")}
                      >
                        <Feather name="check-circle" size={16} color="#000" />
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}

            <Text style={styles.sectionTitle}>All Payments ({payments.length})</Text>
            {payments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No payments yet.</Text>
              </View>
            ) : (
              payments.map((p) => (
                <View key={p.id} style={[styles.paymentCard, p.status !== "pending" && styles.resolvedCard]}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentTitle}>{p.tournamentTitle || "Tournament"}</Text>
                    <View style={[styles.pendingBadge, p.status === "verified" ? styles.verifiedBadge : p.status === "failed" ? styles.failedBadge : {}]}>
                      <Text style={[styles.pendingBadgeText, p.status === "verified" ? { color: COLORS.success } : p.status === "failed" ? { color: COLORS.danger } : {}]}>
                        {p.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.paymentMeta}>₹{p.amount} · {new Date(p.createdAt).toLocaleString()}</Text>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </View>
        )}

        {activeTab === "room" && (
          <View>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Set Room ID & Password</Text>
              <Text style={styles.formHint}>
                Set the Room ID and Password for any of your custom tournaments. This makes the match go LIVE and players can see the room details.
              </Text>

              <Text style={styles.label}>Select Tournament</Text>
              {customTournaments.filter(t => t.status !== "completed").length === 0 ? (
                <Text style={[styles.emptyText, { marginBottom: 12 }]}>No active custom tournaments. Create one first.</Text>
              ) : (
                customTournaments
                  .filter((t) => t.status !== "completed")
                  .map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => setRoomTargetId(t.id)}
                      style={[styles.tournamentSelectRow, roomTargetId === t.id && styles.tournamentSelectRowActive]}
                    >
                      <View style={styles.tournamentSelectInfo}>
                        <Text style={styles.tournamentName}>{t.title}</Text>
                        <Text style={styles.tournamentMeta}>{t.date} · {t.time}</Text>
                        {t.roomId && <Text style={styles.existingRoom}>Room: {t.roomId} / {t.roomPassword}</Text>}
                      </View>
                      {roomTargetId === t.id && <Feather name="check-circle" size={20} color={COLORS.primary} />}
                    </Pressable>
                  ))
              )}

              <Text style={styles.label}>Room ID</Text>
              <TextInput style={styles.input} placeholder="e.g. FF9834" placeholderTextColor={COLORS.muted} value={roomId} onChangeText={setRoomId} autoCapitalize="none" />

              <Text style={styles.label}>Room Password</Text>
              <TextInput style={styles.input} placeholder="e.g. 4321" placeholderTextColor={COLORS.muted} value={roomPass} onChangeText={setRoomPass} autoCapitalize="none" />

              <Pressable style={[styles.saveBtn, { marginTop: 8 }]} onPress={handleSetRoom}>
                <Text style={styles.saveBtnText}>Set Room & Go Live 🔥</Text>
              </Pressable>
            </View>
            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  loginContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 24 },
  loginContent: { alignItems: "center" },
  shieldIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  loginTitle: { fontSize: 28, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  loginSubtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 32, textAlign: "center" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.input,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder,
    marginBottom: 16, width: "100%",
  },
  inputIcon: { paddingHorizontal: 14 },
  loginInput: { flex: 1, height: 52, color: COLORS.text, fontSize: 16 },
  eyeBtn: { padding: 14 },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    width: "100%", alignItems: "center", justifyContent: "center",
  },
  loginBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  backBtn: { padding: 8 },
  logoutBtn: { padding: 8 },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  tabTextActive: { color: COLORS.primary },

  content: { flex: 1, padding: 16 },

  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, marginBottom: 20,
  },
  createBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },

  formCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  formTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  formHint: { fontSize: 13, color: COLORS.muted, marginBottom: 16, lineHeight: 20 },

  label: { fontSize: 13, color: COLORS.muted, marginBottom: 6, marginTop: 10, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.input, borderRadius: 10, borderWidth: 1, borderColor: COLORS.inputBorder,
    paddingHorizontal: 14, height: 48, color: COLORS.text, fontSize: 15, marginBottom: 4,
  },

  pillRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.inputBorder, backgroundColor: COLORS.input },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { color: COLORS.muted, fontWeight: "600", fontSize: 14 },
  pillTextActive: { color: "#000" },

  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1 },

  formActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: "center", justifyContent: "center", height: 48 },
  cancelBtnText: { color: COLORS.muted, fontWeight: "600" },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: "center", justifyContent: "center", height: 48 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginTop: 8, marginBottom: 12 },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 28, alignItems: "center", gap: 8, marginBottom: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  emptyText: { color: COLORS.text, fontWeight: "600", fontSize: 15, textAlign: "center" },
  emptySubText: { color: COLORS.muted, fontSize: 13, textAlign: "center" },

  tournamentRow: {
    flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: "flex-start",
  },
  defaultRow: { opacity: 0.6 },
  tournamentInfo: { flex: 1 },
  tournamentName: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  tournamentMeta: { fontSize: 13, color: COLORS.muted, marginBottom: 2 },
  statusBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusLive: { backgroundColor: "rgba(34,197,94,0.2)" },
  statusDone: { backgroundColor: "rgba(107,107,138,0.2)" },
  statusUp: { backgroundColor: "rgba(255,107,0,0.2)" },
  statusText: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  deleteBtn: { padding: 8 },
  lockBadge: { padding: 8 },

  paymentCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  resolvedCard: { opacity: 0.6 },
  paymentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  paymentTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, flex: 1 },
  paymentMeta: { fontSize: 13, color: COLORS.muted, marginBottom: 2 },
  pendingBadge: { backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pendingBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.warning },
  verifiedBadge: { backgroundColor: "rgba(34,197,94,0.2)" },
  failedBadge: { backgroundColor: "rgba(239,68,68,0.2)" },
  screenshot: { width: "100%", height: 180, borderRadius: 10, marginTop: 10, marginBottom: 10 },
  noScreenshot: {
    height: 80, borderRadius: 10, borderWidth: 1, borderColor: COLORS.inputBorder,
    alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, marginBottom: 8,
    borderStyle: "dashed",
  },
  noScreenshotText: { color: COLORS.muted, fontSize: 13 },
  paymentActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  rejectBtn: {
    flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center",
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger, height: 42,
  },
  rejectBtnText: { color: COLORS.danger, fontWeight: "600" },
  verifyBtn: {
    flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.success, borderRadius: 10, height: 42,
  },
  verifyBtnText: { color: "#000", fontWeight: "700" },

  tournamentSelectRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.input,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.inputBorder,
  },
  tournamentSelectRowActive: { borderColor: COLORS.primary, backgroundColor: "rgba(255,107,0,0.08)" },
  tournamentSelectInfo: { flex: 1 },
  existingRoom: { fontSize: 12, color: COLORS.success, marginTop: 4, fontWeight: "600" },
});
