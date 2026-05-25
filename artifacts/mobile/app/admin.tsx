import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import { Tournament, useTournaments } from "@/contexts/TournamentContext";

const ADMIN_PASSWORD = "admin@FF2024";

const C = {
  bg: "#0a0a0f",
  card: "#12121a",
  cardBorder: "#1e1e2e",
  primary: "#ff6b00",
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

const EMPTY_FORM: TournamentForm = {
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

function tournamentToForm(t: Tournament): TournamentForm {
  return {
    title: t.title,
    type: t.type,
    entryFee: String(t.entryFee),
    prizePool: String(t.prizePool),
    totalSlots: String(t.totalSlots),
    date: t.date,
    time: t.time,
    map: t.map,
    status: t.status,
    roomId: t.roomId ?? "",
    roomPassword: t.roomPassword ?? "",
  };
}

function validateForm(form: TournamentForm): string | null {
  if (!form.title.trim()) return "Tournament name is required.";
  if (!form.entryFee || isNaN(Number(form.entryFee)) || Number(form.entryFee) < 0)
    return "Enter a valid entry fee (0 or more).";
  if (!form.prizePool || isNaN(Number(form.prizePool)) || Number(form.prizePool) < 0)
    return "Enter a valid prize pool (0 or more).";
  if (!form.date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim()))
    return "Date must be in YYYY-MM-DD format.";
  if (!form.time.trim()) return "Match time is required (e.g. 8:00 PM).";
  return null;
}

export default function AdminScreen() {
  const router = useRouter();
  const {
    tournaments,
    firestoreTournaments,
    payments,
    joinedMatches,
    firebaseError,
    addTournament,
    updateTournament,
    deleteTournament,
    verifyPayment,
    rejectPayment,
  } = useTournaments();

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("tournaments");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TournamentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [roomTargetId, setRoomTargetId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomPass, setRoomPass] = useState("");
  const [settingRoom, setSettingRoom] = useState(false);

  const pendingPayments = payments.filter((p) => p.status === "pending");

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      Alert.alert("Access Denied", "Incorrect admin password. Please try again.");
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: Tournament) {
    setEditingId(t.id);
    setForm(tournamentToForm(t));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function setField<K extends keyof TournamentForm>(key: K, value: TournamentForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const err = validateForm(form);
    if (err) return Alert.alert("Validation Error", err);

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        entryFee: Number(form.entryFee),
        prizePool: Number(form.prizePool),
        totalSlots: Number(form.totalSlots) || 100,
        filledSlots: editingId
          ? (firestoreTournaments.find((t) => t.id === editingId)?.filledSlots ?? 0)
          : 0,
        date: form.date.trim(),
        time: form.time.trim(),
        map: form.map.trim() || "Bermuda",
        status: form.status,
        roomId: form.roomId.trim() || undefined,
        roomPassword: form.roomPassword.trim() || undefined,
      };

      if (editingId) {
        await updateTournament(editingId, payload);
        Alert.alert("Updated", `"${payload.title}" has been updated.`);
      } else {
        await addTournament(payload);
        Alert.alert("Created", `"${payload.title}" is now live on the home screen.`);
      }
      closeForm();
    } catch (e: any) {
      Alert.alert("Firebase Error", e?.message ?? "Something went wrong. Check your Firestore rules and internet connection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Tournament) {
    Alert.alert(
      "Delete Tournament",
      `Delete "${t.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(t.id);
            try {
              await deleteTournament(t.id);
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Failed to delete tournament.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  async function handleVerify(paymentId: string, matchId: string, title: string) {
    Alert.alert("Verify Payment", `Confirm payment for "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Verify ✓",
        onPress: async () => {
          try {
            await verifyPayment(paymentId, matchId);
            Alert.alert("Done", "Payment verified. Player's match is confirmed.");
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to verify payment.");
          }
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
          try {
            await rejectPayment(paymentId, matchId);
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to reject payment.");
          }
        },
      },
    ]);
  }

  async function handleSetRoom() {
    if (!roomTargetId) return Alert.alert("Error", "Select a tournament first.");
    if (!roomId.trim()) return Alert.alert("Error", "Room ID is required.");
    if (!roomPass.trim()) return Alert.alert("Error", "Room Password is required.");
    setSettingRoom(true);
    try {
      await updateTournament(roomTargetId, {
        roomId: roomId.trim(),
        roomPassword: roomPass.trim(),
        status: "live",
      });
      setRoomTargetId("");
      setRoomId("");
      setRoomPass("");
      Alert.alert("Done", "Room ID & Password set. Match is now LIVE!");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to set room details.");
    } finally {
      setSettingRoom(false);
    }
  }

  if (!authed) {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={s.loginWrap}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Feather name="arrow-left" size={22} color={C.muted} />
            </Pressable>
            <View style={s.loginBody}>
              <View style={s.shield}>
                <Feather name="shield" size={40} color={C.primary} />
              </View>
              <Text style={s.loginTitle}>Admin Access</Text>
              <Text style={s.loginSub}>Enter password to manage tournaments</Text>
              <View style={s.inputRow}>
                <Feather name="lock" size={18} color={C.muted} style={{ paddingHorizontal: 14 }} />
                <TextInput
                  style={s.loginInput}
                  placeholder="Admin Password"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPw((v) => !v)} style={{ padding: 14 }}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={18} color={C.muted} />
                </Pressable>
              </View>
              <Pressable style={s.loginBtn} onPress={handleLogin}>
                <Text style={s.loginBtnText}>Enter Dashboard</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={C.muted} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="shield" size={18} color={C.primary} />
          <Text style={s.headerTitle}>Admin Dashboard</Text>
        </View>
        <Pressable onPress={() => setAuthed(false)} style={s.backBtn}>
          <Feather name="log-out" size={18} color={C.danger} />
        </Pressable>
      </View>

      {firebaseError ? (
        <View style={s.errorBanner}>
          <Feather name="wifi-off" size={14} color={C.danger} />
          <Text style={s.errorBannerText}>
            Firebase: {firebaseError.includes("permission") ? "Firestore rules blocking access — enable read/write in Firebase Console" : firebaseError}
          </Text>
        </View>
      ) : null}

      <View style={s.tabs}>
        {(["tournaments", "payments", "room"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.tab, activeTab === tab && s.tabActive]}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === "tournaments"
                ? "🏆 Tournaments"
                : tab === "payments"
                ? `💳 Payments${pendingPayments.length > 0 ? ` (${pendingPayments.length})` : ""}`
                : "🚪 Room ID"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        {activeTab === "tournaments" && (
          <TournamentsTab
            firestoreTournaments={firestoreTournaments}
            defaultTournaments={tournaments.filter((t) => !t.isCustom)}
            showForm={showForm}
            editingId={editingId}
            form={form}
            saving={saving}
            deletingId={deletingId}
            onOpenCreate={openCreate}
            onOpenEdit={openEdit}
            onDelete={handleDelete}
            onSave={handleSave}
            onClose={closeForm}
            setField={setField}
          />
        )}
        {activeTab === "payments" && (
          <PaymentsTab
            payments={payments}
            pendingPayments={pendingPayments}
            joinedMatches={joinedMatches}
            onVerify={handleVerify}
            onReject={handleReject}
          />
        )}
        {activeTab === "room" && (
          <RoomTab
            firestoreTournaments={firestoreTournaments}
            roomTargetId={roomTargetId}
            roomId={roomId}
            roomPass={roomPass}
            settingRoom={settingRoom}
            onSelectTournament={setRoomTargetId}
            onSetRoomId={setRoomId}
            onSetRoomPass={setRoomPass}
            onSubmit={handleSetRoom}
          />
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TournamentForm({
  form,
  saving,
  editingId,
  setField,
  onSave,
  onClose,
}: {
  form: TournamentForm;
  saving: boolean;
  editingId: string | null;
  setField: <K extends keyof TournamentForm>(k: K, v: TournamentForm[K]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{editingId ? "Edit Tournament" : "New Tournament"}</Text>

      <Label>Tournament Name *</Label>
      <TextInput style={s.input} placeholder="e.g. Night Warriors Cup" placeholderTextColor={C.muted} value={form.title} onChangeText={(v) => setField("title", v)} />

      <Label>Mode *</Label>
      <PillRow
        options={["Solo", "Duo", "Squad"]}
        value={form.type}
        onSelect={(v) => setField("type", v as any)}
      />

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Label>Entry Fee (₹) *</Label>
          <TextInput style={s.input} placeholder="50" placeholderTextColor={C.muted} keyboardType="numeric" value={form.entryFee} onChangeText={(v) => setField("entryFee", v)} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Prize Pool (₹) *</Label>
          <TextInput style={s.input} placeholder="5000" placeholderTextColor={C.muted} keyboardType="numeric" value={form.prizePool} onChangeText={(v) => setField("prizePool", v)} />
        </View>
      </View>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Label>Total Slots</Label>
          <TextInput style={s.input} placeholder="100" placeholderTextColor={C.muted} keyboardType="numeric" value={form.totalSlots} onChangeText={(v) => setField("totalSlots", v)} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Map</Label>
          <TextInput style={s.input} placeholder="Bermuda" placeholderTextColor={C.muted} value={form.map} onChangeText={(v) => setField("map", v)} />
        </View>
      </View>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Label>Date * (YYYY-MM-DD)</Label>
          <TextInput style={s.input} placeholder="2026-06-01" placeholderTextColor={C.muted} value={form.date} onChangeText={(v) => setField("date", v)} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Time *</Label>
          <TextInput style={s.input} placeholder="8:00 PM" placeholderTextColor={C.muted} value={form.time} onChangeText={(v) => setField("time", v)} />
        </View>
      </View>

      <Label>Status</Label>
      <PillRow
        options={["upcoming", "live", "completed"]}
        value={form.status}
        onSelect={(v) => setField("status", v as any)}
        labels={["Upcoming", "Live", "Completed"]}
      />

      <Label>Room ID (optional)</Label>
      <TextInput style={s.input} placeholder="Leave blank for upcoming" placeholderTextColor={C.muted} value={form.roomId} onChangeText={(v) => setField("roomId", v)} autoCapitalize="none" />

      <Label>Room Password (optional)</Label>
      <TextInput style={s.input} placeholder="Leave blank for upcoming" placeholderTextColor={C.muted} value={form.roomPassword} onChangeText={(v) => setField("roomPassword", v)} autoCapitalize="none" />

      <View style={[s.row, { marginTop: 16, gap: 10 }]}>
        <Pressable style={s.cancelBtn} onPress={onClose}>
          <Text style={{ color: C.muted, fontWeight: "600" }}>Cancel</Text>
        </Pressable>
        <Pressable style={[s.primaryBtn, saving && { opacity: 0.5 }]} onPress={onSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={s.primaryBtnText}>{editingId ? "Save Changes" : "Create"}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function TournamentsTab({
  firestoreTournaments,
  defaultTournaments,
  showForm,
  editingId,
  form,
  saving,
  deletingId,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onSave,
  onClose,
  setField,
}: {
  firestoreTournaments: Tournament[];
  defaultTournaments: Tournament[];
  showForm: boolean;
  editingId: string | null;
  form: TournamentForm;
  saving: boolean;
  deletingId: string | null;
  onOpenCreate: () => void;
  onOpenEdit: (t: Tournament) => void;
  onDelete: (t: Tournament) => void;
  onSave: () => void;
  onClose: () => void;
  setField: <K extends keyof TournamentForm>(k: K, v: TournamentForm[K]) => void;
}) {
  return (
    <View>
      {!showForm ? (
        <Pressable style={s.createBtn} onPress={onOpenCreate}>
          <Feather name="plus-circle" size={20} color="#000" />
          <Text style={s.createBtnText}>Create New Tournament</Text>
        </Pressable>
      ) : (
        <TournamentForm
          form={form}
          saving={saving}
          editingId={editingId}
          setField={setField}
          onSave={onSave}
          onClose={onClose}
        />
      )}

      <SectionTitle>Firebase Tournaments ({firestoreTournaments.length})</SectionTitle>
      {firestoreTournaments.length === 0 ? (
        <EmptyCard
          icon="cloud"
          text="No Firebase tournaments yet."
          sub="Create one above — it'll sync to all devices in real-time."
        />
      ) : (
        firestoreTournaments.map((t) => (
          <View key={t.id} style={s.tRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.tName}>{t.title}</Text>
              <Text style={s.tMeta}>
                {t.type} · ₹{t.entryFee} entry · Prize ₹{t.prizePool.toLocaleString()}
              </Text>
              <Text style={s.tMeta}>{t.date} · {t.time} · {t.map}</Text>
              {t.roomId ? (
                <Text style={[s.tMeta, { color: C.success }]}>
                  Room: {t.roomId} / {t.roomPassword}
                </Text>
              ) : null}
              <StatusBadge status={t.status} />
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable style={s.iconBtn} onPress={() => onOpenEdit(t)}>
                <Feather name="edit-2" size={16} color={C.primary} />
              </Pressable>
              <Pressable style={s.iconBtn} onPress={() => onDelete(t)} disabled={deletingId === t.id}>
                {deletingId === t.id ? (
                  <ActivityIndicator size="small" color={C.danger} />
                ) : (
                  <Feather name="trash-2" size={16} color={C.danger} />
                )}
              </Pressable>
            </View>
          </View>
        ))
      )}

      <SectionTitle>Default Tournaments ({defaultTournaments.length})</SectionTitle>
      {defaultTournaments.map((t) => (
        <View key={t.id} style={[s.tRow, { opacity: 0.5 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.tName}>{t.title}</Text>
            <Text style={s.tMeta}>{t.type} · ₹{t.entryFee} entry · Prize ₹{t.prizePool.toLocaleString()}</Text>
            <StatusBadge status={t.status} />
          </View>
          <Feather name="lock" size={14} color={C.muted} />
        </View>
      ))}
    </View>
  );
}

function PaymentsTab({
  payments,
  pendingPayments,
  joinedMatches,
  onVerify,
  onReject,
}: {
  payments: any[];
  pendingPayments: any[];
  joinedMatches: any[];
  onVerify: (pid: string, mid: string, title: string) => void;
  onReject: (pid: string, mid: string, title: string) => void;
}) {
  return (
    <View>
      <SectionTitle>Pending Payments ({pendingPayments.length})</SectionTitle>
      {pendingPayments.length === 0 ? (
        <EmptyCard icon="check-circle" text="All payments verified!" sub="No pending payments." />
      ) : (
        pendingPayments.map((p) => {
          const match = joinedMatches.find(
            (m: any) => m.tournamentId === p.tournamentId && m.paymentStatus === "pending"
          );
          return (
            <View key={p.id} style={s.payCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={[s.tName, { flex: 1 }]}>{p.tournamentTitle || "Tournament"}</Text>
                <View style={s.badgeWarn}>
                  <Text style={[s.badgeText, { color: C.warning }]}>PENDING</Text>
                </View>
              </View>
              <Text style={s.tMeta}>Amount: ₹{p.amount}</Text>
              <Text style={s.tMeta}>UPI: {p.upiId}</Text>
              <Text style={s.tMeta}>Time: {new Date(p.createdAt).toLocaleString()}</Text>
              {p.screenshot ? (
                <Image source={{ uri: p.screenshot }} style={s.screenshot} resizeMode="cover" />
              ) : (
                <View style={s.noScreenshot}>
                  <Feather name="image" size={20} color={C.muted} />
                  <Text style={[s.tMeta, { marginTop: 4 }]}>No screenshot uploaded</Text>
                </View>
              )}
              <View style={[s.row, { gap: 10, marginTop: 8 }]}>
                <Pressable
                  style={s.rejectBtn}
                  onPress={() => onReject(p.id, match?.id ?? "", p.tournamentTitle ?? "Tournament")}
                >
                  <Feather name="x-circle" size={15} color={C.danger} />
                  <Text style={{ color: C.danger, fontWeight: "600" }}>Reject</Text>
                </Pressable>
                <Pressable
                  style={s.verifyBtn}
                  onPress={() => onVerify(p.id, match?.id ?? "", p.tournamentTitle ?? "Tournament")}
                >
                  <Feather name="check-circle" size={15} color="#000" />
                  <Text style={{ color: "#000", fontWeight: "700" }}>Verify</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      <SectionTitle>All Payments ({payments.length})</SectionTitle>
      {payments.length === 0 ? (
        <EmptyCard icon="inbox" text="No payments yet." sub="" />
      ) : (
        payments.map((p) => (
          <View key={p.id} style={[s.payCard, p.status !== "pending" && { opacity: 0.55 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[s.tName, { flex: 1 }]}>{p.tournamentTitle || "Tournament"}</Text>
              <View
                style={[
                  s.badgeWarn,
                  p.status === "verified" && { backgroundColor: "rgba(34,197,94,0.15)" },
                  p.status === "failed" && { backgroundColor: "rgba(239,68,68,0.15)" },
                ]}
              >
                <Text
                  style={[
                    s.badgeText,
                    p.status === "verified" && { color: C.success },
                    p.status === "failed" && { color: C.danger },
                    p.status === "pending" && { color: C.warning },
                  ]}
                >
                  {p.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={s.tMeta}>₹{p.amount} · {new Date(p.createdAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function RoomTab({
  firestoreTournaments,
  roomTargetId,
  roomId,
  roomPass,
  settingRoom,
  onSelectTournament,
  onSetRoomId,
  onSetRoomPass,
  onSubmit,
}: {
  firestoreTournaments: Tournament[];
  roomTargetId: string;
  roomId: string;
  roomPass: string;
  settingRoom: boolean;
  onSelectTournament: (id: string) => void;
  onSetRoomId: (v: string) => void;
  onSetRoomPass: (v: string) => void;
  onSubmit: () => void;
}) {
  const eligible = firestoreTournaments.filter((t) => t.status !== "completed");
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Set Room ID & Password</Text>
      <Text style={[s.tMeta, { marginBottom: 14, lineHeight: 20 }]}>
        Select a Firebase tournament and set its room details. This makes the match go LIVE and players will see the Room ID in their app.
      </Text>

      <Label>Select Tournament</Label>
      {eligible.length === 0 ? (
        <Text style={[s.tMeta, { marginBottom: 12 }]}>
          No active Firebase tournaments. Create one in the Tournaments tab first.
        </Text>
      ) : (
        eligible.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onSelectTournament(t.id)}
            style={[
              s.selectRow,
              roomTargetId === t.id && {
                borderColor: C.primary,
                backgroundColor: "rgba(255,107,0,0.08)",
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.tName}>{t.title}</Text>
              <Text style={s.tMeta}>{t.date} · {t.time}</Text>
              {t.roomId ? (
                <Text style={[s.tMeta, { color: C.success }]}>
                  Current: {t.roomId} / {t.roomPassword}
                </Text>
              ) : null}
            </View>
            {roomTargetId === t.id && (
              <Feather name="check-circle" size={20} color={C.primary} />
            )}
          </Pressable>
        ))
      )}

      <Label>Room ID</Label>
      <TextInput
        style={s.input}
        placeholder="e.g. FF9834"
        placeholderTextColor={C.muted}
        value={roomId}
        onChangeText={onSetRoomId}
        autoCapitalize="none"
      />

      <Label>Room Password</Label>
      <TextInput
        style={s.input}
        placeholder="e.g. 4321"
        placeholderTextColor={C.muted}
        value={roomPass}
        onChangeText={onSetRoomPass}
        autoCapitalize="none"
      />

      <Pressable
        style={[s.primaryBtn, { marginTop: 12 }, settingRoom && { opacity: 0.5 }]}
        onPress={onSubmit}
        disabled={settingRoom}
      >
        {settingRoom ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={s.primaryBtnText}>Set Room & Go Live 🔥</Text>
        )}
      </Pressable>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function EmptyCard({ icon, text, sub }: { icon: any; text: string; sub: string }) {
  return (
    <View style={s.emptyCard}>
      <Feather name={icon} size={30} color={C.muted} />
      <Text style={s.tName}>{text}</Text>
      {sub ? <Text style={s.tMeta}>{sub}</Text> : null}
    </View>
  );
}

function PillRow({
  options,
  value,
  onSelect,
  labels,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  labels?: string[];
}) {
  return (
    <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 4 }]}>
      {options.map((opt, i) => (
        <Pressable
          key={opt}
          onPress={() => onSelect(opt)}
          style={[s.pill, value === opt && s.pillActive]}
        >
          <Text style={[s.pillText, value === opt && { color: "#000" }]}>
            {labels ? labels[i] : opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function StatusBadge({ status }: { status: Tournament["status"] }) {
  const bg =
    status === "live"
      ? "rgba(34,197,94,0.18)"
      : status === "completed"
      ? "rgba(107,107,138,0.18)"
      : "rgba(255,107,0,0.18)";
  const color =
    status === "live" ? C.success : status === "completed" ? C.muted : C.primary;
  return (
    <View style={[s.badge, { backgroundColor: bg, alignSelf: "flex-start", marginTop: 6 }]}>
      <Text style={[s.badgeText, { color }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loginWrap: { flex: 1, justifyContent: "center", padding: 24 },
  loginBody: { alignItems: "center" },
  shield: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.card, borderWidth: 2, borderColor: C.primary,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  loginTitle: { fontSize: 28, fontWeight: "700", color: C.text, marginBottom: 8 },
  loginSub: { fontSize: 14, color: C.muted, marginBottom: 32, textAlign: "center" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.input, borderRadius: 12, borderWidth: 1,
    borderColor: C.inputBorder, marginBottom: 16, width: "100%",
  },
  loginInput: { flex: 1, height: 52, color: C.text, fontSize: 16 },
  loginBtn: {
    backgroundColor: C.primary, borderRadius: 12, height: 52,
    width: "100%", alignItems: "center", justifyContent: "center",
  },
  loginBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  backBtn: { padding: 8 },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(239,68,68,0.12)", paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(239,68,68,0.25)",
  },
  errorBannerText: { color: C.danger, fontSize: 12, flex: 1, lineHeight: 18 },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabText: { fontSize: 11, color: C.muted, fontWeight: "600" },
  tabTextActive: { color: C.primary },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 12 },

  label: { fontSize: 12, color: C.muted, marginBottom: 5, marginTop: 10, fontWeight: "600", letterSpacing: 0.3 },
  input: {
    backgroundColor: C.input, borderRadius: 10, borderWidth: 1,
    borderColor: C.inputBorder, paddingHorizontal: 14,
    height: 46, color: C.text, fontSize: 15, marginBottom: 2,
  },

  row: { flexDirection: "row", gap: 10 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.inputBorder,
    backgroundColor: C.input,
  },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillText: { color: C.muted, fontWeight: "600", fontSize: 13 },

  cancelBtn: {
    flex: 1, borderRadius: 10, borderWidth: 1, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center", height: 46,
  },
  primaryBtn: {
    flex: 1, backgroundColor: C.primary, borderRadius: 10,
    alignItems: "center", justifyContent: "center", height: 46,
    flexDirection: "row", gap: 8,
  },
  primaryBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, marginBottom: 20,
  },
  createBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginTop: 8, marginBottom: 10 },
  emptyCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 24,
    alignItems: "center", gap: 8, marginBottom: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },

  tRow: {
    flexDirection: "row", backgroundColor: C.card, borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.cardBorder,
    alignItems: "flex-start",
  },
  tName: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 3 },
  tMeta: { fontSize: 12, color: C.muted, marginBottom: 1 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: C.input,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.inputBorder,
  },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeWarn: { backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },

  payCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder,
  },
  screenshot: { width: "100%", height: 170, borderRadius: 10, marginTop: 10, marginBottom: 4 },
  noScreenshot: {
    height: 70, borderRadius: 10, borderWidth: 1, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center", marginTop: 8, borderStyle: "dashed",
  },
  rejectBtn: {
    flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center",
    borderRadius: 10, borderWidth: 1, borderColor: C.danger, height: 40,
  },
  verifyBtn: {
    flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center",
    backgroundColor: C.success, borderRadius: 10, height: 40,
  },

  selectRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.input,
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.inputBorder,
  },
});
