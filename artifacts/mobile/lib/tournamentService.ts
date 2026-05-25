import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import type { Tournament } from "@/contexts/TournamentContext";

const COL = "tournaments";

export type FirestoreTournament = Omit<Tournament, "id"> & {
  createdAt?: Timestamp;
};

export async function fetchTournaments(): Promise<Tournament[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as FirestoreTournament) }));
}

export function subscribeTournaments(
  onChange: (tournaments: Tournament[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as FirestoreTournament),
      }));
      onChange(data);
    },
    onError
  );
}

export async function createTournament(
  data: Omit<Tournament, "id" | "isCustom">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    isCustom: true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTournament(
  id: string,
  updates: Partial<Tournament>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...updates });
}

export async function deleteTournament(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
