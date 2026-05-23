import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { JoinedMatch, useTournaments } from "@/contexts/TournamentContext";
import { useColors } from "@/hooks/useColors";

export default function MyMatchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { joinedMatches, refreshData } = useTournaments();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  const myMatches = joinedMatches.filter((m) => m.userId === user?.id);

  function paymentStatusColor(status: string) {
    if (status === "verified") return colors.success;
    if (status === "failed") return colors.destructive;
    return colors.accent;
  }

  function paymentStatusLabel(status: string) {
    if (status === "verified") return "Payment Verified";
    if (status === "failed") return "Payment Failed";
    return "Verification Pending";
  }

  function renderItem({ item }: { item: JoinedMatch }) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.matchTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.tournamentTitle}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: paymentStatusColor(item.paymentStatus) + "22" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: paymentStatusColor(item.paymentStatus) }]}
            />
            <Text style={[styles.statusText, { color: paymentStatusColor(item.paymentStatus) }]}>
              {paymentStatusLabel(item.paymentStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.type}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.time}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Entry Fee</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>₹{item.entryFee}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Prize Pool</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              ₹{item.prizePool.toLocaleString()}
            </Text>
          </View>
          {item.position ? (
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Position</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>#{item.position}</Text>
            </View>
          ) : (
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Status</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {item.paymentStatus === "pending" && (
          <View style={[styles.pendingNote, { backgroundColor: colors.accent + "18" }]}>
            <Feather name="info" size={12} color={colors.accent} />
            <Text style={[styles.pendingNoteText, { color: colors.accent }]}>
              Payment screenshot under review. Slot will be confirmed within 2 hours.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Matches</Text>
        <TouchableOpacity onPress={refreshData}>
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={myMatches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="target" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Matches Yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Join a tournament from the home screen to get started.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: "800" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  matchTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  divider: { height: 1, marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 10, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: "700" },
  pendingNote: { flexDirection: "row", gap: 6, marginTop: 12, padding: 10, borderRadius: 8, alignItems: "flex-start" },
  pendingNoteText: { fontSize: 11, flex: 1, lineHeight: 16 },
  empty: { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
