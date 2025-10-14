import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Check if user is logged in already
onAuthStateChanged(auth, (user) => {
  if (user) {
    // If logged in, go straight to dashboard
    window.location.href = "dashboard.html";
  }
});
