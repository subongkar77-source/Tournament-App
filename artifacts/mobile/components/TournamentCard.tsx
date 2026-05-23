import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Tournament } from "@/contexts/TournamentContext";

interface Props {
  tournament: Tournament;
  onPress: () => void;
  joined?: boolean;
}

export function TournamentCard({ tournament, onPress, joined }: Props) {
  const colors = useColors();

  const statusColor =
    tournament.status === "live"
      ? colors.success
      : tournament.status === "completed"
      ? colors.mutedForeground
      : colors.primary;

  const statusLabel =
    tournament.status === "live"
      ? "LIVE"
      : tournament.status === "completed"
      ? "ENDED"
      : "UPCOMING";

  const slotsLeft = tournament.totalSlots - tournament.filledSlots;
  const fillPercent = (tournament.filledSlots / tournament.totalSlots) * 100;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {tournament.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {tournament.type}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {tournament.map}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {tournament.time}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Entry</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ₹{tournament.entryFee}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Prize Pool</Text>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            ₹{tournament.prizePool.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Slots Left</Text>
          <Text
            style={[
              styles.statValue,
              { color: slotsLeft <= 5 ? colors.destructive : colors.foreground },
            ]}
          >
            {slotsLeft}
          </Text>
        </View>
      </View>

      <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${fillPercent}%` as any, backgroundColor: colors.primary },
          ]}
        />
      </View>

      {joined && (
        <View style={[styles.joinedBanner, { backgroundColor: colors.success + "22" }]}>
          <Feather name="check-circle" size={12} color={colors.success} />
          <Text style={[styles.joinedText, { color: colors.success }]}>Joined</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  header: { marginBottom: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  meta: { flexDirection: "row", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11 },
  divider: { height: 1, marginBottom: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 10, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: "700" },
  progressBg: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2 },
  joinedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    padding: 6,
    borderRadius: 6,
    justifyContent: "center",
  },
  joinedText: { fontSize: 11, fontWeight: "600" },
});
