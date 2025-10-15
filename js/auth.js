import { auth, database } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Signup
document.getElementById("signup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const username = document.getElementById("signup-username").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Create user data in database
      set(ref(database, 'users/' + user.uid), {
        username: username,
        points: 1000,
        cards: {}
      });
      alert("Account created! Redirecting to dashboard...");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});

// Login
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});
