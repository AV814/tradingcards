import { auth, database } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const userInfo = document.getElementById("user-info");
const storeContainer = document.getElementById("store");
const logoutBtn = document.getElementById("logout");

let currentUser = null;

// Track login state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userSnap = await get(ref(database, "users/" + user.uid));
    const userData = userSnap.val();
    userInfo.textContent = `${userData.username} — Points: ${userData.points}`;
    loadStore(user.uid, userData.points);
  } else {
    window.location.href = "index.html";
  }
});

async function loadStore(uid, points) {
  const cardsRef = ref(database, "cards");
  onValue(ref(database, "cards"), (snapshot) => {
  const cards = snapshot.val();
  cardContainer.innerHTML = ""; // Clear current display

  // Loop through every card entry
  for (const [id, data] of Object.entries(cards)) {
    const div = document.createElement("div");
    div.classList.add("card-item");

    // 🔺 / 🔻 visual indicator
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

    // Card HTML layout
    div.innerHTML = `
      <h3>${data.name}</h3>
      <p class="${indicatorClass}">
        Price: ${data.price} pts ${indicator}
      </p>
      <p>Stock: ${data.stock}</p>
      <button class="buy-btn" data-id="${id}">Buy</button>
      <button class="sell-btn" data-id="${id}">Sell</button>
    `;

    cardContainer.appendChild(div);
  }

  // You’ll later attach event listeners here for the Buy/Sell buttons
});
}

// Buy card
async function buyCard(uid, cardId) {
  const userRef = ref(database, "users/" + uid);
  const cardRef = ref(database, "cards/" + cardId);

  const [userSnap, cardSnap] = await Promise.all([get(userRef), get(cardRef)]);
  const userData = userSnap.val();
  const cardData = cardSnap.val();

  if (userData.points < cardData.price) {
    alert("Not enough points!");
    return;
  }
  if (cardData.stock <= 0) {
    alert("Out of stock!");
    return;
  }

  // Update values
  const newPoints = userData.points - cardData.price;
  const newStock = cardData.stock - 1;
  const userCards = userData.cards || {};
  userCards[cardId] = (userCards[cardId] || 0) + 1;

  // Write to Firebase
  await update(userRef, { points: newPoints, cards: userCards });
  await update(cardRef, { stock: newStock });

  alert(`You bought a ${cardData.name}!`);
}

// Sell card
async function sellCard(uid, cardId) {
  const userRef = ref(database, "users/" + uid);
  const cardRef = ref(database, "cards/" + cardId);

  const [userSnap, cardSnap] = await Promise.all([get(userRef), get(cardRef)]);
  const userData = userSnap.val();
  const cardData = cardSnap.val();

  const userCards = userData.cards || {};
  if (!userCards[cardId] || userCards[cardId] <= 0) {
    alert("You don’t own this card!");
    return;
  }

  const sellPrice = Math.floor(cardData.price * 0.8); // Sell at 80% of buy price
  const newPoints = userData.points + sellPrice;
  const newStock = cardData.stock + 1;
  userCards[cardId] -= 1;

  if (userCards[cardId] <= 0) delete userCards[cardId]; // Remove if 0 left

  await update(userRef, { points: newPoints, cards: userCards });
  await update(cardRef, { stock: newStock });

  alert(`You sold a ${cardData.name} for ${sellPrice} points!`);
}

// Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});
