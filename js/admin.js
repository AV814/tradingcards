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

let intervalSeconds = 100;
let countdown = intervalSeconds;

// Load and display all cards
const cardsRef = ref(database, "cards");

onValue(cardsRef, (snapshot) => {
  const cards = snapshot.val();
  cardList.innerHTML = ""; // clear the old list

  for (const [id, data] of Object.entries(cards)) {
    const div = document.createElement("div");
    div.classList.add("card-item");

    // Visual indicator 🔺 / 🔻
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
      <p class="${indicatorClass}">
        Price: ${data.price} pts ${indicator}
      </p>
      <p>Stock: ${data.stock}</p>
      <p><small>Original: ${data.original_price}</small></p>
    `;

    cardList.appendChild(div);
  }
});

// Utility function to get a new price within a scaled range
function getNewPrice(currentPrice, originalPrice) {
  // Determine min/max based on originalPrice
  const minPrice = Math.max(Math.floor(originalPrice * 0.4), 1);
  const maxPrice = Math.ceil(originalPrice * 2.5);

  // Random fluctuation ±10%
  const changePercent = (Math.random() * 0.2) - 0.1; // -10% to +10%
  let newPrice = Math.round(currentPrice * (1 + changePercent));

  // Clamp to min/max
  newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

  return newPrice;
}

// Demand-based price adjustments + controlled fluctuation
async function updatePrices() {
  const snapshot = await get(cardsRef);
  const cards = snapshot.val();

  const txSnapshot = await get(ref(database, "transactions"));
  const transactions = txSnapshot.val() || {};

  for (const [id, card] of Object.entries(cards)) {
    const currentPrice = parseInt(card.price);
    const originalPrice = parseInt(card.original_price);
    let newPrice = getNewPrice(currentPrice, originalPrice);

    // Demand logic (buy/sell transactions)
    const cardTransactions = Object.values(transactions).filter(
      (tx) => tx.card === card.name
    );
    const buys = cardTransactions.filter((t) => t.action === "buy").length;
    const sells = cardTransactions.filter((t) => t.action === "sell").length;

    if (buys > sells) {
      newPrice += Math.round(originalPrice * 0.05); // push up 5% of original
    } else if (sells > buys) {
      newPrice -= Math.round(originalPrice * 0.05); // push down 5% of original
    }

    // Clamp again to ensure it stays in range
    const minPrice = Math.max(Math.floor(originalPrice * 0.4), 1);
    const maxPrice = Math.ceil(originalPrice * 2.5);
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

    await update(ref(database, "cards/" + id), {
      price: String(newPrice),
      lastChange: newPrice > currentPrice ? "up" : newPrice < currentPrice ? "down" : "same",
    });
  }

  // Clear transactions after applying them
  await remove(ref(database, "transactions"));

  console.log("✅ Prices updated and demand applied!");
  countdown = intervalSeconds;
}

// Countdown + automatic updating
setInterval(() => {
  countdown--;
  countdownEl.textContent = countdown;
  if (countdown <= 0) updatePrices();
}, 1000);

// Manual update button
forceBtn.addEventListener("click", updatePrices);
