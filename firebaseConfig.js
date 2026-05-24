import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhsZJYR-gHQ",
  authDomain: "tournamentapp-5b167.firebaseapp.com",
  projectId: "tournamentapp-5b167",
  storageBucket: "tournamentapp-5b167.appspot.com",
  messagingSenderId: "733396059148",
  appId: "1:733396059148:web:715c0e5a6c11d08d85f818"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
