import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCtWAAjGXTiNzOHVkH6Yi2rXO_2MplB2PU",
  authDomain: "minigames-dmpodrez.firebaseapp.com",
  projectId: "minigames-dmpodrez",
  storageBucket: "minigames-dmpodrez.firebasestorage.app",
  messagingSenderId: "343940890118",
  appId: "1:343940890118:web:ef2cabb42c15ded6d18d87",
};

const firebaseApp = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});
