import { auth, database } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ✅ Make sure your store.html has these elements
const userInfo = document.getElementById("user-info");
const cardContainer = document.getElementById("card-container"); // 🔥 FIXED: you used `storeContainer` before
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

// ✅ Load and display all cards live
function loadStore(uid, points) {
  const cardsRef = ref(database, "cards");

  onValue(cardsRef, (snapshot) => {
    const cards = snapshot.val();
    cardContainer.innerHTML = ""; // Clear before rendering new data

    for (const [id, data] of Object.entries(cards)) {
      const div = document.createElement("div");
      div.classList.add("card-item");

      // 🔺 / 🔻 price indicator
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

      div.innerHTML = `
        <h3>${data.name}</h3>
        <img src="${data.image}" alt="${data.name}" class="card-image" />
        <p class="${indicatorClass}">
          Price: ${data.price} pts ${indicator}
        </p>
        <p>Stock: ${data.stock}</p>
        <button class="buy-btn" data-id="${id}">Buy</button>
        <button class="sell-btn" data-id="${id}">Sell</button>
      `;

      cardContainer.appendChild(div);
    }

    // ✅ Attach buy/sell listeners AFTER cards are rendered
    document.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.addEventListener("click", () => buyCard(uid, btn.dataset.id));
    });

    document.querySelectorAll(".sell-btn").forEach((btn) => {
      btn.addEventListener("click", () => sellCard(uid, btn.dataset.id));
    });
  });
}

// ✅ Buy card
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

  const newPoints = userData.points - cardData.price;
  const newStock = cardData.stock - 1;
  const userCards = userData.cards || {};
  userCards[cardId] = (userCards[cardId] || 0) + 1;

  await update(userRef, { points: newPoints, cards: userCards });
  await update(cardRef, { stock: newStock });

  alert(`You bought a ${cardData.name}!`);
}

// ✅ Sell card
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

  const sellPrice = cardData.price;
  const newPoints = userData.points + sellPrice;
  const newStock = cardData.stock + 1;
  userCards[cardId] -= 1;

  if (userCards[cardId] <= 0) delete userCards[cardId];

  await update(userRef, { points: newPoints, cards: userCards });
  await update(cardRef, { stock: newStock });

  alert(`You sold a ${cardData.name} for ${sellPrice} points!`);
}
