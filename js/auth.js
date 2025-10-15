import { auth, database } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- SIGNUP ---
const signupForm = document.getElementById("signup-form");
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const username = document.getElementById("signup-username").value.trim();

  if (!email || !password || !username) {
    alert("Please fill out all fields!");
    return;
  }

  try {
    console.log("Attempting to create Firebase Auth user...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Firebase Auth user created:", user.uid);

    // Write new user data to Realtime Database
    try {
      console.log("Attempting to write user to Realtime Database...");
      await set(ref(database, 'users/' + user.uid), {
        username: username,
        points: 1000,
        cards: {}
      });
      console.log("User written successfully to Realtime Database!");
      alert("Account created! Redirecting to dashboard...");
      window.location.href = "dashboard.html";
    } catch (dbError) {
      console.error("Database write failed:", dbError);
      alert("Account created in Auth, but failed to write to database. Check console for details.");
    }

  } catch (authError) {
    console.error("Signup error:", authError);
    alert(`Error creating account: ${authError.message}`);
  }
});

// --- LOGIN ---
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password!");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
    window.location.href = "dashboard.html";
  } catch (loginError) {
    console.error("Login error:", loginError);
    alert(`Login error: ${loginError.message}`);
  }
});
