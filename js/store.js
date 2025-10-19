import { auth, database } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, update, get, onValue, off } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { runTransaction } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const userInfo = document.getElementById("user-info");
const cardContainer = document.getElementById("card-container");

let currentUser = null;
let currentPoints = 0;
let currentUserCards = {};
let cardsListener = null;

//Track login state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userSnap = await get(ref(database, "users/" + user.uid));
    const userData = userSnap.val();
    currentPoints = userData.points;
    currentUserCards = userData.cards || {};
    userInfo.textContent = `$${userData.points}`;
    loadStore(user.uid);
  } else {
    window.location.href = "index.html";
  }
});

//Load store once with a listener
function loadStore(uid) {
  const cardsRef = ref(database, "cards");

  // Remove any previous listener
  if (cardsListener) off(cardsRef, "value", cardsListener);

  cardsListener = onValue(cardsRef, async (snapshot) => {
    const cards = snapshot.val();
    if (!cards) return;

    // Refresh user cards once each update
    const userSnap = await get(ref(database, "users/" + uid));
    const userData = userSnap.val();
    currentUserCards = userData.cards || {};
    currentPoints = userData.points;
    userInfo.textContent = `$${currentPoints}`;

    renderStore(cards, uid);
  });
}

//Render store UI
function renderStore(cards, uid) {
  cardContainer.innerHTML = "";

  for (const [id, data] of Object.entries(cards)) {
    const div = document.createElement("div");
    div.classList.add("card-item");

    const indicator =
      data.lastChange === "up"
        ? "🔺"
        : data.lastChange === "down"
        ? "🔻"
        : "";

    const indicatorClass =
      data.lastChange === "up"
        ? "up"
        : data.lastChange === "down"
        ? "down"
        : "";

    const ownedCount = currentUserCards[id] || 0;

    div.innerHTML = `
      <h3>${data.name}</h3>
      <img src="${data.image}" alt="${data.name}" class="card-image" />
      <p class="${indicatorClass}">
        Price: ${data.price} pts ${indicator}
      </p>
      <p>Stock: ${data.stock}</p>
      <p>You own: <strong>${ownedCount}</strong></p>
      <button class="buy-btn" data-id="${id}">Buy</button>
      <button class="sell-btn" data-id="${id}">Sell</button>
    `;

    cardContainer.appendChild(div);
  }

  // Attach listeners
  document.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => buyCard(uid, btn.dataset.id));
  });
  document.querySelectorAll(".sell-btn").forEach((btn) => {
    btn.addEventListener("click", () => sellCard(uid, btn.dataset.id));
  });
}

//Update points in UI
function updatePointsDisplay(points) {
  currentPoints = points;
  userInfo.textContent = `$${points}`;
}

//--- BUY CARD
async function buyCard(uid, cardId) {
  const userRef = ref(database, "users/" + uid);
  const cardRef = ref(database, "cards/" + cardId);

  try {
    await runTransaction(cardRef, (cardData) => {
      if (!cardData) return; // card doesn't exist
      if (cardData.stock <= 0) return; // out of stock

      // Decrease stock
      cardData.stock -= 1;
      return cardData;
    }, { applyLocally: false });

    await runTransaction(userRef, (userData) => {
      if (!userData) return;
      if (userData.points < cardData.price) return; // not enough points

      // Deduct points and give card
      userData.points -= cardData.price;
      if (!userData.cards) userData.cards = {};
      userData.cards[cardId] = (userData.cards[cardId] || 0) + 1;
      return userData;
    });

  } catch (err) {
    console.error("Buy transaction failed:", err);
  }
}

//--- SELL CARD
async function sellCard(uid, cardId) {
  const userRef = ref(database, "users/" + uid);
  const cardRef = ref(database, "cards/" + cardId);

  try {
    await runTransaction(userRef, (userData) => {
      if (!userData || !userData.cards || !userData.cards[cardId]) return;
      
      const cardCount = userData.cards[cardId];
      if (cardCount <= 0) return;

      // Update user’s cards and points
      userData.points += userData.cards[cardId] * 0; // temporary placeholder
      userData.cards[cardId] -= 1;
      if (userData.cards[cardId] <= 0) delete userData.cards[cardId];
      return userData;
    });

    await runTransaction(cardRef, (cardData) => {
      if (!cardData) return;
      cardData.stock += 1;
      return cardData;
    });

  } catch (err) {
    console.error("Sell transaction failed:", err);
  }
}

