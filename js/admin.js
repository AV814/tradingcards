import { database } from "./firebase.js";
import {
  ref,
  onValue,
  update,
  get,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const cardList = document.getElementById("card-list");
const countdownEl = document.getElementById("countdown");
const forceBtn = document.getElementById("force-update");

let intervalSeconds = 180; // update every 3 minutes
let countdown = intervalSeconds;

// Load and display all cards
const cardsRef = ref(database, "cards");
onValue(cardsRef, (snapshot) => {
  const cards = snapshot.val();
  cardList.innerHTML = "";
  for (const [id, data] of Object.entries(cards)) {
    const div = document.createElement("div");
    div.classList.add("card-item");
    div.innerHTML = `
      <h3>${data.name}</h3>
      <p>Price: ${data.price} pts</p>
      <p>Stock: ${data.stock}</p>
    `;
    cardList.appendChild(div);
  }
});

// Demand-based price adjustments
async function updatePrices() {
  const snapshot = await get(cardsRef);
  const cards = snapshot.val();

  const txSnapshot = await get(ref(database, "transactions"));
  const transactions = txSnapshot.val() || {};

  for (const [id, card] of Object.entries(cards)) {
    let price = parseInt(card.price);
    let stock = parseInt(card.stock);

    // Random base change ±10–20%
    const direction = Math.random() < 0.5 ? -1 : 1;
    const percentChange = Math.random() * 0.1 + 0.1;
    let newPrice = Math.round(price + price * percentChange * direction);

    // Demand logic:
    // Each transaction entry looks like { action: "buy"/"sell", card: "Barrel" }
    const cardTransactions = Object.values(transactions).filter(
      (tx) => tx.card === card.name
    );

    const buys = cardTransactions.filter((t) => t.action === "buy").length;
    const sells = cardTransactions.filter((t) => t.action === "sell").length;

    if (buys > sells) {
      // More buys than sells → push price up slightly
      newPrice += Math.round(price * 0.05);
    } else if (sells > buys) {
      // More sells than buys → price dips slightly
      newPrice -= Math.round(price * 0.05);
    }

    // Keep safe range
    if (newPrice < 10) newPrice = 10;
    if (newPrice > 500) newPrice = 500;

    await update(ref(database, "cards/" + id), {
      price: String(newPrice),
      lastChange: newPrice > price ? "up" : newPrice < price ? "down" : "same",
    });
  }

  // Clear transactions after applying them (optional)
  await remove(ref(database, "transactions"));

  console.log("✅ Prices updated and demand applied!");
  countdown = intervalSeconds;
}

// Countdown + automatic updating
setInterval(() => {
  countdown--;
  countdownEl.textContent = countdown;
  if (countdown <= 0) updatePrices();
}, 300);

// Manual update button
forceBtn.addEventListener("click", updatePrices);
