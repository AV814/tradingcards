import { auth, database } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const userInfo = document.getElementById("user-info");
const cardContainer = document.getElementById("card-container");

let currentUser = null;
let currentPoints = 0; // ✅ Keep local copy to update display faster

// Track login state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userSnap = await get(ref(database, "users/" + user.uid));
    const userData = userSnap.val();
    currentPoints = userData.points;
    userInfo.textContent = `${userData.username} — Points: ${userData.points}`;
    loadStore(user.uid);
  } else {
    window.location.href = "index.html";
  }
});

// ✅ Load and display all cards
function loadStore(uid) {
  const cardsRef = ref(database, "cards");

  onValue(cardsRef, (snapshot) => {
    const cards = snapshot.val();
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

    // Attach buy/sell listeners AFTER cards render
    document.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.addEventListener("click", () => buyCard(uid, btn.dataset.id));
    });
    document.querySelectorAll(".sell-btn").forEach((btn) => {
      btn.addEventListener("click", () => sellCard(uid, btn.dataset.id));
    });
  });
}

// ✅ Update user points in UI
function updatePointsDisplay(points) {
  currentPoints = points;
  userInfo.textContent = `${currentUser.username || "User"} — Points: ${points}`;
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

  // ✅ Instantly update displayed points
  updatePointsDisplay(newPoints);
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

  const sellPrice = Number(cardData.price);
  const newPoints = Number(userData.points) + sellPrice;
  const newStock = Number(cardData.stock) + 1;

  userCards[cardId] -= 1;
  if (userCards[cardId] <= 0) delete userCards[cardId];

  await update(userRef, { points: newPoints, cards: userCards });
  await update(cardRef, { stock: newStock });

  // ✅ Instantly update displayed points
  updatePointsDisplay(newPoints);
}
