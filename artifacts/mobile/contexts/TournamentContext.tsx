import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import {
  createTournament as fbCreate,
  deleteTournament as fbDelete,
  subscribeTournaments,
  updateTournament as fbUpdate,
} from "@/lib/tournamentService";

export interface Tournament {
  id: string;
  title: string;
  type: "Solo" | "Duo" | "Squad";
  entryFee: number;
  prizePool: number;
  totalSlots: number;
  filledSlots: number;
  date: string;
  time: string;
  map: string;
  status: "upcoming" | "live" | "completed";
  roomId?: string;
  roomPassword?: string;
  isCustom?: boolean;
}

export interface JoinedMatch {
  id: string;
  tournamentId: string;
  userId: string;
  tournamentTitle: string;
  type: string;
  entryFee: number;
  prizePool: number;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed";
  paymentStatus: "pending" | "verified" | "failed";
  paymentScreenshot?: string;
  position?: number;
  prize?: number;
  joinedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  tournamentId: string;
  tournamentTitle: string;
  amount: number;
  screenshot: string;
  status: "pending" | "verified" | "failed";
  upiId: string;
  createdAt: string;
}

interface TournamentContextType {
  tournaments: Tournament[];
  firestoreTournaments: Tournament[];
  joinedMatches: JoinedMatch[];
  payments: Payment[];
  firebaseError: string | null;
  joinTournament: (
    tournamentId: string,
    userId: string,
    paymentData: Omit<Payment, "id" | "createdAt">
  ) => Promise<void>;
  getJoinedMatch: (tournamentId: string, userId: string) => JoinedMatch | undefined;
  refreshData: () => Promise<void>;
  addTournament: (tournament: Omit<Tournament, "id" | "isCustom">) => Promise<void>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  verifyPayment: (paymentId: string, matchId: string) => Promise<void>;
  rejectPayment: (paymentId: string, matchId: string) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

const JOINED_MATCHES_KEY = "ff_joined_matches";
const PAYMENTS_KEY = "ff_payments";

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: "t1",
    title: "Grand Championship",
    type: "Solo",
    entryFee: 50,
    prizePool: 5000,
    totalSlots: 100,
    filledSlots: 67,
    date: "2026-05-25",
    time: "8:00 PM",
    map: "Bermuda",
    status: "upcoming",
  },
  {
    id: "t2",
    title: "Duo Blitz",
    type: "Duo",
    entryFee: 80,
    prizePool: 8000,
    totalSlots: 50,
    filledSlots: 38,
    date: "2026-05-26",
    time: "6:00 PM",
    map: "Kalahari",
    status: "upcoming",
  },
  {
    id: "t3",
    title: "Squad Wars",
    type: "Squad",
    entryFee: 100,
    prizePool: 15000,
    totalSlots: 25,
    filledSlots: 20,
    date: "2026-05-24",
    time: "9:00 PM",
    map: "Purgatory",
    status: "live",
    roomId: "FF2345",
    roomPassword: "9876",
  },
  {
    id: "t4",
    title: "Friday Showdown",
    type: "Solo",
    entryFee: 30,
    prizePool: 3000,
    totalSlots: 100,
    filledSlots: 12,
    date: "2026-05-30",
    time: "7:00 PM",
    map: "Bermuda",
    status: "upcoming",
  },
  {
    id: "t5",
    title: "Elite Squad Cup",
    type: "Squad",
    entryFee: 200,
    prizePool: 30000,
    totalSlots: 16,
    filledSlots: 16,
    date: "2026-05-22",
    time: "5:00 PM",
    map: "Alpine",
    status: "completed",
  },
];

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [joinedMatches, setJoinedMatches] = useState<JoinedMatch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [firestoreTournaments, setFirestoreTournaments] = useState<Tournament[]>([]);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
    const unsub = subscribeTournaments(
      (data) => {
        setFirestoreTournaments(data);
        setFirebaseError(null);
      },
      (err) => {
        setFirebaseError(err.message);
      }
    );
    return unsub;
  }, []);

  async function refreshData() {
    try {
      const jmRaw = await AsyncStorage.getItem(JOINED_MATCHES_KEY);
      if (jmRaw) setJoinedMatches(JSON.parse(jmRaw));
      const pRaw = await AsyncStorage.getItem(PAYMENTS_KEY);
      if (pRaw) setPayments(JSON.parse(pRaw));
    } catch {}
  }

  const allTournaments = [...MOCK_TOURNAMENTS, ...firestoreTournaments];

  async function addTournament(tournamentData: Omit<Tournament, "id" | "isCustom">) {
    try {
      await fbCreate(tournamentData);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to create tournament in Firebase");
    }
  }

  async function updateTournament(id: string, updates: Partial<Tournament>) {
    try {
      await fbUpdate(id, updates);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to update tournament in Firebase");
    }
  }

  async function deleteTournament(id: string) {
    try {
      await fbDelete(id);
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to delete tournament from Firebase");
    }
  }

  async function verifyPayment(paymentId: string, matchId: string) {
    const updatedPayments = payments.map((p) =>
      p.id === paymentId ? { ...p, status: "verified" as const } : p
    );
    const updatedMatches = joinedMatches.map((m) =>
      m.id === matchId
        ? { ...m, paymentStatus: "verified" as const, status: "confirmed" as const }
        : m
    );
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(updatedPayments));
    await AsyncStorage.setItem(JOINED_MATCHES_KEY, JSON.stringify(updatedMatches));
    setPayments(updatedPayments);
    setJoinedMatches(updatedMatches);
  }

  async function rejectPayment(paymentId: string, matchId: string) {
    const updatedPayments = payments.map((p) =>
      p.id === paymentId ? { ...p, status: "failed" as const } : p
    );
    const updatedMatches = joinedMatches.map((m) =>
      m.id === matchId ? { ...m, paymentStatus: "failed" as const } : m
    );
    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(updatedPayments));
    await AsyncStorage.setItem(JOINED_MATCHES_KEY, JSON.stringify(updatedMatches));
    setPayments(updatedPayments);
    setJoinedMatches(updatedMatches);
  }

  async function joinTournament(
    tournamentId: string,
    userId: string,
    paymentData: Omit<Payment, "id" | "createdAt">
  ) {
    const tournament = allTournaments.find((t) => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const payment: Payment = {
      ...paymentData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      tournamentTitle: tournament.title,
      createdAt: new Date().toISOString(),
    };

    const joinedMatch: JoinedMatch = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      tournamentId,
      userId,
      tournamentTitle: tournament.title,
      type: tournament.type,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      date: tournament.date,
      time: tournament.time,
      status: "pending",
      paymentStatus: "pending",
      paymentScreenshot: paymentData.screenshot,
      joinedAt: new Date().toISOString(),
    };

    const newPayments = [...payments, payment];
    const newMatches = [...joinedMatches, joinedMatch];

    await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(newPayments));
    await AsyncStorage.setItem(JOINED_MATCHES_KEY, JSON.stringify(newMatches));
    setPayments(newPayments);
    setJoinedMatches(newMatches);
  }

  function getJoinedMatch(tournamentId: string, userId: string) {
    return joinedMatches.find(
      (m) => m.tournamentId === tournamentId && m.userId === userId
    );
  }

  return (
    <TournamentContext.Provider
      value={{
        tournaments: allTournaments,
        firestoreTournaments,
        joinedMatches,
        payments,
        firebaseError,
        joinTournament,
        getJoinedMatch,
        refreshData,
        addTournament,
        updateTournament,
        deleteTournament,
        verifyPayment,
        rejectPayment,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournaments() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournaments must be used within TournamentProvider");
  return ctx;
}
