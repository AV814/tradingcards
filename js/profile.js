import { database } from "./firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const playerNameEl = document.getElementById("player-name");
const playerPointsEl = document.getElementById("player-points");
const cardListEl = document.getElementById("card-list");

// Helper: read user id from URL
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

  const [userSnap, cardsSnap] = await Promise.all([get(userRef), get(cardsRef)]);
  const userData = userSnap.val();
  const allCards = cardsSnap.val();

  if (!userData) {
    playerNameEl.textContent = "User not found.";
    return;
  }

  playerNameEl.textContent = userData.name || "Unknown Player";
  playerPointsEl.textContent = `${userData.points || 0} pts`;

  const userCards = userData.cards || {};
  if (Object.keys(userCards).length === 0) {
    cardListEl.innerHTML = "<p>This player has no cards yet.</p>";
    return;
  }

  cardListEl.innerHTML = Object.entries(userCards)
    .map(([cardId, quantity]) => {
      const card = allCards[cardId];
      if (!card) return "";
      return `
        <div class="card-item">
          <h3>${card.name}</h3>
          <p>Owned: ${quantity}</p>
          <p>Current Value: ${card.price} pts</p>
        </div>
      `;
    })
    .join("");
}
