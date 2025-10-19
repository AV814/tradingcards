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

// --- Force-sell function ---
async function forceSellAllCards() {
  console.log("🚨 Starting global card sell + reset...");

  const usersSnap = await get(usersRef);
  const users = usersSnap.val() || {};

  const cardsSnap = await get(cardsRef);
  const cards = cardsSnap.val() || {};

  // Loop through all users
  for (const [uid, user] of Object.entries(users)) {
    let totalRefund = 0;
    if (!user.inventory) continue;

    for (const [cardName, owned] of Object.entries(user.inventory)) {
      const cardData = Object.values(cards).find((c) => c.name === cardName);
      if (cardData) {
        const refundAmount = parseInt(cardData.price) * parseInt(owned);
        totalRefund += refundAmount;
      }
    }

    // Refund points and clear inventory
    const newBalance = (parseInt(user.points) || 0) + totalRefund;
    await update(ref(database, `users/${uid}`), {
      points: newBalance,
      inventory: null,
    });
  }

  // Reset all card prices to their original value
  for (const [id, card] of Object.entries(cards)) {
    await update(ref(database, "cards/" + id), {
      price: card.original_price,
      lastChange: "reset",
    });
  }

  console.log("✅ All cards sold, user inventories cleared, prices reset!");
  alert("✅ Global sell completed! All users refunded and prices reset.");
}

// --- Countdown auto-updates ---
setInterval(() => {
  countdown--;
  countdownEl.textContent = countdown;
  if (countdown <= 0) updatePrices();
}, 1000);

// --- Manual buttons ---
forceBtn.addEventListener("click", updatePrices);
resetBtn.addEventListener("click", forceSellAllCards);
