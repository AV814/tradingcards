import { auth, database } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  ref,
  set,
  get
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// === SIGN UP ===
const signupForm = document.getElementById("signup-form");
if (signupForm) {
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
      // Create the auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Double-check that this user does not already exist in DB
      const userRef = ref(database, "users/" + user.uid);
      const existing = await get(userRef);

      if (!existing.exists()) {
        await set(userRef, {
          username: username,
          email: email,
          points: 500,
          cards: {},
          profilePicture: "images/default-pfp.png"
        });
      }

      alert("✅ Account created successfully! Redirecting to dashboard...");
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("That email is already registered. Please log in instead.");
      } else {
        alert(`❌ Error creating account: ${error.message}`);
      }
    }
  });
}

// === LOGIN ===
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("Please enter both email and password!");
      return;
    }

    try {
      // Sign in existing user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check that a user record actually exists in the database
      const userRef = ref(database, "users/" + user.uid);
      const userSnap = await get(userRef);

      if (!userSnap.exists()) {
        alert("⚠️ No database record found for this account. Please sign up again.");
        await signOut(auth);
        return;
      }

      console.log("✅ Login successful for:", email);
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);
      alert(`❌ Login error: ${error.message}`);
    }
  });
}
