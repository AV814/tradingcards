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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Write new user data to Realtime Database
    try {
  await set(ref(database, 'users/' + user.uid), {
    username: username,
    points: 1000,
    cards: {}
  });
  console.log("User written successfully");
} catch (err) {
  console.error("Failed to write user:", err);
}


    alert("Account created! Redirecting to dashboard...");
    window.location.href = "dashboard.html";

  } catch (error) {
    alert(`Error creating account: ${error.message}`);
    console.error("Signup error:", error);
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
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(`Login error: ${error.message}`);
    console.error("Login error:", error);
  }
});
