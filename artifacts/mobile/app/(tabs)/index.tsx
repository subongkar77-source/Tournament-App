import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TournamentCard } from "@/components/TournamentCard";
import { useAuth } from "@/contexts/AuthContext";
import { Tournament, useTournaments } from "@/contexts/TournamentContext";
import { useColors } from "@/hooks/useColors";

const FILTERS = ["All", "Solo", "Duo", "Squad", "Live"] as const;
type Filter = (typeof FILTERS)[number];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tournaments, joinedMatches } = useTournaments();
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = tournaments.filter((t) => {
    if (filter === "Live") return t.status === "live";
    if (filter === "All") return true;
    return t.type === filter;
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name ?? "Player"}
          </Text>
        </View>
        <View style={[styles.ffIdBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="cpu" size={12} color={colors.primary} />
          <Text style={[styles.ffIdText, { color: colors.primary }]}>{user?.ffId ?? "—"}</Text>
        </View>
      </View>

      <View style={[styles.prizeBar, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
        <Feather name="gift" size={14} color={colors.accent} />
        <Text style={[styles.prizeBarText, { color: colors.foreground }]}>
          Total prize pools up to{" "}
          <Text style={{ color: colors.accent, fontWeight: "800" }}>₹30,000</Text>
        </Text>
      </View>

      <View style={styles.filtersWrap}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                {
                  backgroundColor: filter === item ? colors.primary : colors.card,
                  borderColor: filter === item ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(item)}
              activeOpacity={0.8}
            >
              {item === "Live" && filter === item && (
                <View style={[styles.liveDot, { backgroundColor: colors.primaryForeground }]} />
              )}
              <Text
                style={[
                  styles.filterText,
                  { color: filter === item ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Tournament }) => (
          <TournamentCard
            tournament={item}
            onPress={() => router.push(`/tournament/${item.id}`)}
            joined={joinedMatches.some(
              (m) => m.tournamentId === item.id && m.userId === user?.id
            )}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No tournaments found
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
    paddingBottom: 12,
  },
  greeting: { fontSize: 12 },
  userName: { fontSize: 20, fontWeight: "800" },
  ffIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  ffIdText: { fontSize: 12, fontWeight: "700" },
  prizeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  prizeBarText: { fontSize: 13 },
  filtersWrap: { marginBottom: 8 },
  filters: { paddingHorizontal: 20, gap: 8 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { alignItems: "center", gap: 10, paddingTop: 60 },
  emptyText: { fontSize: 15 },
});
