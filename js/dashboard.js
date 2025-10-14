import { auth, database } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const welcomeText = document.getElementById("welcome");
const pointsText = document.getElementById("points");
const cardList = document.getElementById("card-list");
const logoutBtn = document.getElementById("logout");

// Check login state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Load user data
    const snapshot = await get(ref(database, "users/" + user.uid));
    const userData = snapshot.val();

    if (userData) {
      welcomeText.textContent = `Welcome, ${userData.username}!`;
      pointsText.textContent = `Cash: $${userData.points}`;

      // Show cards (empty if none)
      cardList.innerHTML = "";
      if (userData.cards && Object.keys(userData.cards).length > 0) {
        for (const [cardName, amount] of Object.entries(userData.cards)) {
          const li = document.createElement("li");
          li.textContent = `${cardName} ×${amount}`;
          cardList.appendChild(li);
        }
      } else {
        cardList.innerHTML = "<li>You have no cards yet.</li>";
      }
    }
  } else {
    // If not logged in, go back to homepage
    window.location.href = "index.html";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
