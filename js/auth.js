import { auth, database } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Signup form
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const username = document.getElementById("signup-username").value;

  try {
    // 1️⃣ Create the auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2️⃣ Ensure the "users" node exists
    const usersRef = ref(database, 'users');
    const usersSnap = await get(usersRef);

    if (!usersSnap.exists()) {
      // If the parent node doesn't exist, create it as an empty object
      await set(usersRef, {});
    }

    // 3️⃣ Create the user entry under their UID
    await set(ref(database, 'users/' + user.uid), {
      username: username,
      points: 1000,
      cards: {}
    });

    // 4️⃣ Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
});
