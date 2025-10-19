import { database } from "./firebase.js";
import {
  ref,
  onValue,
  update,
  get,
  remove,
  set,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const cardList = document.getElementById("card-list");
const countdownEl = document.getElementById("countdown");
const forceBtn = document.getElementById("force-update");
const resetBtn = document.getElementById("force-sell"); // Add this button in your HTML

let intervalSeconds = 100;
let countdown = intervalSeconds;

const cardsRef = ref(database, "cards");
const usersRef = ref(database, "users");

// --- Display all cards in admin dashboard ---
onValue(cardsRef, (snapshot) => {
  const cards = snapshot.val();
  cardList.innerHTML = "";

  for (const [id, data] of Object.entries(cards)) {
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

    const tierDisplay = data.tier ? `Tier ${data.tier}` : "Tier ?";

    const div = document.createElement("div");
    div.classList.add("card-item");
    div.innerHTML = `
      <h3>${data.name}</h3>
      <p class="${indicatorClass}">Price: ${data.price} pts ${indicator}</p>
      <p>Stock: ${data.stock}</p>
      <p><small>Original: ${data.original_price}</small></p>
      <p><small>${tierDisplay}</small></p>
    `;

    cardList.appendChild(div);
  }
});

// --- Volatility multiplier based on tier ---
function getTierVolatility(tier) {
  switch (parseInt(tier)) {
    case 1:
      return 0.05; // ±5%
    case 2:
      return 0.10; // ±10%
    case 3:
      return 0.20; // ±20%
    case 4:
      return 0.35; // ±35%
    case 5:
      return 0.50; // ±50%
    default:
      return 0.10; // fallback
  }
}

// --- Generate new price based on tier volatility ---
function getNewPrice(currentPrice, originalPrice, tier) {
  const minPrice = Math.max(Math.floor(originalPrice * 0.4), 1);
  const maxPrice = Math.ceil(originalPrice * 2.5);

  const volatility = getTierVolatility(tier);
  const changePercent = (Math.random() * (volatility * 2)) - volatility; // e.g. -10% to +10%
  let newPrice = Math.round(currentPrice * (1 + changePercent));

  return Math.max(minPrice, Math.min(maxPrice, newPrice));
}

// --- Regular price updates with demand system ---
async function updatePrices() {
  const snapshot = await get(cardsRef);
  const cards = snapshot.val();
  const txSnapshot = await get(ref(database, "transactions"));
  const transactions = txSnapshot.val() || {};

  for (const [id, card] of Object.entries(cards)) {
    const currentPrice = parseInt(card.price);
    const originalPrice = parseInt(card.original_price);
    const tier = card.tier || 1;
    let newPrice = getNewPrice(currentPrice, originalPrice, tier);

    // Demand adjustments
    const cardTransactions = Object.values(transactions).filter(
      (tx) => tx.card === card.name
    );
    const buys = cardTransactions.filter((t) => t.action === "buy").length;
    const sells = cardTransactions.filter((t) => t.action === "sell").length;

    if (buys > sells) {
      newPrice += Math.round(originalPrice * 0.05);
    } else if (sells > buys) {
      newPrice -= Math.round(originalPrice * 0.05);
    }

    // Clamp again
    const minPrice = Math.max(Math.floor(originalPrice * 0.4), 1);
    const maxPrice = Math.ceil(originalPrice * 2.5);
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

    await update(ref(database, "cards/" + id), {
      price: String(newPrice),
      lastChange:
        newPrice > currentPrice ? "up" : newPrice < currentPrice ? "down" : "same",
    });
  }

  // Clear transactions
  await remove(ref(database, "transactions"));

  console.log("✅ Prices updated and demand applied!");
  countdown = intervalSeconds;
}

import { database } from "./firebase.js";
import {
  ref,
  onValue,
  update,
  get,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const cardList = document.getElementById("card-list");
const countdownEl = document.getElementById("countdown");
const forceBtn = document.getElementById("force-update");
const sellAllBtn = document.getElementById("sell-all"); // <-- make sure your HTML has this button

let intervalSeconds = 100;
let countdown = intervalSeconds;

// (existing onValue/cards display/updatePrices functions remain the same)


// 🟢 FORCE SELL + RESET FUNCTION
async function forceSellAndReset() {
  const cardsSnap = await get(ref(database, "cards"));
  const usersSnap = await get(ref(database, "users"));

  if (!cardsSnap.exists() || !usersSnap.exists()) return;

  const cards = cardsSnap.val();
  const users = usersSnap.val();

  // Clone cards so we can track updated stock
  const updatedCards = { ...cards };
  const userUpdates = {};

  for (const [userId, userData] of Object.entries(users)) {
    let userPoints = userData.points || 0;
    const ownedCards = userData.cards || {};

    // Sell each owned card
    for (const [cardName, quantity] of Object.entries(ownedCards)) {
      const card = cards[cardName];
      if (!card) continue;

      const cardPrice = parseInt(card.price);
      const amount = parseInt(quantity);

      // Add value to user points
      userPoints += cardPrice * amount;

      // Return stock
      updatedCards[cardName].stock =
        parseInt(updatedCards[cardName].stock) + amount;
    }

    // Clear user’s cards and update points
    userUpdates[userId] = {
      ...userData,
      points: userPoints,
      cards: {}, // sold everything
    };
  }

  // Reset cards to original prices and stock
  for (const [cardName, cardData] of Object.entries(updatedCards)) {
    updatedCards[cardName].price = parseInt(cardData.original_price);
    updatedCards[cardName].stock = parseInt(cardData.original_stock);
    updatedCards[cardName].lastChange = "reset";
  }

  // Batch updates
  await update(ref(database), {
    cards: updatedCards,
    users: userUpdates,
  });

  console.log("✅ All cards sold, user points updated, and market reset!");
  alert("All players' cards sold and market reset!");
}

// 🔘 Hook up the button
sellAllBtn.addEventListener("click", forceSellAndReset);


// --- Countdown auto-updates ---
setInterval(() => {
  countdown--;
  countdownEl.textContent = countdown;
  if (countdown <= 0) updatePrices();
}, 1000);

// --- Manual buttons ---
forceBtn.addEventListener("click", updatePrices);
resetBtn.addEventListener("click", forceSellAllCards);
