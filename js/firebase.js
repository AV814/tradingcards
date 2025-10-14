// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Your Firebase configuration (replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyCFNJqBf9qarbQ4E8S040ahUqfFRGKjSmI",
  authDomain: "projectcards-e2823.firebaseapp.com",
  databaseURL: "https://projectcards-e2823-default-rtdb.firebaseio.com",
  projectId: "projectcards-e2823",
  storageBucket: "projectcards-e2823.appspot.com",
  messagingSenderId: "813235068497",
  appId: "1:813235068497:web:e31e228531a0a5c1a22270",
  measurementId: "G-H1P4YKHBYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
