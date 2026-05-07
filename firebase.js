import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLZRnI8hbevMFgw16Y7wnBHcwBBaKg0tU",
  authDomain: "kaeru-code-note.firebaseapp.com",
  projectId: "kaeru-code-note",
  storageBucket: "kaeru-code-note.firebasestorage.app",
  messagingSenderId: "27225290856",
  appId: "1:27225290856:web:a76165aec87b2b4ae963dd"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export {
  db,
  auth
};