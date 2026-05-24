import React, { useState } from 'react';
import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export default function App() {
  const [tournamentName, setTournamentName] = useState("");

  const addTournament = async () => {
    try {
      await addDoc(collection(db, "tournaments"), {
        name: tournamentName,
        createdAt: new Date()
      });
      alert("Tournament add ho gaya!");
      setTournamentName("");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tournament App</h1>
      <input 
        type="text" 
        value={tournamentName}
        onChange={(e) => setTournamentName(e.target.value)}
        placeholder="Tournament ka naam likhein"
      />
      <button onClick={addTournament}>Add Tournament</button>
    </div>
  );
}
