import { database } from "./firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const playerNameEl = document.getElementById("player-name");
const playerPointsEl = document.getElementById("player-points");
const playerPfpEl = document.getElementById("player-pfp");
const cardListEl = document.getElementById("card-list");

// Get UID from URL
const params = new URLSearchParams(window.location.search);
const uid = params.get("id");

if (!uid) {
  playerNameEl.textContent = "Invalid profile link.";
} else {
  loadProfile(uid);
}

async function loadProfile(uid) {
  const userRef = ref(database, "users/" + uid);
  const cardsRef = ref(database, "cards");

  try {
    const [userSnap, cardsSnap] = await Promise.all([get(userRef), get(cardsRef)]);
    const userData = userSnap.val();
    const allCards = cardsSnap.val();

    if (!userData) {
      playerNameEl.textContent = "User not found.";
      return;
    }

    // 🧍 Display username, points, and profile picture
    playerNameEl.textContent = userData.username || "Unknown Player";
    playerPointsEl.textContent = `$${userData.points || 0}`;

    // ✅ Fix: Handle profile picture path correctly
    const pfp = userData.profilePicture;
    if (pfp && (pfp.startsWith("http://") || pfp.startsWith("https://"))) {
      playerPfpEl.src = pfp;
    } else {
      playerPfpEl.src = "images/default-pfp.png";
    }

    // 🎴 Display cards
    const userCards = userData.cards || {};
    if (Object.keys(userCards).length === 0) {
      cardListEl.innerHTML = "<p>This player has no cards yet.</p>";
      return;
    }

    cardListEl.innerHTML = Object.entries(userCards)
      .map(([cardId, quantity]) => {
        const card = allCards[cardId];
        if (!card) return "";
        const image = card.image || "https://via.placeholder.com/100?text=No+Image";
        return `
          <div class="card-item">
            <img src="${image}" alt="${card.name}">
            <h3>${card.name}</h3>
            <p>Owned: ${quantity}</p>
            <p>Value: ${card.price} pts</p>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Error loading profile:", err);
    playerNameEl.textContent = "Error loading profile.";
  }
}
