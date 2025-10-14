import { auth, database } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// -------------------- SIGNUP --------------------
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const username = document.getElementById("signup-username").value;

  try {
    // Create account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Optional: set display name in Auth profile
    await updateProfile(user, { displayName: username });

    // ✅ Wait for the database write to complete
    await set(ref(database, "users/" + user.uid), {
      username: username,
      points: 1000,
      cards: {}
    });

    alert("Account created! Redirecting to dashboard...");
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Signup error:", error);
    alert(error.message);
  }
});

// -------------------- LOGIN --------------------
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});
