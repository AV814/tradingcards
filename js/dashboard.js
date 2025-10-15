import { auth, database } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const userInfo = document.getElementById("user-info");
const cardContainer = document.getElementById("card-container");
const logoutBtn = document.getElementById("logout");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  const userRef = ref(database, "users/" + user.uid);

  try {
    // Check if user node exists
    const userSnap = await get(userRef);
    let userData = userSnap.val();

    if (!userData) {
      console.log("User data not found in DB. Creating default node...");
      // Create default user node
      const defaultUserData = {
        username: user.email.split("@")[0], // fallback username from email
        points: 1000,
        cards: {}
      };
      await set(userRef, defaultUserData);
      userData = defaultUserData;
      console.log("✅ Default user node created");
    }

    // Display user info
    userInfo.textContent = `${userData.username} — Points: ${userData.points}`;

    // Load user's cards
    loadUserCards(userData.cards || {});

  } catch (err) {
    console.error("Error fetching or creating user data:", err);
    alert("Failed to load your data. Please try again.");
  }
});

function loadUserCards(userCards) {
  cardContainer.innerHTML = "";

  if (!userCards || Object.keys(userCards).length === 0) {
    cardContainer.innerHTML = "<p>You don't own any cards yet!</p>";
    return;
  }

  // Fetch all card details to get images
  onValue(ref(database, "cards"), (snapshot) => {
    const allCards = snapshot.val();

    for (const [id, quantity] of Object.entries(userCards)) {
      const cardData = allCards[id];
      if (!cardData) continue; // safety check

      const div = document.createElement("div");
      div.classList.add("card-item");

      div.innerHTML = `
        <h3>${cardData.name}</h3>
        <img src="${cardData.image}" alt="${cardData.name}" class="card-image" />
        <p>Owned: ${quantity}</p>
      `;

      cardContainer.appendChild(div);
    }
  });
}

// Logout button
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
