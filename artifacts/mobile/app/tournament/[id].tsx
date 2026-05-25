import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { PaymentModal } from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTournaments } from "@/contexts/TournamentContext";
import { useColors } from "@/hooks/useColors";

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tournaments, joinTournament, getJoinedMatch } = useTournaments();
  const [paymentVisible, setPaymentVisible] = useState(false);

  const tournament = tournaments.find((t) => t.id === id);
  const joined = user ? getJoinedMatch(id ?? "", user.id) : undefined;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 20 : insets.bottom + 20;

  if (!tournament) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Tournament not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const slotsLeft = tournament.totalSlots - tournament.filledSlots;
  const fillPercent = (tournament.filledSlots / tournament.totalSlots) * 100;
  const isFull = slotsLeft <= 0;
  const isCompleted = tournament.status === "completed";

  const statusColor =
    tournament.status === "live"
      ? colors.success
      : tournament.status === "completed"
      ? colors.mutedForeground
      : colors.primary;

  async function handleJoinPress() {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (joined) {
      Alert.alert("Already Joined", "You have already joined this tournament.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaymentVisible(true);
  }

  async function handlePaymentConfirm(upiId: string, screenshot: string) {
    if (!user || !tournament) return;
    await joinTournament(tournament.id, user.id, {
      userId: user.id,
      tournamentId: tournament.id,
      tournamentTitle: tournament.title,
      amount: tournament.entryFee,
      screenshot,
      status: "pending",
      upiId,
    });
    setPaymentVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Registration Submitted!",
      "Your payment screenshot has been submitted. Your slot will be confirmed within 2 hours. Check 'My Matches' for updates.",
      [{ text: "View My Matches", onPress: () => router.push("/(tabs)/my-matches") }, { text: "OK" }]
    );
  }

  const prizeDistribution = [
    { rank: "1st Place", prize: Math.floor(tournament.prizePool * 0.5) },
    { rank: "2nd Place", prize: Math.floor(tournament.prizePool * 0.25) },
    { rank: "3rd Place", prize: Math.floor(tournament.prizePool * 0.15) },
    { rank: "Per Kill", prize: Math.floor(tournament.prizePool * 0.001) },
  ];

  const rules = [
    "Only registered Free Fire IDs allowed",
    "Players must join room 10 mins before match",
    "Disconnection = eliminated, no restarts",
    "Teaming with other squads is prohibited",
    "Admin decision is final",
    "Entry fee is non-refundable after room shared",
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navHeader, { paddingTop: topPadding + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          {tournament.title}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {tournament.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>{tournament.title}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.metaItem}>
                  <Feather name="users" size={13} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{tournament.type}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="map-pin" size={13} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{tournament.map}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {[
              { label: "Entry Fee", value: `₹${tournament.entryFee}`, color: colors.primary },
              { label: "Prize Pool", value: `₹${tournament.prizePool.toLocaleString()}`, color: colors.accent },
              { label: "Date", value: tournament.date, color: colors.foreground },
              { label: "Time", value: tournament.time, color: colors.foreground },
              { label: "Total Slots", value: tournament.totalSlots.toString(), color: colors.foreground },
              { label: "Slots Left", value: slotsLeft.toString(), color: slotsLeft <= 5 ? colors.destructive : colors.success },
            ].map((item) => (
              <View key={item.label} style={[styles.statBox, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statBoxLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.statBoxValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {tournament.filledSlots} / {tournament.totalSlots} filled
              </Text>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {Math.round(fillPercent)}%
              </Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
              <View
                style={[styles.progressFill, { width: `${fillPercent}%` as any, backgroundColor: isFull ? colors.destructive : colors.primary }]}
              />
            </View>
          </View>
        </View>

        {tournament.status === "live" && tournament.roomId && (
          <View style={[styles.roomCard, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}>
            <View style={styles.roomHeader}>
              <Feather name="wifi" size={16} color={colors.success} />
              <Text style={[styles.roomTitle, { color: colors.success }]}>Match is LIVE — Room Details</Text>
            </View>
            <View style={styles.roomDetails}>
              <View style={[styles.roomDetail, { backgroundColor: colors.card }]}>
                <Text style={[styles.roomDetailLabel, { color: colors.mutedForeground }]}>Room ID</Text>
                <Text style={[styles.roomDetailValue, { color: colors.foreground }]}>{tournament.roomId}</Text>
              </View>
              <View style={[styles.roomDetail, { backgroundColor: colors.card }]}>
                <Text style={[styles.roomDetailLabel, { color: colors.mutedForeground }]}>Password</Text>
                <Text style={[styles.roomDetailValue, { color: colors.foreground }]}>{tournament.roomPassword}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Prize Distribution</Text>
          {prizeDistribution.map((item, i) => (
            <View key={i} style={styles.prizeRow}>
              <Text style={[styles.prizeRank, { color: colors.mutedForeground }]}>{item.rank}</Text>
              <Text style={[styles.prizeAmount, { color: i === 0 ? colors.accent : colors.foreground }]}>
                ₹{item.prize.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rules</Text>
          {rules.map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={[styles.ruleBullet, { backgroundColor: colors.primary }]} />
              <Text style={[styles.ruleText, { color: colors.mutedForeground }]}>{rule}</Text>
            </View>
          ))}
        </View>

        {joined ? (
          <View style={[styles.joinedCard, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}>
            <Feather name="check-circle" size={24} color={colors.success} />
            <Text style={[styles.joinedTitle, { color: colors.success }]}>You're Registered!</Text>
            <Text style={[styles.joinedSub, { color: colors.mutedForeground }]}>
              Payment: {joined.paymentStatus === "verified" ? "Verified ✓" : "Under Review (2 hrs)"}
            </Text>
          </View>
        ) : isCompleted ? (
          <View style={[styles.disabledBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.disabledBtnText, { color: colors.mutedForeground }]}>Tournament Ended</Text>
          </View>
        ) : isFull ? (
          <View style={[styles.disabledBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.disabledBtnText, { color: colors.mutedForeground }]}>Tournament Full</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            onPress={handleJoinPress}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={18} color={colors.primaryForeground} />
            <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>
              Join Tournament — ₹{tournament.entryFee}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <PaymentModal
        visible={paymentVisible}
        onClose={() => setPaymentVisible(false)}
        onConfirm={handlePaymentConfirm}
        amount={tournament.entryFee}
        tournamentTitle={tournament.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontWeight: "600" },
  backLink: { fontSize: 15, fontWeight: "700" },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  scroll: { padding: 20, gap: 14 },
  heroCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  heroMeta: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: { width: "31%", borderRadius: 10, padding: 10, alignItems: "center" },
  statBoxLabel: { fontSize: 10, marginBottom: 3 },
  statBoxValue: { fontSize: 14, fontWeight: "700" },
  progressSection: { gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 11 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  roomCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  roomHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  roomTitle: { fontSize: 14, fontWeight: "700" },
  roomDetails: { flexDirection: "row", gap: 10 },
  roomDetail: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  roomDetailLabel: { fontSize: 10, marginBottom: 4 },
  roomDetailValue: { fontSize: 18, fontWeight: "800", letterSpacing: 2 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  prizeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prizeRank: { fontSize: 13 },
  prizeAmount: { fontSize: 14, fontWeight: "700" },
  ruleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ruleBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  ruleText: { fontSize: 13, flex: 1, lineHeight: 18 },
  joinedCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  joinedTitle: { fontSize: 18, fontWeight: "800" },
  joinedSub: { fontSize: 13 },
  disabledBtn: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center" },
  disabledBtnText: { fontSize: 15, fontWeight: "600" },
  joinBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  joinBtnText: { fontSize: 16, fontWeight: "800" },
});
